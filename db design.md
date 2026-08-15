# Deni Sawa Partners — DeepSeek Build Prompt
## Health Check System · Admin UI · Email & WhatsApp Delivery

> **Scope:** Full database schema, admin UI, API routes, email UI, WhatsApp UI.
> LMS is Phase 2 — reference only. Run all SQL as a single `BEGIN; ... COMMIT;` block.

---

## 1. System Context & Existing Schema

You are an expert PostgreSQL, Supabase, and Next.js 14 architect and UI engineer. You are extending the Deni Sawa Partners platform. Read the existing schema carefully before writing any SQL or code.

### Existing tables (do not drop or recreate)

| Table | Purpose |
|---|---|
| `blog_authors` | Blog content authors |
| `blog_categories` | Blog taxonomy |
| `blog_posts` | Full CMS with markdown/HTML, SEO fields, status enum |
| `lms_courses` | Academy course catalogue |
| `admin_users` | Platform staff with role enum |
| `v_public_blog_posts` | Security-invoker view for public blog reads |
| `storage.deni_sawa` | 10MB bucket — images + PDF |

### Existing helpers

- `public.set_updated_at()` — updated_at trigger function
- `public.make_slug(text)` — URL slug normaliser
- `public.is_blog_admin()` — RLS helper checking admin_users against JWT email
- `public.blog_posts_derive_fields()` — auto slug, reading_time, published_at
- `public.enforce_max_featured_blog_posts()` — max 2 featured posts

### Existing enums

- `post_status`: `draft`, `review`, `scheduled`, `published`, `archived`
- `admin_role`: `super_admin`, `admin`, `manager`, `support`

---

## 2. Required Fixes to Existing Schema

```sql
-- Fix 1: Link admin_users to Supabase Auth
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_auth_user_id
  ON public.admin_users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Fix 2: consultation_bookings referenced in existing RLS but never defined
CREATE TABLE IF NOT EXISTS public.consultation_bookings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  email       citext,
  whatsapp    text,
  message     text,
  source      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR whatsapp IS NOT NULL)
);

ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
```

---

## 3. Health Check Database Tables

```sql
-- ── health_checks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_checks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  slug               citext NOT NULL UNIQUE,
  description        text,
  estimated_minutes  integer,
  tags               text[] NOT NULL DEFAULT '{}',
  is_active          boolean NOT NULL DEFAULT true,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_health_checks_updated_at
  BEFORE UPDATE ON public.health_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── health_check_sections ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_check_sections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_check_id  uuid NOT NULL REFERENCES public.health_checks(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_health_check_sections_updated_at
  BEFORE UPDATE ON public.health_check_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── health_check_subsections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_check_subsections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid NOT NULL REFERENCES public.health_check_sections(id) ON DELETE CASCADE,
  heading     text NOT NULL,
  description text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_health_check_subsections_updated_at
  BEFORE UPDATE ON public.health_check_subsections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── health_check_questions ────────────────────────────────────────────────
-- question_type controls the UI:
--   paragraph     → free-text textarea; answer stored in answer_text
--   single_select → radio buttons; exactly ONE uuid stored in selected_option_ids
--   multi_select  → checkboxes; one or more uuids in selected_option_ids
CREATE TABLE IF NOT EXISTS public.health_check_questions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subsection_id  uuid NOT NULL REFERENCES public.health_check_subsections(id) ON DELETE CASCADE,
  question_text  text NOT NULL,
  question_type  text NOT NULL
    CHECK (question_type IN ('paragraph', 'single_select', 'multi_select')),
  is_required    boolean NOT NULL DEFAULT true,
  helper_text    text,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_health_check_questions_updated_at
  BEFORE UPDATE ON public.health_check_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── health_check_question_options ─────────────────────────────────────────
-- Options for single_select and multi_select questions only.
-- paragraph questions have no rows here.
CREATE TABLE IF NOT EXISTS public.health_check_question_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.health_check_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── health_check_sessions ─────────────────────────────────────────────────
-- Created when a user starts a health check.
-- business_name: required for Business Health Check, optional for Professional.
-- At least one of email / whatsapp must be provided (CHECK constraint).
-- preferred_delivery controls which channel(s) the report is sent to.
CREATE TABLE IF NOT EXISTS public.health_check_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_check_id       uuid NOT NULL REFERENCES public.health_checks(id) ON DELETE CASCADE,
  full_name             text NOT NULL,
  business_name         text,
  email                 citext,
  whatsapp              text,
  preferred_delivery    text NOT NULL DEFAULT 'email'
    CHECK (preferred_delivery IN ('email', 'whatsapp', 'both')),
  ip_address            inet,
  user_agent            text,
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  time_taken_seconds    integer,
  is_complete           boolean NOT NULL DEFAULT false,
  CHECK (email IS NOT NULL OR whatsapp IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_hcs_check_started
  ON public.health_check_sessions(health_check_id, started_at);
CREATE INDEX IF NOT EXISTS idx_hcs_email
  ON public.health_check_sessions(email);
CREATE INDEX IF NOT EXISTS idx_hcs_whatsapp
  ON public.health_check_sessions(whatsapp);
CREATE INDEX IF NOT EXISTS idx_hcs_ip
  ON public.health_check_sessions(ip_address);

-- ── health_check_answers ──────────────────────────────────────────────────
-- One row per question per session.
-- paragraph     → answer_text populated, selected_option_ids = {}
-- single_select → selected_option_ids has exactly 1 uuid, answer_text NULL
-- multi_select  → selected_option_ids has 1+ uuids, answer_text NULL
-- Enforcement of single_select cardinality (max 1 uuid) is done in the API
-- layer by checking question_type before insert.
CREATE TABLE IF NOT EXISTS public.health_check_answers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           uuid NOT NULL REFERENCES public.health_check_sessions(id) ON DELETE CASCADE,
  question_id          uuid NOT NULL REFERENCES public.health_check_questions(id) ON DELETE CASCADE,
  answer_text          text,
  selected_option_ids  uuid[] NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- ── health_check_reports ──────────────────────────────────────────────────
-- Generated after session is complete. One row per report_type per session.
-- lexical_state: Claude API returns Lexical EditorState JSON — stored here.
-- report_url_token: 32-byte hex token used as public access key (no auth needed).
-- is_paid: detailed reports require payment before delivery.
-- delivery_status: tracks whether the report was sent to the user.
CREATE TABLE IF NOT EXISTS public.health_check_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES public.health_check_sessions(id) ON DELETE CASCADE,
  report_type         text NOT NULL CHECK (report_type IN ('summary', 'detailed')),
  lexical_state       jsonb NOT NULL,
  prompt_snapshot     text NOT NULL,
  model_used          text NOT NULL,
  tokens_used         integer,
  generation_seconds  numeric(6,2),
  report_url_token    text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_paid             boolean NOT NULL DEFAULT false,
  delivery_status     text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'skipped')),
  accessed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, report_type)
);

CREATE INDEX IF NOT EXISTS idx_hcr_token
  ON public.health_check_reports(report_url_token);
CREATE INDEX IF NOT EXISTS idx_hcr_session
  ON public.health_check_reports(session_id);
```

