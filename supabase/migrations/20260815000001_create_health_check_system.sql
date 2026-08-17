-- ────────────────────────────────────────────────────────────────────────────
-- Deni Sawa Partners — Health Check System
-- Full schema: health check question tree, sessions, answers, AI reports,
-- report prompts, email + WhatsApp templates, delivery logging, rate limiting.
-- Run the ENTIRE file as a single transaction (Supabase SQL Editor).
-- ────────────────────────────────────────────────────────────────────────────

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- Extensions & shared helpers
-- ════════════════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;
create extension if not exists citext;

-- ════════════════════════════════════════════════════════════════════════════
-- FIX 1 — Link admin_users to Supabase Auth
-- ════════════════════════════════════════════════════════════════════════════
alter table public.admin_users
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete set null;

create unique index if not exists idx_admin_users_auth_user_id
  on public.admin_users(auth_user_id)
  where auth_user_id is not null;

-- ════════════════════════════════════════════════════════════════════════════
-- FIX 2 — consultation_bookings (referenced by existing RLS but never defined)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.consultation_bookings (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       citext,
  whatsapp    text,
  message     text,
  source      text,
  created_at  timestamptz not null default now(),
  check (email is not null or whatsapp is not null)
);

alter table public.consultation_bookings enable row level security;

drop policy if exists consultation_bookings_anon_insert on public.consultation_bookings;
create policy consultation_bookings_anon_insert
  on public.consultation_bookings
  for insert to anon, authenticated
  with check (true);

drop policy if exists consultation_bookings_service_all on public.consultation_bookings;
create policy consultation_bookings_service_all
  on public.consultation_bookings
  for all to service_role
  using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════════════
-- Transition: v1 health-check tables used a different shape (text ids,
-- check_type / category / text columns) and are replaced by the v2 schema.
-- ════════════════════════════════════════════════════════════════════════════
drop table if exists public.health_check_responses;
drop table if exists public.health_check_questions;
drop table if exists public.health_check_reports;