---

## 4. Report Prompts Table (Full)

```sql
-- ── health_check_report_prompts ───────────────────────────────────────────
-- Stores AI prompt config per health check per report type.
--
-- TWO prompt columns:
--   system_prompt         → plain text sent directly to Claude API on generation
--   system_prompt_lexical → Lexical EditorState JSON loaded into the admin editor
--
-- Workflow:
--   Admin opens prompt editor → Lexical loads system_prompt_lexical
--   Admin edits → on Save: server converts Lexical JSON to plain text
--   Plain text stored in system_prompt → sent to Claude with zero conversion
--   Lexical JSON stored in system_prompt_lexical → loaded next edit session
--   If system_prompt_lexical is NULL → editor initialises from system_prompt plaintext
--
-- version + previous_system_prompt allow one-step rollback in admin UI.

CREATE TABLE IF NOT EXISTS public.health_check_report_prompts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_check_id         uuid NOT NULL
    REFERENCES public.health_checks(id) ON DELETE CASCADE,
  report_type             text NOT NULL
    CHECK (report_type IN ('summary', 'detailed')),
  system_prompt           text NOT NULL,
  system_prompt_lexical   jsonb,
  model                   text NOT NULL DEFAULT 'claude-sonnet-4-6',
  max_tokens              integer NOT NULL DEFAULT 4000
    CHECK (max_tokens BETWEEN 500 AND 8000),
  is_active               boolean NOT NULL DEFAULT true,
  updated_by              uuid
    REFERENCES public.admin_users(id) ON DELETE SET NULL,
  version                 integer NOT NULL DEFAULT 1,
  previous_system_prompt  text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(health_check_id, report_type)
);

CREATE TRIGGER trg_hc_report_prompts_updated_at
  BEFORE UPDATE ON public.health_check_report_prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-increment version and snapshot previous plain text on every save
CREATE OR REPLACE FUNCTION public.hc_prompt_version_bump()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.system_prompt IS DISTINCT FROM OLD.system_prompt THEN
    NEW.version := OLD.version + 1;
    NEW.previous_system_prompt := OLD.system_prompt;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hc_prompt_version_bump
  BEFORE UPDATE ON public.health_check_report_prompts
  FOR EACH ROW EXECUTE FUNCTION public.hc_prompt_version_bump();

ALTER TABLE public.health_check_report_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_prompts_admin_all
  ON public.health_check_report_prompts FOR ALL TO authenticated
  USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());

CREATE POLICY hc_prompts_service_all
  ON public.health_check_report_prompts FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

---

## 5. Notification & Delivery Tables

```sql
-- ── email_templates ───────────────────────────────────────────────────────
-- Editable branded email templates for all notification types.
-- body_lexical: Lexical EditorState JSON — what the admin edits in the UI.
-- body_html: rendered HTML cache; regenerated from lexical on every save.
-- available_variables: shown as clickable chips in the template editor UI.
--   Variables use {{variable_name}} syntax in subject, preview_text, and body.
CREATE TABLE IF NOT EXISTS public.email_templates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key         text NOT NULL UNIQUE,
  name                 text NOT NULL,
  subject              text NOT NULL,
  preview_text         text,
  body_lexical         jsonb NOT NULL,
  body_html            text,
  from_name            text NOT NULL DEFAULT 'Deni Sawa Partners',
  from_email           citext NOT NULL DEFAULT 'noreply@deni-sawa.com',
  reply_to             citext,
  is_active            boolean NOT NULL DEFAULT true,
  available_variables  text[] NOT NULL DEFAULT '{}',
  updated_by           uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── email_log ─────────────────────────────────────────────────────────────