-- ────────────────────────────────────────────────────────────────────────────
-- health_checks — the top-level assessment catalogue entry
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_checks (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               citext not null unique,
  description        text,
  estimated_minutes  integer,
  tags               text[] not null default '{}',
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger trg_health_checks_updated_at
  before update on public.health_checks
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_sections — top-level grouping of a health check
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_sections (
  id               uuid primary key default gen_random_uuid(),
  health_check_id  uuid not null references public.health_checks(id) on delete cascade,
  title            text not null,
  description      text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_health_check_sections_updated_at
  before update on public.health_check_sections
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_subsections — grouping inside a section
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_subsections (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.health_check_sections(id) on delete cascade,
  heading     text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_health_check_subsections_updated_at
  before update on public.health_check_subsections
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_questions
--   question_type controls the UI:
--     paragraph      → free-text textarea; answer stored in answer_text
--     single_select  → radio buttons; exactly ONE uuid in selected_option_ids
--     multi_select   → checkboxes; one or more uuids in selected_option_ids
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_questions (
  id             uuid primary key default gen_random_uuid(),
  subsection_id  uuid not null references public.health_check_subsections(id) on delete cascade,
  question_text  text not null,
  question_type  text not null
    check (question_type in ('paragraph', 'single_select', 'multi_select')),
  is_required    boolean not null default true,
  helper_text    text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_health_check_questions_updated_at
  before update on public.health_check_questions
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_question_options — options for single/multi select questions
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.health_check_questions(id) on delete cascade,
  option_text text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_sessions — a started assessment
--   business_name required for Business Health Check, optional for Professional.
--   At least one of email / whatsapp required. preferred_delivery controls
--   which channel(s) the report is delivered on.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_sessions (
  id                    uuid primary key default gen_random_uuid(),
  health_check_id       uuid not null references public.health_checks(id) on delete cascade,
  full_name             text not null,
  business_name         text,
  email                 citext,
  whatsapp              text,
  preferred_delivery    text not null default 'email'
    check (preferred_delivery in ('email', 'whatsapp', 'both')),
  ip_address            inet,
  user_agent            text,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  time_taken_seconds    integer,
  is_complete           boolean not null default false,
  check (email is not null or whatsapp is not null)
);

create index if not exists idx_hcs_check_started
  on public.health_check_sessions(health_check_id, started_at);
create index if not exists idx_hcs_email
  on public.health_check_sessions(email);
create index if not exists idx_hcs_whatsapp
  on public.health_check_sessions(whatsapp);
create index if not exists idx_hcs_ip
  on public.health_check_sessions(ip_address);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_answers — one row per question per session.
--   paragraph      → answer_text populated, selected_option_ids = {}
--   single_select  → selected_option_ids has exactly 1 uuid, answer_text NULL
--   multi_select   → selected_option_ids has 1+ uuids, answer_text NULL
--   Single-select cardinality enforced in the API layer.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_answers (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references public.health_check_sessions(id) on delete cascade,
  question_id          uuid not null references public.health_check_questions(id) on delete cascade,
  answer_text          text,
  selected_option_ids  uuid[] not null default '{}',
  created_at           timestamptz not null default now(),
  unique(session_id, question_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_reports — generated reports per session per report_type.
--   lexical_state: Claude returns Lexical EditorState JSON — stored here.
--   report_url_token: 64-char hex public access key (no auth needed).
--   is_paid: detailed reports require payment before delivery.
--   delivery_status: whether the report was sent to the user.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_reports (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.health_check_sessions(id) on delete cascade,
  report_type         text not null check (report_type in ('summary', 'detailed')),
  lexical_state       jsonb not null,
  prompt_snapshot     text not null,
  model_used          text not null,
  tokens_used         integer,
  generation_seconds  numeric(6,2),
  report_url_token    text unique not null default encode(gen_random_bytes(32), 'hex'),
  is_paid             boolean not null default false,
  delivery_status     text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  accessed_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique(session_id, report_type)
);

create index if not exists idx_hcr_token
  on public.health_check_reports(report_url_token);
create index if not exists idx_hcr_session
  on public.health_check_reports(session_id);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_report_prompts — AI prompt config per health check per type.
--   system_prompt:         plain text sent directly to Claude on generation.
--   system_prompt_lexical: Lexical EditorState JSON loaded into the admin editor.
--   version + previous_system_prompt allow one-step rollback in the admin UI.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_report_prompts (
  id                      uuid primary key default gen_random_uuid(),
  health_check_id         uuid not null
    references public.health_checks(id) on delete cascade,
  report_type             text not null
    check (report_type in ('summary', 'detailed')),
  system_prompt           text not null,
  system_prompt_lexical   jsonb,
  model                   text not null default 'claude-sonnet-4-6',
  max_tokens              integer not null default 4000
    check (max_tokens between 500 and 8000),
  is_active               boolean not null default true,
  updated_by              uuid
    references public.admin_users(id) on delete set null,
  version                 integer not null default 1,
  previous_system_prompt  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique(health_check_id, report_type)
);

create trigger trg_hc_report_prompts_updated_at
  before update on public.health_check_report_prompts
  for each row execute function public.set_updated_at();

-- Auto-increment version and snapshot previous plain text on every save.
create or replace function public.hc_prompt_version_bump()
returns trigger language plpgsql as $$
begin
  if new.system_prompt is distinct from old.system_prompt then
    new.version := old.version + 1;
    new.previous_system_prompt := old.system_prompt;
  end if;
  return new;
end;
$$;

create trigger trg_hc_prompt_version_bump
  before update on public.health_check_report_prompts
  for each row execute function public.hc_prompt_version_bump();

-- ────────────────────────────────────────────────────────────────────────────
-- email_templates — editable branded email templates for all notifications.
--   body_lexical: Lexical EditorState JSON — what the admin edits in the UI.
--   body_html:    rendered HTML cache; regenerated from lexical on every save.
--   Variables use {{variable_name}} syntax in subject, preview_text and body.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_templates (
  id                   uuid primary key default gen_random_uuid(),
  template_key         text not null unique,
  name                 text not null,
  subject              text not null,
  preview_text         text,
  body_lexical         jsonb not null,
  body_html            text,
  from_name            text not null default 'Deni Sawa Partners',
  from_email           citext not null default 'noreply@denisawa.co.ke',
  reply_to             citext,
  is_active            boolean not null default true,
  available_variables  text[] not null default '{}',
  updated_by           uuid references public.admin_users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- email_log — every outbound email attempt for audit, retry, delivery tracking
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_log (
  id               uuid primary key default gen_random_uuid(),
  template_key     text,
  to_email         citext not null,
  to_name          text,
  subject          text not null,
  body_html        text not null,
  variables_used   jsonb not null default '{}',
  smtp_message_id  text,
  status           text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'bounced')),
  error_message    text,
  report_id        uuid references public.health_check_reports(id) on delete set null,
  session_id       uuid references public.health_check_sessions(id) on delete set null,
  attempts         integer not null default 0,
  last_attempted_at timestamptz,
  sent_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists idx_email_log_status  on public.email_log(status);
create index if not exists idx_email_log_session on public.email_log(session_id);
create index if not exists idx_email_log_report  on public.email_log(report_id);

-- ────────────────────────────────────────────────────────────────────────────
-- whatsapp_templates — pre-approved WhatsApp Business message templates.
--   body_text uses {{variable_name}} syntax (plain text only).
--   is_active only becomes true after approval_status = 'approved'.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_templates (
  id                  uuid primary key default gen_random_uuid(),
  template_key        text not null unique,
  name                text not null,
  body_text           text not null,
  available_variables text[] not null default '{}',
  approval_status     text not null default 'draft'
    check (approval_status in ('draft', 'submitted', 'approved', 'rejected')),
  rejection_reason    text,
  wa_template_id      text,
  is_active           boolean not null default false,
  updated_by          uuid references public.admin_users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_whatsapp_templates_updated_at
  before update on public.whatsapp_templates
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- whatsapp_config — single-row WhatsApp Business API credentials.
--   Credentials encrypted at the application layer with AES-256-GCM
--   (Node crypto + CREDENTIALS_ENCRYPTION_KEY env var) before storage.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_config (
  id                    uuid primary key default gen_random_uuid(),
  provider              text not null default 'twilio'
    check (provider in ('twilio', 'meta_cloud_api', 'infobip')),
  phone_number_id       text,
  access_token_encrypted text,
  account_sid           text,
  auth_token_encrypted  text,
  from_number           text,
  is_active             boolean not null default false,
  updated_by            uuid references public.admin_users(id) on delete set null,
  updated_at            timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- whatsapp_log — every outbound WhatsApp message attempt.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_log (
  id                  uuid primary key default gen_random_uuid(),
  template_key        text,
  to_number           text not null,
  to_name             text,
  body_sent           text not null,
  variables_used      jsonb not null default '{}',
  provider            text not null,
  provider_message_id text,
  status              text not null default 'pending'
    check (status in ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message       text,
  report_id           uuid references public.health_check_reports(id) on delete set null,
  session_id          uuid references public.health_check_sessions(id) on delete set null,
  attempts            integer not null default 0,
  last_attempted_at   timestamptz,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_wa_log_status  on public.whatsapp_log(status);
create index if not exists idx_wa_log_session on public.whatsapp_log(session_id);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_rate_limit_config — per-check monthly limits from admin UI.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_rate_limit_config (
  id                          uuid primary key default gen_random_uuid(),
  health_check_id             uuid not null
    references public.health_checks(id) on delete cascade unique,
  monthly_limit_per_ip        integer not null default 5,
  monthly_limit_per_email     integer not null default 5,
  monthly_limit_per_whatsapp  integer not null default 5,
  is_active                   boolean not null default true,
  updated_by                  uuid references public.admin_users(id) on delete set null,
  updated_at                  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_rate_limit_log — every rate-limit check attempt.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_rate_limit_log (
  id               uuid primary key default gen_random_uuid(),
  health_check_id  uuid not null references public.health_checks(id) on delete cascade,
  ip_address       inet,
  email            citext,
  whatsapp         text,
  attempted_at     timestamptz not null default now(),
  was_blocked      boolean not null default false
);

create index if not exists idx_rl_log_ip
  on public.health_check_rate_limit_log(health_check_id, ip_address, attempted_at);
create index if not exists idx_rl_log_email
  on public.health_check_rate_limit_log(health_check_id, email, attempted_at);
create index if not exists idx_rl_log_wa
  on public.health_check_rate_limit_log(health_check_id, whatsapp, attempted_at);

-- ════════════════════════════════════════════════════════════════════════════
-- Rate limiting function
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.check_rate_limit(
  p_health_check_id  uuid,
  p_ip               inet,
  p_email            citext,
  p_whatsapp         text
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_config       public.health_check_rate_limit_config%rowtype;
  v_ip_count     integer := 0;
  v_email_count  integer := 0;
  v_wa_count     integer := 0;
  v_month_start  timestamptz := date_trunc('month', now());
  v_allowed      boolean := true;
begin
  select * into v_config
  from public.health_check_rate_limit_config
  where health_check_id = p_health_check_id;

  if not found or not v_config.is_active then
    v_config.monthly_limit_per_ip        := 5;
    v_config.monthly_limit_per_email     := 5;
    v_config.monthly_limit_per_whatsapp  := 5;
  end if;

  if p_ip is not null then
    select count(*) into v_ip_count
    from public.health_check_rate_limit_log
    where health_check_id = p_health_check_id
      and ip_address = p_ip
      and attempted_at >= v_month_start
      and was_blocked = false;
    if v_ip_count >= v_config.monthly_limit_per_ip then
      v_allowed := false;
    end if;
  end if;

  if v_allowed and p_email is not null then
    select count(*) into v_email_count
    from public.health_check_rate_limit_log
    where health_check_id = p_health_check_id
      and email = p_email
      and attempted_at >= v_month_start
      and was_blocked = false;
    if v_email_count >= v_config.monthly_limit_per_email then
      v_allowed := false;
    end if;
  end if;

  if v_allowed and p_whatsapp is not null then
    select count(*) into v_wa_count
    from public.health_check_rate_limit_log
    where health_check_id = p_health_check_id
      and whatsapp = p_whatsapp
      and attempted_at >= v_month_start
      and was_blocked = false;
    if v_wa_count >= v_config.monthly_limit_per_whatsapp then
      v_allowed := false;
    end if;
  end if;

  insert into public.health_check_rate_limit_log
    (health_check_id, ip_address, email, whatsapp, was_blocked)
  values
    (p_health_check_id, p_ip, p_email, p_whatsapp, not v_allowed);

  return v_allowed;
end;
$$;

revoke execute on function public.check_rate_limit(uuid, inet, citext, text) from public;
grant  execute on function public.check_rate_limit(uuid, inet, citext, text) to service_role;

-- ════════════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ════════════════════════════════════════════════════════════════════════════
alter table public.health_checks                  enable row level security;
alter table public.health_check_sections          enable row level security;
alter table public.health_check_subsections       enable row level security;
alter table public.health_check_questions         enable row level security;
alter table public.health_check_question_options  enable row level security;
alter table public.health_check_sessions          enable row level security;
alter table public.health_check_answers           enable row level security;
alter table public.health_check_reports           enable row level security;
alter table public.health_check_rate_limit_config enable row level security;
alter table public.health_check_rate_limit_log    enable row level security;
alter table public.email_templates                enable row level security;
alter table public.email_log                      enable row level security;
alter table public.whatsapp_templates             enable row level security;
alter table public.whatsapp_config                enable row level security;
alter table public.whatsapp_log                   enable row level security;
alter table public.health_check_report_prompts    enable row level security;

-- Public read: active health checks and the full question tree
create policy hc_public_read   on public.health_checks               for select to anon, authenticated using (is_active = true);
create policy hcs_public_read  on public.health_check_sections        for select to anon, authenticated using (true);
create policy hcss_public_read on public.health_check_subsections     for select to anon, authenticated using (true);
create policy hcq_public_read  on public.health_check_questions       for select to anon, authenticated using (true);
create policy hcqo_public_read on public.health_check_question_options for select to anon, authenticated using (true);

-- Anon can start a session and submit answers
create policy hc_sessions_anon_insert on public.health_check_sessions for insert to anon, authenticated with check (true);
create policy hc_answers_anon_insert  on public.health_check_answers  for insert to anon, authenticated with check (true);

-- Reports: public read by token (token IS the access control — no auth needed)
create policy hc_reports_token_read on public.health_check_reports for select to anon, authenticated using (true);

-- Admin full access
create policy hc_admin_all         on public.health_checks                  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcs_admin_all        on public.health_check_sections           for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcss_admin_all       on public.health_check_subsections        for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcq_admin_all        on public.health_check_questions          for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcqo_admin_all       on public.health_check_question_options   for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hc_rl_config_admin   on public.health_check_rate_limit_config  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hc_sessions_admin_r  on public.health_check_sessions           for select to authenticated using (public.is_blog_admin());
create policy hc_answers_admin_r   on public.health_check_answers            for select to authenticated using (public.is_blog_admin());
create policy hc_reports_admin_all on public.health_check_reports            for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy email_tmpl_admin_all on public.email_templates                 for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy email_log_admin_r    on public.email_log                       for select to authenticated using (public.is_blog_admin());
create policy wa_tmpl_admin_all    on public.whatsapp_templates               for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy wa_config_admin_all  on public.whatsapp_config                 for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy wa_log_admin_r       on public.whatsapp_log                    for select to authenticated using (public.is_blog_admin());
create policy hc_prompts_admin_all on public.health_check_report_prompts      for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

-- Service role full access
create policy hc_service      on public.health_checks                  for all to service_role using (true) with check (true);
create policy hcs_service     on public.health_check_sections          for all to service_role using (true) with check (true);
create policy hcss_service    on public.health_check_subsections       for all to service_role using (true) with check (true);
create policy hcq_service     on public.health_check_questions         for all to service_role using (true) with check (true);
create policy hcqo_service    on public.health_check_question_options  for all to service_role using (true) with check (true);
create policy hc_sessions_svc on public.health_check_sessions          for all to service_role using (true) with check (true);
create policy hc_answers_svc  on public.health_check_answers           for all to service_role using (true) with check (true);
create policy hc_reports_svc  on public.health_check_reports           for all to service_role using (true) with check (true);
create policy hc_rl_cfg_svc   on public.health_check_rate_limit_config for all to service_role using (true) with check (true);
create policy hc_rl_log_svc   on public.health_check_rate_limit_log    for all to service_role using (true) with check (true);
create policy email_tmpl_svc  on public.email_templates                for all to service_role using (true) with check (true);
create policy email_log_svc   on public.email_log                      for all to service_role using (true) with check (true);
create policy wa_tmpl_svc     on public.whatsapp_templates             for all to service_role using (true) with check (true);
create policy wa_config_svc   on public.whatsapp_config                for all to service_role using (true) with check (true);
create policy wa_log_svc      on public.whatsapp_log                   for all to service_role using (true) with check (true);
create policy hc_prompts_svc  on public.health_check_report_prompts    for all to service_role using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════════════
-- Seed data
-- ════════════════════════════════════════════════════════════════════════════

-- ── Health checks ───────────────────────────────────────────────────────────
insert into public.health_checks
  (name, slug, description, estimated_minutes, tags, sort_order)
values
(
  'Business Health Check',
  'business-health-check',
  'An AI-powered assessment of your business across Financial Health, Operations, Governance, Cashflow and Growth Readiness. Receive a prioritised diagnostic report.',
  20,
  array['Financial','Operations','Governance','Cashflow','Growth'],
  10
),
(
  'Professional Financial Health Check',
  'professional-financial-health-check',
  'An AI-powered assessment of your personal financial position across income, debt, cashflow, savings, resilience and future security.',
  15,
  array['Personal Finance','Debt','Cashflow','Savings','Resilience'],
  20
)
on conflict (slug) do nothing;

-- ── Sections: Business Health Check ─────────────────────────────────────────
with chk as (select id from public.health_checks where slug = 'business-health-check')
insert into public.health_check_sections (health_check_id, title, sort_order)
select chk.id, s.title, s.ord from chk,
(values
  ('Financial Health', 1),
  ('Operations',       2),
  ('Governance',       3),
  ('Cashflow',         4),
  ('Growth & Investment Readiness', 5)
) as s(title, ord)
on conflict do nothing;

-- ── Sections: Professional Financial Health Check ───────────────────────────
with chk as (select id from public.health_checks where slug = 'professional-financial-health-check')
insert into public.health_check_sections (health_check_id, title, sort_order)
select chk.id, s.title, s.ord from chk,
(values
  ('Personal Finances',       1),
  ('Debt & Liabilities',      2),
  ('Cashflow',                3),
  ('Savings & Investments',   4),
  ('Future Resilience',       5)
) as s(title, ord)
on conflict do nothing;

-- ── Report prompts ──────────────────────────────────────────────────────────
insert into public.health_check_report_prompts
  (health_check_id, report_type, system_prompt, max_tokens)
values
(
  (select id from public.health_checks where slug = 'business-health-check'),
  'summary',
  'You are a professional financial analyst for Deni Sawa Partners. The user has completed a Business Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section summary, ParagraphNode for key findings. Do NOT include recommendations. Do NOT return any text outside the JSON object. Keep the output concise — this is a summary report.',
  2000
),
(
  (select id from public.health_checks where slug = 'business-health-check'),
  'detailed',
  'You are a senior strategic advisor for Deni Sawa Partners. The user has completed a Business Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section, HeadingNode H3 for sub-findings, ParagraphNode for analysis, ListNode (bullet) for detailed findings, QuoteNode for the top 3 priority areas requiring immediate attention. End with an H2 section titled Recommendations containing ListNode items for each actionable recommendation. Be thorough, specific, and professionally direct. Do NOT return any text outside the JSON object.',
  4000
),
(
  (select id from public.health_checks where slug = 'professional-financial-health-check'),
  'summary',
  'You are a professional financial analyst for Deni Sawa Partners. The user has completed a Professional Financial Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section summary, ParagraphNode for key findings. Do NOT include recommendations. Do NOT return any text outside the JSON object. Keep the output concise — this is a summary report.',
  2000
),
(
  (select id from public.health_checks where slug = 'professional-financial-health-check'),
  'detailed',
  'You are a senior strategic advisor for Deni Sawa Partners. The user has completed a Professional Financial Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section, HeadingNode H3 for sub-findings, ParagraphNode for analysis, ListNode (bullet) for detailed findings, QuoteNode for the top 3 priority areas covering debt, cashflow and resilience. End with an H2 section titled Recommendations containing ListNode items for each actionable recommendation. Be thorough and direct. Do NOT return any text outside the JSON object.',
  4000
)
on conflict (health_check_id, report_type) do nothing;

-- ── Rate limit config ───────────────────────────────────────────────────────
insert into public.health_check_rate_limit_config
  (health_check_id, monthly_limit_per_ip, monthly_limit_per_email, monthly_limit_per_whatsapp)
select id, 5, 5, 5 from public.health_checks
on conflict (health_check_id) do nothing;

-- ── Email templates ─────────────────────────────────────────────────────────
insert into public.email_templates
  (template_key, name, subject, preview_text, body_lexical, body_html, available_variables)
values
(
  'health_check_report_summary',
  'Health Check — Summary Report Delivery',
  'Your {{check_name}} summary report is ready',
  'Your diagnostic summary from Deni Sawa Partners',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Your {{check_name}} summary report is ready. Click below to view your results.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>Your {{check_name}} summary report is ready. <a href="{{report_url}}">View your report</a></p>',
  array['recipient_name','check_name','report_url','report_type']
),
(
  'health_check_report_detailed',
  'Health Check — Full Report Delivery',
  'Your {{check_name}} full report is ready',
  'Your detailed diagnostic report from Deni Sawa Partners',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>Your full <strong>{{check_name}}</strong> report is ready. <a href="{{report_url}}">Access your report</a></p>',
  array['recipient_name','check_name','report_url','report_type']
),
(
  'health_check_started',
  'Health Check — Started Confirmation',
  'You have started your {{check_name}}',
  'Save this link to return to your assessment',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>You have started your {{check_name}}. <a href="{{resume_url}}">Resume your assessment</a></p>',
  array['recipient_name','check_name','resume_url']
)
on conflict (template_key) do nothing;

-- ── WhatsApp templates ──────────────────────────────────────────────────────
insert into public.whatsapp_templates
  (template_key, name, body_text, available_variables, approval_status)
values
(
  'health_check_report_summary',
  'Health Check Summary Report',
  'Hello {{recipient_name}}, your {{check_name}} summary report from Deni Sawa Partners is ready. View it here: {{report_url}}',
  array['recipient_name','check_name','report_url'],
  'draft'
),
(
  'health_check_report_detailed',
  'Health Check Full Report',
  'Hello {{recipient_name}}, your full {{check_name}} report from Deni Sawa Partners is ready. Access it here: {{report_url}}. This is your confidential diagnostic report.',
  array['recipient_name','check_name','report_url'],
  'draft'
),
(
  'health_check_started',
  'Health Check Started',
  'Hello {{recipient_name}}, you have started your {{check_name}} with Deni Sawa Partners. Resume here: {{resume_url}}',
  array['recipient_name','check_name','resume_url'],
  'draft'
)
on conflict (template_key) do nothing;

-- ── Comments ────────────────────────────────────────────────────────────────
comment on table public.health_checks is 'Top-level health check catalogue entries.';
comment on table public.health_check_sessions is 'A started health check session with delivery preferences.';
comment on table public.health_check_reports is 'Generated Lexical-state reports keyed to a session and report_type.';
comment on table public.email_templates is 'Branded email templates edited with Lexical; body_html is the rendered cache.';
comment on table public.whatsapp_templates is 'WhatsApp Business message templates requiring approval before activation.';

commit;