-- Every outbound email attempt — for audit, retry, and delivery tracking.
CREATE TABLE IF NOT EXISTS public.email_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key     text,
  to_email         citext NOT NULL,
  to_name          text,
  subject          text NOT NULL,
  body_html        text NOT NULL,
  variables_used   jsonb NOT NULL DEFAULT '{}',
  smtp_message_id  text,
  status           text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message    text,
  report_id        uuid REFERENCES public.health_check_reports(id) ON DELETE SET NULL,
  session_id       uuid REFERENCES public.health_check_sessions(id) ON DELETE SET NULL,
  attempts         integer NOT NULL DEFAULT 0,
  last_attempted_at timestamptz,
  sent_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_status  ON public.email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_session ON public.email_log(session_id);
CREATE INDEX IF NOT EXISTS idx_email_log_report  ON public.email_log(report_id);

-- ── whatsapp_templates ────────────────────────────────────────────────────
-- WhatsApp Business API requires pre-approved message templates.
-- body_text uses {{variable_name}} syntax — plain text only (no rich text).
-- is_active only becomes true after approval_status = 'approved'.
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key        text NOT NULL UNIQUE,
  name                text NOT NULL,
  body_text           text NOT NULL,
  available_variables text[] NOT NULL DEFAULT '{}',
  approval_status     text NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected')),
  rejection_reason    text,
  wa_template_id      text,
  is_active           boolean NOT NULL DEFAULT false,
  updated_by          uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── whatsapp_config ───────────────────────────────────────────────────────
-- Single-row config for WhatsApp Business API credentials.
-- Credentials are encrypted at the application layer using AES-256
-- (Node crypto + CREDENTIALS_ENCRYPTION_KEY env var) before storage.
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider              text NOT NULL DEFAULT 'twilio'
    CHECK (provider IN ('twilio', 'meta_cloud_api', 'infobip')),
  phone_number_id       text,
  access_token_encrypted text,
  account_sid           text,
  auth_token_encrypted  text,
  from_number           text,
  is_active             boolean NOT NULL DEFAULT false,
  updated_by            uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── whatsapp_log ──────────────────────────────────────────────────────────
-- Every outbound WhatsApp message attempt.
CREATE TABLE IF NOT EXISTS public.whatsapp_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key        text,
  to_number           text NOT NULL,
  to_name             text,
  body_sent           text NOT NULL,
  variables_used      jsonb NOT NULL DEFAULT '{}',
  provider            text NOT NULL,
  provider_message_id text,
  status              text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message       text,
  report_id           uuid REFERENCES public.health_check_reports(id) ON DELETE SET NULL,
  session_id          uuid REFERENCES public.health_check_sessions(id) ON DELETE SET NULL,
  attempts            integer NOT NULL DEFAULT 0,
  last_attempted_at   timestamptz,
  sent_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wa_log_status  ON public.whatsapp_log(status);
CREATE INDEX IF NOT EXISTS idx_wa_log_session ON public.whatsapp_log(session_id);

-- ── health_check_rate_limit_config ────────────────────────────────────────
-- Per health check monthly limits configurable from admin UI.
CREATE TABLE IF NOT EXISTS public.health_check_rate_limit_config (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_check_id             uuid NOT NULL
    REFERENCES public.health_checks(id) ON DELETE CASCADE UNIQUE,
  monthly_limit_per_ip        integer NOT NULL DEFAULT 5,
  monthly_limit_per_email     integer NOT NULL DEFAULT 5,
  monthly_limit_per_whatsapp  integer NOT NULL DEFAULT 5,
  is_active                   boolean NOT NULL DEFAULT true,
  updated_by                  uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- ── health_check_rate_limit_log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_check_rate_limit_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_check_id  uuid NOT NULL REFERENCES public.health_checks(id) ON DELETE CASCADE,
  ip_address       inet,
  email            citext,
  whatsapp         text,
  attempted_at     timestamptz NOT NULL DEFAULT now(),
  was_blocked      boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_rl_log_ip
  ON public.health_check_rate_limit_log(health_check_id, ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_rl_log_email
  ON public.health_check_rate_limit_log(health_check_id, email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_rl_log_wa
  ON public.health_check_rate_limit_log(health_check_id, whatsapp, attempted_at);
```

---

## 6. Rate Limiting Function

```sql
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_health_check_id  uuid,
  p_ip               inet,
  p_email            citext,
  p_whatsapp         text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_config       public.health_check_rate_limit_config%ROWTYPE;
  v_ip_count     integer := 0;
  v_email_count  integer := 0;
  v_wa_count     integer := 0;
  v_month_start  timestamptz := date_trunc('month', now());
  v_allowed      boolean := true;
BEGIN
  SELECT * INTO v_config
  FROM public.health_check_rate_limit_config
  WHERE health_check_id = p_health_check_id;

  IF NOT FOUND OR NOT v_config.is_active THEN
    v_config.monthly_limit_per_ip        := 5;
    v_config.monthly_limit_per_email     := 5;
    v_config.monthly_limit_per_whatsapp  := 5;
  END IF;

  IF p_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_count
    FROM public.health_check_rate_limit_log
    WHERE health_check_id = p_health_check_id
      AND ip_address = p_ip
      AND attempted_at >= v_month_start
      AND was_blocked = false;
    IF v_ip_count >= v_config.monthly_limit_per_ip THEN
      v_allowed := false;
    END IF;
  END IF;

  IF v_allowed AND p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO v_email_count
    FROM public.health_check_rate_limit_log
    WHERE health_check_id = p_health_check_id
      AND email = p_email
      AND attempted_at >= v_month_start
      AND was_blocked = false;
    IF v_email_count >= v_config.monthly_limit_per_email THEN
      v_allowed := false;
    END IF;
  END IF;

  IF v_allowed AND p_whatsapp IS NOT NULL THEN
    SELECT COUNT(*) INTO v_wa_count
    FROM public.health_check_rate_limit_log
    WHERE health_check_id = p_health_check_id
      AND whatsapp = p_whatsapp
      AND attempted_at >= v_month_start
      AND was_blocked = false;
    IF v_wa_count >= v_config.monthly_limit_per_whatsapp THEN
      v_allowed := false;
    END IF;
  END IF;

  INSERT INTO public.health_check_rate_limit_log
    (health_check_id, ip_address, email, whatsapp, was_blocked)
  VALUES
    (p_health_check_id, p_ip, p_email, p_whatsapp, NOT v_allowed);

  RETURN v_allowed;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, inet, citext, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.check_rate_limit(uuid, inet, citext, text) TO service_role;
```

---

## 7. Row-Level Security Policies

```sql
ALTER TABLE public.health_checks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_sections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_subsections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_question_options  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_answers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_rate_limit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check_rate_limit_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_log                   ENABLE ROW LEVEL SECURITY;

-- Public read: active health checks and full question tree
CREATE POLICY hc_public_read   ON public.health_checks               FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY hcs_public_read  ON public.health_check_sections        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY hcss_public_read ON public.health_check_subsections     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY hcq_public_read  ON public.health_check_questions       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY hcqo_public_read ON public.health_check_question_options FOR SELECT TO anon, authenticated USING (true);

-- Anon can start a session and submit answers
CREATE POLICY hc_sessions_anon_insert ON public.health_check_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY hc_answers_anon_insert  ON public.health_check_answers  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Reports: public read by token (token IS the access control — no auth needed)
CREATE POLICY hc_reports_token_read ON public.health_check_reports FOR SELECT TO anon, authenticated USING (true);

-- Admin full access
CREATE POLICY hc_admin_all         ON public.health_checks                  FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY hcs_admin_all        ON public.health_check_sections           FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY hcss_admin_all       ON public.health_check_subsections        FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY hcq_admin_all        ON public.health_check_questions          FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY hcqo_admin_all       ON public.health_check_question_options   FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY hc_rl_config_admin   ON public.health_check_rate_limit_config  FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY hc_sessions_admin_r  ON public.health_check_sessions           FOR SELECT TO authenticated USING (public.is_blog_admin());
CREATE POLICY hc_answers_admin_r   ON public.health_check_answers            FOR SELECT TO authenticated USING (public.is_blog_admin());
CREATE POLICY hc_reports_admin_all ON public.health_check_reports            FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY email_tmpl_admin_all ON public.email_templates                 FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY email_log_admin_r    ON public.email_log                       FOR SELECT TO authenticated USING (public.is_blog_admin());
CREATE POLICY wa_tmpl_admin_all    ON public.whatsapp_templates               FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY wa_config_admin_all  ON public.whatsapp_config                 FOR ALL TO authenticated USING (public.is_blog_admin()) WITH CHECK (public.is_blog_admin());
CREATE POLICY wa_log_admin_r       ON public.whatsapp_log                    FOR SELECT TO authenticated USING (public.is_blog_admin());

-- Service role full access
CREATE POLICY hc_service      ON public.health_checks         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hcs_service     ON public.health_check_sessions  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hca_service     ON public.health_check_answers   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY hcr_service     ON public.health_check_reports   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY email_log_svc   ON public.email_log              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY wa_log_svc      ON public.whatsapp_log           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY wa_config_svc   ON public.whatsapp_config        FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

## 8. Seed Data

```sql
-- ── Health checks ─────────────────────────────────────────────────────────
INSERT INTO public.health_checks
  (name, slug, description, estimated_minutes, tags, sort_order)
VALUES
(
  'Business Health Check',
  'business-health-check',
  'An AI-powered assessment of your business across Financial Health, Operations, Governance, Cashflow and Growth Readiness. Receive a prioritised diagnostic report.',
  20,
  ARRAY['Financial','Operations','Governance','Cashflow','Growth'],
  10
),
(
  'Professional Financial Health Check',
  'professional-financial-health-check',
  'An AI-powered assessment of your personal financial position across income, debt, cashflow, savings, resilience and future security.',
  15,
  ARRAY['Personal Finance','Debt','Cashflow','Savings','Resilience'],
  20
)
ON CONFLICT (slug) DO NOTHING;

-- ── Sections: Business Health Check ──────────────────────────────────────
WITH chk AS (SELECT id FROM public.health_checks WHERE slug = 'business-health-check')
INSERT INTO public.health_check_sections (health_check_id, title, sort_order)
SELECT chk.id, s.title, s.ord FROM chk,
(VALUES
  ('Financial Health', 1),
  ('Operations',       2),
  ('Governance',       3),
  ('Cashflow',         4),
  ('Growth & Investment Readiness', 5)
) AS s(title, ord)
ON CONFLICT DO NOTHING;

-- ── Sections: Professional Financial Health Check ─────────────────────────
WITH chk AS (SELECT id FROM public.health_checks WHERE slug = 'professional-financial-health-check')
INSERT INTO public.health_check_sections (health_check_id, title, sort_order)
SELECT chk.id, s.title, s.ord FROM chk,
(VALUES
  ('Personal Finances',       1),
  ('Debt & Liabilities',      2),
  ('Cashflow',                3),
  ('Savings & Investments',   4),
  ('Future Resilience',       5)
) AS s(title, ord)
ON CONFLICT DO NOTHING;

-- ── Report prompts ────────────────────────────────────────────────────────
INSERT INTO public.health_check_report_prompts
  (health_check_id, report_type, system_prompt, max_tokens)
VALUES
(
  (SELECT id FROM public.health_checks WHERE slug = 'business-health-check'),
  'summary',
  'You are a professional financial analyst for Deni Sawa Partners. The user has completed a Business Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section summary, ParagraphNode for key findings. Do NOT include recommendations. Do NOT return any text outside the JSON object. Keep the output concise — this is a summary report.',
  2000
),
(
  (SELECT id FROM public.health_checks WHERE slug = 'business-health-check'),
  'detailed',
  'You are a senior strategic advisor for Deni Sawa Partners. The user has completed a Business Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section, HeadingNode H3 for sub-findings, ParagraphNode for analysis, ListNode (bullet) for detailed findings, QuoteNode for the top 3 priority areas requiring immediate attention. End with an H2 section titled Recommendations containing ListNode items for each actionable recommendation. Be thorough, specific, and professionally direct. Do NOT return any text outside the JSON object.',
  4000
),
(
  (SELECT id FROM public.health_checks WHERE slug = 'professional-financial-health-check'),
  'summary',
  'You are a professional financial analyst for Deni Sawa Partners. The user has completed a Professional Financial Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section summary, ParagraphNode for key findings. Do NOT include recommendations. Do NOT return any text outside the JSON object. Keep the output concise — this is a summary report.',
  2000
),
(
  (SELECT id FROM public.health_checks WHERE slug = 'professional-financial-health-check'),
  'detailed',
  'You are a senior strategic advisor for Deni Sawa Partners. The user has completed a Professional Financial Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section, HeadingNode H3 for sub-findings, ParagraphNode for analysis, ListNode (bullet) for detailed findings, QuoteNode for the top 3 priority areas covering debt, cashflow and resilience. End with an H2 section titled Recommendations containing ListNode items for each actionable recommendation. Be thorough and direct. Do NOT return any text outside the JSON object.',
  4000
)
ON CONFLICT (health_check_id, report_type) DO NOTHING;

-- ── Rate limit config ─────────────────────────────────────────────────────
INSERT INTO public.health_check_rate_limit_config
  (health_check_id, monthly_limit_per_ip, monthly_limit_per_email, monthly_limit_per_whatsapp)
SELECT id, 5, 5, 5 FROM public.health_checks
ON CONFLICT (health_check_id) DO NOTHING;

-- ── Email templates ───────────────────────────────────────────────────────
INSERT INTO public.email_templates
  (template_key, name, subject, preview_text, body_lexical, body_html, available_variables)
VALUES
(
  'health_check_report_summary',
  'Health Check — Summary Report Delivery',
  'Your {{check_name}} summary report is ready',
  'Your diagnostic summary from Deni Sawa Partners',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Your {{check_name}} summary report is ready. Click below to view your results.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>Your {{check_name}} summary report is ready. <a href="{{report_url}}">View your report</a></p>',
  ARRAY['recipient_name','check_name','report_url','report_type']
),
(
  'health_check_report_detailed',
  'Health Check — Full Report Delivery',
  'Your {{check_name}} full report is ready',
  'Your detailed diagnostic report from Deni Sawa Partners',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>Your full <strong>{{check_name}}</strong> report is ready. <a href="{{report_url}}">Access your report</a></p>',
  ARRAY['recipient_name','check_name','report_url','report_type']
),
(
  'health_check_started',
  'Health Check — Started Confirmation',
  'You have started your {{check_name}}',
  'Save this link to return to your assessment',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>You have started your {{check_name}}. <a href="{{resume_url}}">Resume your assessment</a></p>',
  ARRAY['recipient_name','check_name','resume_url']
)
ON CONFLICT (template_key) DO NOTHING;

-- ── WhatsApp templates ────────────────────────────────────────────────────
INSERT INTO public.whatsapp_templates
  (template_key, name, body_text, available_variables, approval_status)
VALUES
(
  'health_check_report_summary',
  'Health Check Summary Report',
  'Hello {{recipient_name}}, your {{check_name}} summary report from Deni Sawa Partners is ready. View it here: {{report_url}}',
  ARRAY['recipient_name','check_name','report_url'],
  'draft'
),
(
  'health_check_report_detailed',
  'Health Check Full Report',
  'Hello {{recipient_name}}, your full {{check_name}} report from Deni Sawa Partners is ready. Access it here: {{report_url}}. This is your confidential diagnostic report.',
  ARRAY['recipient_name','check_name','report_url'],
  'draft'
),
(
  'health_check_started',
  'Health Check Started',
  'Hello {{recipient_name}}, you have started your {{check_name}} with Deni Sawa Partners. Resume here: {{resume_url}}',
  ARRAY['recipient_name','check_name','resume_url'],
  'draft'
)
ON CONFLICT (template_key) DO NOTHING;
```

---

## 9. Admin Entry Point & Session Timeout

```typescript
// middleware.ts
// Single /admin entry point. Handles session check, admin validation,
// and 10-minute inactivity timeout via httpOnly cookie.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000
const LAST_ACTIVITY_COOKIE  = 'ds_admin_last_active'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname === '/admin/login')    return NextResponse.next()

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Inactivity timeout
  const lastActive = request.cookies.get(LAST_ACTIVITY_COOKIE)?.value
  if (lastActive && Date.now() - parseInt(lastActive, 10) > INACTIVITY_TIMEOUT_MS) {
    await supabase.auth.signOut()
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('reason', 'timeout')
    const res = NextResponse.redirect(url)
    res.cookies.delete(LAST_ACTIVITY_COOKIE)
    return res
  }

  // Verify active admin record
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role, is_active')
    .eq('email', session.user.email!)
    .single()

  if (!adminUser || !adminUser.is_active) {
    await supabase.auth.signOut()
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('reason', 'unauthorized')
    return NextResponse.redirect(url)
  }

  // Refresh activity timestamp
  response.cookies.set(LAST_ACTIVITY_COOKIE, Date.now().toString(), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24
  })

  return response
}

export const config = { matcher: ['/admin/:path*'] }
```

---

## 10. Admin Pages

Build all pages completely. No placeholder comments.

### Page list

| Route | Purpose |
|---|---|
| `/admin/login` | Single login page |
| `/admin/dashboard` | Stats + recent activity |
| `/admin/health-checks` | List all checks |
| `/admin/health-checks/[id]` | Edit check details |
| `/admin/health-checks/[id]/sections` | Manage sections + subsections |
| `/admin/health-checks/[id]/questions` | Manage questions per subsection |
| `/admin/health-checks/[id]/prompts` | Edit summary + detailed AI prompts |
| `/admin/health-checks/[id]/rate-limits` | Configure monthly limits |
| `/admin/health-checks/[id]/delivery` | Email + WhatsApp delivery config |
| `/admin/health-checks/sessions` | View all sessions (read-only) |
| `/admin/health-checks/reports` | View reports, toggle paid |
| `/admin/email` | Email template list |
| `/admin/email/[key]` | Email template editor |
| `/admin/email-log` | Outbound email log |
| `/admin/whatsapp` | WhatsApp template list |
| `/admin/whatsapp/[key]` | WhatsApp template editor |
| `/admin/whatsapp/config` | WhatsApp provider config |
| `/admin/whatsapp-log` | Outbound WhatsApp log |
| `/admin/blog` | Blog post management |
| `/admin/academy` | LMS course management |
| `/admin/team` | Admin users (super_admin only) |
| `/admin/settings` | General settings |

### Admin layout design

- Dark sidebar `#111111`, Deni Sawa white logo at top
- Nav groups: Dashboard · Health Checks · Blog · Academy · Team · Settings
- Active item: orange left border `#E8510A` + orange text
- Icon-only collapsed mode on mobile with tooltips
- Top bar: page title left · admin name + role badge right · logout button
- Role badge colours: super_admin = orange · admin = green · manager = blue · support = grey
- Main content: `#F9F7F5` background · white cards · 8px radius

### Login page

- Centred white card, 12px radius, subtle shadow
- Deni Sawa colour logo above form
- Email + Password fields, orange focus ring
- Full-width orange "Sign in" button
- Inline error messages — no toast on login failure
- URL reason param messages:
  - `?reason=timeout` → "Your session expired due to inactivity."
  - `?reason=unauthorized` → "Your account does not have admin access."

### Dashboard

Four stat cards: Sessions this month · Reports generated · Posts published · Active courses

Below: recent sessions table (last 10) + recent posts table (last 5)

### Health check prompt editor `/admin/health-checks/[id]/prompts`

- Two tabs: Summary · Detailed
- Each tab:
  - Lexical editor in compose mode (full toolbar) — loads `system_prompt_lexical`
  - If `system_prompt_lexical` is NULL → initialise editor from `system_prompt` plain text
  - Model selector dropdown
  - Max tokens number input (500–8000)
  - "Last updated by [name] on [date] · Version [N]" note
  - "Rollback to previous version" button (shown when `previous_system_prompt` is not NULL)
  - Save button (orange) → server converts Lexical JSON to plain text → saves both columns

### Health check question editor `/admin/health-checks/[id]/questions`

- Left panel: section → subsection tree, drag to reorder (`@dnd-kit`)
- Right panel: questions for selected subsection
- Add question → sliding panel:
  - Question text (textarea)
  - Type segmented control: Paragraph · Single select · Multi select
  - If Single select or Multi select: option list with add/remove/drag-to-reorder
  - Required toggle
  - Helper text input (optional)
- Existing questions: cards with drag handle, edit inline, delete with confirm
- API enforces: single_select answers may only store exactly 1 option UUID

### Sessions viewer `/admin/health-checks/sessions`

TanStack Table columns: Name · Business name · Email · WhatsApp · Check · Started · Time taken · Complete · Reports

Row click → modal showing all answers grouped by section → subsection (read-only)

### Reports viewer `/admin/health-checks/reports`

TanStack Table: Name · Check · Type badge · Generated · Paid toggle · Delivery status badge · View

- Paid toggle: inline switch (super_admin + admin only)
- Delivery status badges: pending = amber · sent = green · failed = red · skipped = grey
- View → modal with Lexical ReportViewer in read-only mode

---

## 11. Email Template Editor UI

**Route:** `/admin/email/[key]`

### Layout

Two-column: editor 60% left · live preview 40% right. Mobile: tabs.
Sticky save bar at bottom: "Save template" (orange) + "Send test email" (green outline).

### Editor panel

**1. Metadata card:**
- Template name (display only)
- Subject (editable, supports `{{variables}}`)
- Preview text (editable)
- From name (editable)
- From email (editable)
- Reply-to (editable, optional)

**2. Variable chips row:**
- All `available_variables` shown as clickable orange pills
- Click → inserts `{{variable_name}}` at cursor in active field
- Variables referenced in body → highlighted green
- Variables NOT referenced → highlighted orange (warning)

**3. Body (Lexical DeniSawaEditor in compose mode):**
- Full toolbar: Bold · Italic · Underline · H1 · H2 · H3 · Bullet list · Numbered list · Link · Text colour (limited palette) · Divider · Clear formatting · Undo/Redo
- "Insert variable" toolbar dropdown listing all `available_variables`
- Variables render as styled orange pill chips inside editor using a custom `VariableNode`
- `VariableNode` serialises to `{{variable_name}}` on HTML export
- Min-height 400px

### Preview panel

- Realistic email client mockup at 600px width, centred
- Frame shows: from name · from email · subject · preview text · body
- Branded Deni Sawa header (logo + orange bar) at top of email body
- Branded footer with address at bottom
- Light/dark toggle simulating different email clients

### Send test email modal

- "Send to" email input (pre-filled with logged-in admin email)
- One input per `available_variable` for test values
- Send → `POST /api/admin/email-templates/test`
- API renders template with test values, sends via Nodemailer SMTP, logs to `email_log`

### HTML generation on save

- Server: Lexical EditorState → HTML via `$generateHtmlFromNodes()`
- Wrap in branded email HTML template (table layout, inline CSS via `juice` npm package)
- Email wrapper structure:
  - DOCTYPE + email-safe meta tags
  - Max-width 600px centred table layout (not flexbox — email client safe)
  - Header: full-width orange bar `#E8510A` · Deni Sawa logo centred · white
  - Body: white background · 32px padding · Inter font stack with fallbacks
  - Footer: `#F9F7F5` background · address · website link
- Store rendered HTML in `body_html` column

---

## 12. WhatsApp Template Editor UI

**Route:** `/admin/whatsapp/[key]`

### Layout

Two-column: editor 55% left · phone preview 45% right. Mobile: tabs.

### Editor panel

**1. Metadata card:**
- Template name (display only)
- Template key (display only, monospace)
- Approval status badge: draft = grey · submitted = amber · approved = green · rejected = red
- WhatsApp template ID (shown only when `approval_status = 'approved'`)

**2. Variable chips** (same as email editor)

**3. Message body (NOT Lexical — plain text contenteditable):**
- WhatsApp messages are plain text only — no rich text
- Min-height 200px
- Character counter: "142 / 1024 characters" bottom right
- Variables shown as orange highlighted spans within the contenteditable
- Formatting guide below textarea: `*bold*` · `_italic_` · `~strikethrough~`
- Minimal formatting toolbar: Bold · Italic · Strikethrough · Insert variable dropdown

**4. Approval workflow card:**
- Status = draft → "Submit for WhatsApp approval" button (green outline)
  - Sets `approval_status = 'submitted'`, disables editing
- Status = rejected → show `rejection_reason` · "Edit and resubmit" re-enables editing
- Status = approved → green "Template approved — active" badge + `is_active` toggle

### Preview panel

Realistic WhatsApp mobile chat bubble:
- Dark green header bar `#075E54` with "Deni Sawa Partners"
- Chat background `#ECE5DD`
- Single received message bubble (white, rounded, left-aligned)
- Timestamp bottom right · double blue tick
- Variables filled from test value inputs below the phone frame
- Preview updates live

### Send test WhatsApp modal

- "Send to" number input (E.164 format e.g. `+254700000000`)
- Variable test value inputs
- Send → `POST /api/admin/whatsapp-templates/test`
- Calls configured provider · logs to `whatsapp_log`

### WhatsApp config page `/admin/whatsapp/config`

- Provider selector cards: Twilio · Meta Cloud API · Infobip
- Twilio fields: Account SID · Auth token (masked) · From number
- Meta Cloud API fields: Phone number ID · Access token (masked) · From number
- "Test connection" button (green outline) → `POST /api/admin/whatsapp-config/test`
- Save button (orange)
- Global active toggle
- Note: "Credentials are encrypted with AES-256 before storage."

---

## 13. API Routes

All routes: TypeScript + Zod validation + Supabase service_role client server-side.

```
POST /api/health-check/start
  Body: { health_check_id, full_name, business_name?, email?, whatsapp?, preferred_delivery }
  - Validate: full_name required
  - business_name required if check slug = 'business-health-check'
  - At least one of email / whatsapp required
  - preferred_delivery: 'email' | 'whatsapp' | 'both'
  - Call check_rate_limit(health_check_id, ip, email, whatsapp)
  - If blocked: 429 { error: 'rate_limit_exceeded' }
  - Create session record
  - If email provided: send health_check_started email via Nodemailer
  - If whatsapp + config active + template approved: send WhatsApp started message
  - Return: { session_id }

GET /api/health-check/[slug]/questions
  - Return full tree: sections → subsections → questions → options
  - Ordered by sort_order at every level

POST /api/health-check/[sessionId]/answers
  Body: { answers: [{ question_id, answer_text?, selected_option_ids? }] }
  - Validate: single_select questions must have exactly 1 uuid in selected_option_ids
  - Upsert all answers in one transaction
  - Mark session: is_complete = true, completed_at, time_taken_seconds

POST /api/health-check/[sessionId]/generate
  Body: { report_type: 'summary' | 'detailed' }
  - Fetch session + answers + question text
  - Fetch system_prompt from health_check_report_prompts (plain text column)
  - Build prompt: system_prompt + formatted Q&A pairs
  - Call Anthropic Claude API (claude-sonnet-4-6)
  - Parse response as Lexical EditorState JSON
  - Store in health_check_reports with report_url_token + prompt_snapshot
  - Trigger delivery based on session.preferred_delivery:
      email     → POST /api/internal/deliver-report/email
      whatsapp  → POST /api/internal/deliver-report/whatsapp
      both      → call both
  - Return: { report_url_token, report_url }

GET /api/health-check/report/[token]
  - Fetch report by report_url_token
  - Update accessed_at
  - Return: lexical_state, report_type, session name, check name, created_at

POST /api/reports/export/pdf/[token]
  - Fetch report by token
  - Lexical → HTML via $generateHtmlFromNodes()
  - Wrap in branded print HTML (A4)
  - Puppeteer → PDF buffer → stream as download

POST /api/reports/export/word/[token]
  - Fetch report by token
  - Walk Lexical nodes → map to docx npm elements
  - Add branded cover page
  - Stream .docx buffer as download

POST /api/admin/email-templates/test
  Body: { template_key, send_to, variables }
  - Admin auth required
  - Render template, send via Nodemailer, log to email_log

POST /api/admin/whatsapp-templates/test
  Body: { template_key, send_to, variables }
  - Admin auth required
  - Render body_text, call WhatsApp provider, log to whatsapp_log

POST /api/admin/whatsapp-config/test
  - Admin auth required
  - Decrypt credentials from whatsapp_config
  - Ping provider API to verify credentials
  - Return: { success: boolean, error?: string }

POST /api/internal/deliver-report/email
  - Internal only (called server-side)
  - Fetch report + session + email template
  - Render with variables, send via Nodemailer
  - Update report.delivery_status, log to email_log

POST /api/internal/deliver-report/whatsapp
  - Internal only
  - Fetch report + session + WhatsApp template
  - Decrypt credentials, call provider
  - Update delivery_status, log to whatsapp_log

GET /api/admin/email-log
  - Paginated, filterable by status + date range

GET /api/admin/whatsapp-log
  - Paginated, filterable by status + date range
```

---

## 14. Environment Variables

```env
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Domain SMTP (no third-party email service)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=Deni Sawa Partners
SMTP_FROM_EMAIL=noreply@deni-sawa.com
SMTP_FROM_EMAIL_REPORTS=reports@deni-sawa.com
SMTP_FROM_EMAIL_CONTACT=hello@deni-sawa.com
SMTP_FROM_EMAIL_INVESTORS=investors@deni-sawa.com

# WhatsApp
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+254700000000
META_WA_PHONE_NUMBER_ID=
META_WA_ACCESS_TOKEN=

# Encryption key for WhatsApp credentials stored in DB (AES-256)
CREDENTIALS_ENCRYPTION_KEY=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# Site
NEXT_PUBLIC_SITE_URL=https://deni-sawa.com
```

---

## 15. Coding Standards & Output Order

### Standards

- TypeScript strict mode throughout
- Supabase `createServerClient` in all API routes and server components
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- All admin API routes protected by middleware before executing
- Zod schemas for all API request and response bodies
- Every UI component has: loading state · error state · empty state
- `sonner` for toast notifications across admin
- Drag-to-reorder: `@dnd-kit/core` + `@dnd-kit/sortable`
- Tables: TanStack Table v8
- Forms: React Hook Form + Zod
- `async/await` only — no `.then()` chains
- Named exports for all components
- Feature-based folder structure: `/features/health-check/` · `/features/email/` · `/features/whatsapp/`
- WhatsApp credentials encrypted using Node `crypto` AES-256-GCM with `CREDENTIALS_ENCRYPTION_KEY` before storage in `whatsapp_config`
- Brief comment above any non-obvious logic block

### Answer storage rules (enforce in API)

- `paragraph` → `answer_text` populated · `selected_option_ids = {}`
- `single_select` → `selected_option_ids` has exactly **1** UUID · `answer_text = NULL`
- `multi_select` → `selected_option_ids` has **1 or more** UUIDs · `answer_text = NULL`
- Validate this in `POST /api/health-check/[sessionId]/answers` before insert

### User identity rules (enforce in API)

- `full_name` always required
- `business_name` required when `check slug = 'business-health-check'`, optional otherwise
- At least one of `email` / `whatsapp` must be provided (both empty = reject)
- `preferred_delivery` must match what the user actually provided:
  - provided email only → `'email'`
  - provided whatsapp only → `'whatsapp'`
  - provided both → user chooses `'email'` · `'whatsapp'` · or `'both'`

### Output order

1. Complete SQL migration (`BEGIN; ... COMMIT;`)
2. `middleware.ts`
3. Admin layout (`/admin/layout.tsx`)
4. Login page
5. Dashboard
6. Health check list + detail pages
7. Sections + questions editor
8. Prompt editor (Lexical compose mode for `system_prompt_lexical`)
9. Rate limits config
10. Delivery config per health check
11. Email template editor (`/admin/email/[key]`)
12. WhatsApp template editor (`/admin/whatsapp/[key]`)
13. WhatsApp config page
14. Email log + WhatsApp log viewers
15. Sessions viewer + Reports viewer
16. All API routes
17. `lib/email.ts` — Nodemailer SMTP utility
18. `lib/whatsapp.ts` — provider abstraction + AES-256 credential decrypt
19. `lib/report-generator.ts` — Claude API call + Lexical JSON parse
20. `lib/lexical-to-html.ts` — Lexical → HTML for email + PDF
21. `lib/lexical-to-docx.ts` — Lexical → Word export
22. `lib/lexical-to-plaintext.ts` — Lexical → plain text for prompt storage

**Build each file completely. No placeholder comments. No truncated output.**