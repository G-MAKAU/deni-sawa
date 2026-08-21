


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."admin_role" AS ENUM (
    'super_admin',
    'admin',
    'manager',
    'support'
);


ALTER TYPE "public"."admin_role" OWNER TO "postgres";


CREATE TYPE "public"."post_status" AS ENUM (
    'draft',
    'review',
    'scheduled',
    'published',
    'archived'
);


ALTER TYPE "public"."post_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."blog_posts_derive_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  word_count integer;
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.make_slug(new.title);
  else
    new.slug := public.make_slug(new.slug);
  end if;

  word_count := array_length(regexp_split_to_array(coalesce(new.content_markdown, ''), E'\\s+'), 1);

  if coalesce(new.reading_minutes, 0) <= 0 then
    new.reading_minutes := greatest(1, ceil(coalesce(word_count, 0) / 220.0)::int);
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."blog_posts_derive_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_health_check_id" "uuid", "p_ip" "inet", "p_email" "public"."citext", "p_whatsapp" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."check_rate_limit"("p_health_check_id" "uuid", "p_ip" "inet", "p_email" "public"."citext", "p_whatsapp" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_max_featured_blog_posts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  update public.blog_posts
  set featured = false
  where featured = true
    and id not in (
      select id
      from public.blog_posts
      where featured = true
      order by coalesce(published_at, created_at) desc nulls last, updated_at desc
      limit 2
    );

  return null;
end;
$$;


ALTER FUNCTION "public"."enforce_max_featured_blog_posts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hc_prompt_version_bump"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.system_prompt is distinct from old.system_prompt then
    new.version := old.version + 1;
    new.previous_system_prompt := old.system_prompt;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."hc_prompt_version_bump"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_blog_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active = true
  );
$$;


ALTER FUNCTION "public"."is_blog_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."make_slug"("input_text" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(input_text, ''))), '[^a-z0-9]+', '-', 'g'));
$$;


ALTER FUNCTION "public"."make_slug"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "public"."citext" NOT NULL,
    "role" "public"."admin_role" DEFAULT 'support'::"public"."admin_role" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_active_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auth_user_id" "uuid",
    "reset_token" "text",
    "reset_token_expires_at" timestamp with time zone
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_users" IS 'Staff who may sign in and manage blog content.';



CREATE TABLE IF NOT EXISTS "public"."blog_authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "email" "public"."citext",
    "bio" "text",
    "avatar_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blog_post_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "author_name" "text" NOT NULL,
    "author_email" "text" NOT NULL,
    "author_website" "text",
    "content" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blog_comments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."blog_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "content_markdown" "text" NOT NULL,
    "content_html" "text",
    "author_id" "uuid",
    "primary_category_id" "uuid",
    "status" "public"."post_status" DEFAULT 'draft'::"public"."post_status" NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "scheduled_for" timestamp with time zone,
    "reading_minutes" integer,
    "cover_image_url" "text",
    "canonical_url" "text",
    "seo_title" character varying(70),
    "seo_description" character varying(160),
    "seo_keywords" "text",
    "seo_robots" "text" DEFAULT 'index_follow'::"text" NOT NULL,
    "og_title" "text",
    "og_description" "text",
    "og_image_url" "text",
    "twitter_card" "text",
    "schema_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content_lexical" "jsonb",
    CONSTRAINT "blog_posts_check" CHECK ((("status" <> 'published'::"public"."post_status") OR ("published_at" IS NOT NULL))),
    CONSTRAINT "blog_posts_check1" CHECK ((("status" <> 'scheduled'::"public"."post_status") OR ("scheduled_for" IS NOT NULL))),
    CONSTRAINT "blog_posts_reading_minutes_check" CHECK ((("reading_minutes" IS NULL) OR ("reading_minutes" > 0))),
    CONSTRAINT "blog_posts_seo_robots_check" CHECK (("seo_robots" = ANY (ARRAY['index_follow'::"text", 'index_nofollow'::"text", 'noindex_follow'::"text", 'noindex_nofollow'::"text"]))),
    CONSTRAINT "blog_posts_twitter_card_check" CHECK ((("twitter_card" IS NULL) OR ("twitter_card" = ANY (ARRAY['summary'::"text", 'summary_large_image'::"text"]))))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."blog_posts" IS 'Blog posts with editorial content (markdown + sanitized HTML) and SEO metadata.';



CREATE TABLE IF NOT EXISTS "public"."consultation_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reference" "text" NOT NULL,
    "name" "text" NOT NULL,
    "contact" "text" NOT NULL,
    "contact_type" "text" DEFAULT 'phone'::"text" NOT NULL,
    "service" "text" NOT NULL,
    "preferred_date" "date",
    "preferred_time" "text",
    "message" "text",
    "source" "text" DEFAULT 'website-chat'::"text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."consultation_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text",
    "to_email" "public"."citext" NOT NULL,
    "to_name" "text",
    "subject" "text" NOT NULL,
    "body_html" "text" NOT NULL,
    "variables_used" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "smtp_message_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "report_id" "uuid",
    "session_id" "uuid",
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_attempted_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_log_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."email_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "preview_text" "text",
    "body_lexical" "jsonb" NOT NULL,
    "body_html" "text",
    "from_name" "text" DEFAULT 'Deni Sawa Partners'::"text" NOT NULL,
    "from_email" "public"."citext" DEFAULT 'noreply@deni-sawa.com'::"public"."citext" NOT NULL,
    "reply_to" "public"."citext",
    "is_active" boolean DEFAULT true NOT NULL,
    "available_variables" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_templates" IS 'Branded email templates edited with Lexical; body_html is the rendered cache.';



CREATE TABLE IF NOT EXISTS "public"."health_check_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "answer_text" "text",
    "selected_option_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."health_check_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_check_question_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "option_text" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."health_check_question_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_check_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subsection_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "is_required" boolean DEFAULT true NOT NULL,
    "helper_text" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "health_check_questions_question_type_check" CHECK (("question_type" = ANY (ARRAY['paragraph'::"text", 'single_select'::"text", 'multi_select'::"text"])))
);


ALTER TABLE "public"."health_check_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_check_rate_limit_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "health_check_id" "uuid" NOT NULL,
    "monthly_limit_per_ip" integer DEFAULT 5 NOT NULL,
    "monthly_limit_per_email" integer DEFAULT 5 NOT NULL,
    "monthly_limit_per_whatsapp" integer DEFAULT 5 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."health_check_rate_limit_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_check_rate_limit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "health_check_id" "uuid" NOT NULL,
    "ip_address" "inet",
    "email" "public"."citext",
    "whatsapp" "text",
    "attempted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "was_blocked" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."health_check_rate_limit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_check_report_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "health_check_id" "uuid" NOT NULL,
    "report_type" "text" NOT NULL,
    "system_prompt" "text" NOT NULL,
    "system_prompt_lexical" "jsonb",
    "model" "text" DEFAULT 'claude-sonnet-4-6'::"text" NOT NULL,
    "max_tokens" integer DEFAULT 4000 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_by" "uuid",
    "version" integer DEFAULT 1 NOT NULL,
    "previous_system_prompt" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider" "text" DEFAULT 'anthropic'::"text" NOT NULL,
    "header_lexical" "jsonb",
    "footer_lexical" "jsonb",
    CONSTRAINT "health_check_report_prompts_max_tokens_check" CHECK ((("max_tokens" >= 500) AND ("max_tokens" <= 200000))),
    CONSTRAINT "health_check_report_prompts_provider_check" CHECK (("provider" = ANY (ARRAY['anthropic'::"text", 'google'::"text", 'openrouter'::"text"]))),
    CONSTRAINT "health_check_report_prompts_report_type_check" CHECK (("report_type" = ANY (ARRAY['summary'::"text", 'detailed'::"text"])))
);


ALTER TABLE "public"."health_check_report_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_check_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "report_type" "text" NOT NULL,
    "lexical_state" "jsonb" NOT NULL,
    "prompt_snapshot" "text" NOT NULL,
    "model_used" "text" NOT NULL,
    "tokens_used" integer,
    "generation_seconds" numeric(6,2),
    "report_url_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(32), 'hex'::"text") NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "delivery_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "accessed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "generation_error" "text",
    "edited_by" "uuid",
    "edited_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    CONSTRAINT "health_check_reports_delivery_status_check" CHECK (("delivery_status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'skipped'::"text"]))),
    CONSTRAINT "health_check_reports_report_type_check" CHECK (("report_type" = ANY (ARRAY['summary'::"text", 'detailed'::"text"])))
);


ALTER TABLE "public"."health_check_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."health_check_reports" IS 'Generated Lexical-state reports keyed to a session and report_type.';



CREATE TABLE IF NOT EXISTS "public"."health_check_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "health_check_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."health_check_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_check_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "health_check_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "business_name" "text",
    "email" "public"."citext",
    "whatsapp" "text",
    "preferred_delivery" "text" DEFAULT 'email'::"text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "time_taken_seconds" integer,
    "is_complete" boolean DEFAULT false NOT NULL,
    "report_selection" "text" DEFAULT 'summary'::"text" NOT NULL,
    "payment_status" "text" DEFAULT 'none'::"text" NOT NULL,
    "payment_amount" numeric(10,2),
    "payment_reference" "text",
    "requires_call" boolean DEFAULT false NOT NULL,
    "admin_notified" boolean DEFAULT false NOT NULL,
    "terms_agreed" boolean DEFAULT false NOT NULL,
    "terms_agreed_at" timestamp with time zone,
    "terms_version" "text",
    "comms_consent" boolean DEFAULT false NOT NULL,
    "comms_consent_at" timestamp with time zone,
    "consent_ip" "inet",
    CONSTRAINT "health_check_sessions_check" CHECK ((("email" IS NOT NULL) OR ("whatsapp" IS NOT NULL))),
    CONSTRAINT "health_check_sessions_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['none'::"text", 'pending'::"text", 'paid'::"text", 'failed'::"text"]))),
    CONSTRAINT "health_check_sessions_preferred_delivery_check" CHECK (("preferred_delivery" = ANY (ARRAY['email'::"text", 'whatsapp'::"text", 'both'::"text"]))),
    CONSTRAINT "health_check_sessions_report_selection_check" CHECK (("report_selection" = ANY (ARRAY['summary'::"text", 'detailed'::"text", 'detailed_call'::"text"])))
);


ALTER TABLE "public"."health_check_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."health_check_sessions" IS 'A started health check session with delivery preferences.';



COMMENT ON COLUMN "public"."health_check_sessions"."terms_agreed" IS 'User confirmed they accept the Privacy Policy and Terms of Use.';



COMMENT ON COLUMN "public"."health_check_sessions"."terms_agreed_at" IS 'Timestamp when the user agreed to the Privacy Policy and Terms of Use.';



COMMENT ON COLUMN "public"."health_check_sessions"."terms_version" IS 'Version of the Privacy Policy / Terms of Use agreed to (e.g. 2026-08).';



COMMENT ON COLUMN "public"."health_check_sessions"."comms_consent" IS 'User consented to receive their report via their chosen channel(s).';



COMMENT ON COLUMN "public"."health_check_sessions"."comms_consent_at" IS 'Timestamp when communications consent was given.';



COMMENT ON COLUMN "public"."health_check_sessions"."consent_ip" IS 'IP address at the time of consent, for the compliance audit trail.';



CREATE TABLE IF NOT EXISTS "public"."health_check_subsections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "heading" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."health_check_subsections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_checks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "description" "text",
    "estimated_minutes" integer,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_url" "text",
    "detailed_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "detailed_call_price" numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."health_checks" OWNER TO "postgres";


COMMENT ON TABLE "public"."health_checks" IS 'Top-level health check catalogue entries.';



CREATE TABLE IF NOT EXISTS "public"."lms_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "public"."citext" NOT NULL,
    "category" "text" NOT NULL,
    "format" "text" NOT NULL,
    "duration" "text" NOT NULL,
    "level" "text" DEFAULT 'All Levels'::"text" NOT NULL,
    "description" "text",
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_url" "text"
);


ALTER TABLE "public"."lms_courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."lms_courses" IS 'Academy course catalogue powering the Academy page.';



CREATE OR REPLACE VIEW "public"."v_public_blog_posts" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."slug",
    "p"."title",
    "p"."excerpt",
    "p"."reading_minutes",
    "p"."cover_image_url",
    "p"."featured",
    "p"."published_at",
    COALESCE("p"."seo_title", ("p"."title")::character varying) AS "seo_title",
    COALESCE("p"."seo_description", ("p"."excerpt")::character varying) AS "seo_description",
    "p"."canonical_url",
    "p"."og_title",
    "p"."og_description",
    "p"."og_image_url",
    "c"."name" AS "primary_category",
    "c"."slug" AS "primary_category_slug",
    "a"."full_name" AS "author_name",
    "a"."slug" AS "author_slug"
   FROM (("public"."blog_posts" "p"
     LEFT JOIN "public"."blog_categories" "c" ON (("c"."id" = "p"."primary_category_id")))
     LEFT JOIN "public"."blog_authors" "a" ON (("a"."id" = "p"."author_id")))
  WHERE ("p"."status" = 'published'::"public"."post_status");


ALTER VIEW "public"."v_public_blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" DEFAULT 'twilio'::"text" NOT NULL,
    "phone_number_id" "text",
    "access_token_encrypted" "text",
    "account_sid" "text",
    "auth_token_encrypted" "text",
    "from_number" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "webhook_verify_token" "text",
    CONSTRAINT "whatsapp_config_provider_check" CHECK (("provider" = ANY (ARRAY['twilio'::"text", 'meta_cloud_api'::"text", 'infobip'::"text"])))
);


ALTER TABLE "public"."whatsapp_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text",
    "to_number" "text" NOT NULL,
    "to_name" "text",
    "body_sent" "text" NOT NULL,
    "variables_used" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_message_id" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "report_id" "uuid",
    "session_id" "uuid",
    "attempts" integer DEFAULT 0 NOT NULL,
    "last_attempted_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    CONSTRAINT "whatsapp_log_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'failed'::"text", 'read'::"text"])))
);


ALTER TABLE "public"."whatsapp_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "body_text" "text" NOT NULL,
    "available_variables" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "approval_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "rejection_reason" "text",
    "wa_template_id" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text",
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    CONSTRAINT "whatsapp_templates_approval_status_check" CHECK (("approval_status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."whatsapp_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."whatsapp_templates" IS 'WhatsApp Business message templates requiring approval before activation.';



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_authors"
    ADD CONSTRAINT "blog_authors_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."blog_authors"
    ADD CONSTRAINT "blog_authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_authors"
    ADD CONSTRAINT "blog_authors_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."consultation_bookings"
    ADD CONSTRAINT "consultation_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultation_bookings"
    ADD CONSTRAINT "consultation_bookings_reference_key" UNIQUE ("reference");



ALTER TABLE ONLY "public"."email_log"
    ADD CONSTRAINT "email_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_template_key_key" UNIQUE ("template_key");



ALTER TABLE ONLY "public"."health_check_answers"
    ADD CONSTRAINT "health_check_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_answers"
    ADD CONSTRAINT "health_check_answers_session_id_question_id_key" UNIQUE ("session_id", "question_id");



ALTER TABLE ONLY "public"."health_check_question_options"
    ADD CONSTRAINT "health_check_question_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_questions"
    ADD CONSTRAINT "health_check_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_rate_limit_config"
    ADD CONSTRAINT "health_check_rate_limit_config_health_check_id_key" UNIQUE ("health_check_id");



ALTER TABLE ONLY "public"."health_check_rate_limit_config"
    ADD CONSTRAINT "health_check_rate_limit_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_rate_limit_log"
    ADD CONSTRAINT "health_check_rate_limit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_report_prompts"
    ADD CONSTRAINT "health_check_report_prompts_health_check_id_report_type_key" UNIQUE ("health_check_id", "report_type");



ALTER TABLE ONLY "public"."health_check_report_prompts"
    ADD CONSTRAINT "health_check_report_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_reports"
    ADD CONSTRAINT "health_check_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_reports"
    ADD CONSTRAINT "health_check_reports_report_url_token_key" UNIQUE ("report_url_token");



ALTER TABLE ONLY "public"."health_check_reports"
    ADD CONSTRAINT "health_check_reports_session_id_report_type_key" UNIQUE ("session_id", "report_type");



ALTER TABLE ONLY "public"."health_check_sections"
    ADD CONSTRAINT "health_check_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_sessions"
    ADD CONSTRAINT "health_check_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_check_subsections"
    ADD CONSTRAINT "health_check_subsections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_checks"
    ADD CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_checks"
    ADD CONSTRAINT "health_checks_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."lms_courses"
    ADD CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lms_courses"
    ADD CONSTRAINT "lms_courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."whatsapp_config"
    ADD CONSTRAINT "whatsapp_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_log"
    ADD CONSTRAINT "whatsapp_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_templates"
    ADD CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_templates"
    ADD CONSTRAINT "whatsapp_templates_template_key_key" UNIQUE ("template_key");



CREATE INDEX "idx_admin_users_active" ON "public"."admin_users" USING "btree" ("is_active");



CREATE UNIQUE INDEX "idx_admin_users_auth_user_id" ON "public"."admin_users" USING "btree" ("auth_user_id") WHERE ("auth_user_id" IS NOT NULL);



CREATE INDEX "idx_blog_comments_post_status" ON "public"."blog_comments" USING "btree" ("blog_post_id", "status", "created_at" DESC);



CREATE INDEX "idx_blog_comments_recent" ON "public"."blog_comments" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_blog_posts_featured" ON "public"."blog_posts" USING "btree" ("featured") WHERE ("featured" IS TRUE);



CREATE INDEX "idx_blog_posts_status_published" ON "public"."blog_posts" USING "btree" ("status", "published_at" DESC);



CREATE INDEX "idx_email_log_report" ON "public"."email_log" USING "btree" ("report_id");



CREATE INDEX "idx_email_log_session" ON "public"."email_log" USING "btree" ("session_id");



CREATE INDEX "idx_email_log_status" ON "public"."email_log" USING "btree" ("status");



CREATE INDEX "idx_hcr_session" ON "public"."health_check_reports" USING "btree" ("session_id");



CREATE INDEX "idx_hcr_token" ON "public"."health_check_reports" USING "btree" ("report_url_token");



CREATE INDEX "idx_hcs_check_started" ON "public"."health_check_sessions" USING "btree" ("health_check_id", "started_at");



CREATE INDEX "idx_hcs_email" ON "public"."health_check_sessions" USING "btree" ("email");



CREATE INDEX "idx_hcs_ip" ON "public"."health_check_sessions" USING "btree" ("ip_address");



CREATE INDEX "idx_hcs_whatsapp" ON "public"."health_check_sessions" USING "btree" ("whatsapp");



CREATE INDEX "idx_lms_courses_active_order" ON "public"."lms_courses" USING "btree" ("is_active", "sort_order");



CREATE INDEX "idx_rl_log_email" ON "public"."health_check_rate_limit_log" USING "btree" ("health_check_id", "email", "attempted_at");



CREATE INDEX "idx_rl_log_ip" ON "public"."health_check_rate_limit_log" USING "btree" ("health_check_id", "ip_address", "attempted_at");



CREATE INDEX "idx_rl_log_wa" ON "public"."health_check_rate_limit_log" USING "btree" ("health_check_id", "whatsapp", "attempted_at");



CREATE INDEX "idx_wa_log_session" ON "public"."whatsapp_log" USING "btree" ("session_id");



CREATE INDEX "idx_wa_log_status" ON "public"."whatsapp_log" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "trg_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_blog_authors_updated_at" BEFORE UPDATE ON "public"."blog_authors" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_blog_categories_updated_at" BEFORE UPDATE ON "public"."blog_categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_blog_posts_derive_fields" BEFORE INSERT OR UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."blog_posts_derive_fields"();



CREATE OR REPLACE TRIGGER "trg_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_email_templates_updated_at" BEFORE UPDATE ON "public"."email_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_enforce_max_featured_blog_posts" AFTER INSERT OR UPDATE OF "featured" ON "public"."blog_posts" FOR EACH STATEMENT EXECUTE FUNCTION "public"."enforce_max_featured_blog_posts"();



CREATE OR REPLACE TRIGGER "trg_hc_prompt_version_bump" BEFORE UPDATE ON "public"."health_check_report_prompts" FOR EACH ROW EXECUTE FUNCTION "public"."hc_prompt_version_bump"();



CREATE OR REPLACE TRIGGER "trg_hc_report_prompts_updated_at" BEFORE UPDATE ON "public"."health_check_report_prompts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_health_check_questions_updated_at" BEFORE UPDATE ON "public"."health_check_questions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_health_check_sections_updated_at" BEFORE UPDATE ON "public"."health_check_sections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_health_check_subsections_updated_at" BEFORE UPDATE ON "public"."health_check_subsections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_health_checks_updated_at" BEFORE UPDATE ON "public"."health_checks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_lms_courses_updated_at" BEFORE UPDATE ON "public"."lms_courses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_whatsapp_templates_updated_at" BEFORE UPDATE ON "public"."whatsapp_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_blog_post_id_fkey" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_comments"
    ADD CONSTRAINT "blog_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."blog_authors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "public"."blog_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_log"
    ADD CONSTRAINT "email_log_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."health_check_reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_log"
    ADD CONSTRAINT "email_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."health_check_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_check_answers"
    ADD CONSTRAINT "health_check_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."health_check_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_answers"
    ADD CONSTRAINT "health_check_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."health_check_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_question_options"
    ADD CONSTRAINT "health_check_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."health_check_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_questions"
    ADD CONSTRAINT "health_check_questions_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "public"."health_check_subsections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_rate_limit_config"
    ADD CONSTRAINT "health_check_rate_limit_config_health_check_id_fkey" FOREIGN KEY ("health_check_id") REFERENCES "public"."health_checks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_rate_limit_config"
    ADD CONSTRAINT "health_check_rate_limit_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_check_rate_limit_log"
    ADD CONSTRAINT "health_check_rate_limit_log_health_check_id_fkey" FOREIGN KEY ("health_check_id") REFERENCES "public"."health_checks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_report_prompts"
    ADD CONSTRAINT "health_check_report_prompts_health_check_id_fkey" FOREIGN KEY ("health_check_id") REFERENCES "public"."health_checks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_report_prompts"
    ADD CONSTRAINT "health_check_report_prompts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_check_reports"
    ADD CONSTRAINT "health_check_reports_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_check_reports"
    ADD CONSTRAINT "health_check_reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."health_check_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_sections"
    ADD CONSTRAINT "health_check_sections_health_check_id_fkey" FOREIGN KEY ("health_check_id") REFERENCES "public"."health_checks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_sessions"
    ADD CONSTRAINT "health_check_sessions_health_check_id_fkey" FOREIGN KEY ("health_check_id") REFERENCES "public"."health_checks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_check_subsections"
    ADD CONSTRAINT "health_check_subsections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."health_check_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_config"
    ADD CONSTRAINT "whatsapp_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."whatsapp_log"
    ADD CONSTRAINT "whatsapp_log_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."health_check_reports"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."whatsapp_log"
    ADD CONSTRAINT "whatsapp_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."health_check_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."whatsapp_templates"
    ADD CONSTRAINT "whatsapp_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE SET NULL;



CREATE POLICY "Anyone can create a booking" ON "public"."consultation_bookings" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Service role can manage bookings" ON "public"."consultation_bookings" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_users_authenticated_read_own" ON "public"."admin_users" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "admin_users_service_all" ON "public"."admin_users" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."blog_authors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_authors_authenticated_all" ON "public"."blog_authors" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "blog_authors_public_read" ON "public"."blog_authors" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "blog_authors_service_all" ON "public"."blog_authors" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_categories_authenticated_all" ON "public"."blog_categories" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "blog_categories_public_read" ON "public"."blog_categories" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "blog_categories_service_all" ON "public"."blog_categories" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."blog_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_comments_anon_insert" ON "public"."blog_comments" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("status" = 'pending'::"text") AND (("length"("btrim"("author_name")) >= 1) AND ("length"("btrim"("author_name")) <= 120)) AND (("length"("btrim"("content")) >= 1) AND ("length"("btrim"("content")) <= 2000))));



CREATE POLICY "blog_comments_authenticated_all" ON "public"."blog_comments" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "blog_comments_public_read" ON "public"."blog_comments" FOR SELECT TO "authenticated", "anon" USING (("status" = 'approved'::"text"));



ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blog_posts_authenticated_all" ON "public"."blog_posts" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "blog_posts_public_read" ON "public"."blog_posts" FOR SELECT TO "authenticated", "anon" USING ((("status" = 'published'::"public"."post_status") AND (("published_at" IS NULL) OR ("published_at" <= "now"()))));



CREATE POLICY "blog_posts_service_all" ON "public"."blog_posts" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."consultation_bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consultation_bookings_anon_insert" ON "public"."consultation_bookings" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "consultation_bookings_service_all" ON "public"."consultation_bookings" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."email_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_log_admin_r" ON "public"."email_log" FOR SELECT TO "authenticated" USING ("public"."is_blog_admin"());



CREATE POLICY "email_log_svc" ON "public"."email_log" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_tmpl_admin_all" ON "public"."email_templates" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "email_tmpl_svc" ON "public"."email_templates" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hc_admin_all" ON "public"."health_checks" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hc_answers_admin_r" ON "public"."health_check_answers" FOR SELECT TO "authenticated" USING ("public"."is_blog_admin"());



CREATE POLICY "hc_answers_anon_insert" ON "public"."health_check_answers" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "hc_answers_svc" ON "public"."health_check_answers" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hc_prompts_admin_all" ON "public"."health_check_report_prompts" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hc_prompts_svc" ON "public"."health_check_report_prompts" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hc_public_read" ON "public"."health_checks" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "hc_reports_admin_all" ON "public"."health_check_reports" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hc_reports_svc" ON "public"."health_check_reports" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hc_reports_token_read" ON "public"."health_check_reports" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "hc_rl_cfg_svc" ON "public"."health_check_rate_limit_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hc_rl_config_admin" ON "public"."health_check_rate_limit_config" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hc_rl_log_svc" ON "public"."health_check_rate_limit_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hc_service" ON "public"."health_checks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hc_sessions_admin_r" ON "public"."health_check_sessions" FOR SELECT TO "authenticated" USING ("public"."is_blog_admin"());



CREATE POLICY "hc_sessions_anon_insert" ON "public"."health_check_sessions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "hc_sessions_svc" ON "public"."health_check_sessions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hcq_admin_all" ON "public"."health_check_questions" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hcq_public_read" ON "public"."health_check_questions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "hcq_service" ON "public"."health_check_questions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hcqo_admin_all" ON "public"."health_check_question_options" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hcqo_public_read" ON "public"."health_check_question_options" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "hcqo_service" ON "public"."health_check_question_options" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hcs_admin_all" ON "public"."health_check_sections" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hcs_public_read" ON "public"."health_check_sections" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "hcs_service" ON "public"."health_check_sections" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "hcss_admin_all" ON "public"."health_check_subsections" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "hcss_public_read" ON "public"."health_check_subsections" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "hcss_service" ON "public"."health_check_subsections" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."health_check_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_question_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_rate_limit_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_rate_limit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_report_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_check_subsections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lms_courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lms_courses_authenticated_all" ON "public"."lms_courses" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "lms_courses_public_read" ON "public"."lms_courses" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "lms_courses_service_all" ON "public"."lms_courses" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "wa_config_admin_all" ON "public"."whatsapp_config" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "wa_config_svc" ON "public"."whatsapp_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "wa_log_admin_r" ON "public"."whatsapp_log" FOR SELECT TO "authenticated" USING ("public"."is_blog_admin"());



CREATE POLICY "wa_log_svc" ON "public"."whatsapp_log" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "wa_tmpl_admin_all" ON "public"."whatsapp_templates" TO "authenticated" USING ("public"."is_blog_admin"()) WITH CHECK ("public"."is_blog_admin"());



CREATE POLICY "wa_tmpl_svc" ON "public"."whatsapp_templates" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."whatsapp_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_templates" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."blog_posts_derive_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."blog_posts_derive_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."blog_posts_derive_fields"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_rate_limit"("p_health_check_id" "uuid", "p_ip" "inet", "p_email" "public"."citext", "p_whatsapp" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_health_check_id" "uuid", "p_ip" "inet", "p_email" "public"."citext", "p_whatsapp" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_health_check_id" "uuid", "p_ip" "inet", "p_email" "public"."citext", "p_whatsapp" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_health_check_id" "uuid", "p_ip" "inet", "p_email" "public"."citext", "p_whatsapp" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_max_featured_blog_posts"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_max_featured_blog_posts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_max_featured_blog_posts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hc_prompt_version_bump"() TO "anon";
GRANT ALL ON FUNCTION "public"."hc_prompt_version_bump"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hc_prompt_version_bump"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_blog_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_blog_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_blog_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_blog_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."make_slug"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."make_slug"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."make_slug"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";









GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."blog_authors" TO "anon";
GRANT ALL ON TABLE "public"."blog_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_authors" TO "service_role";



GRANT ALL ON TABLE "public"."blog_categories" TO "anon";
GRANT ALL ON TABLE "public"."blog_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_categories" TO "service_role";



GRANT ALL ON TABLE "public"."blog_comments" TO "anon";
GRANT ALL ON TABLE "public"."blog_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_comments" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."consultation_bookings" TO "anon";
GRANT ALL ON TABLE "public"."consultation_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."consultation_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."email_log" TO "anon";
GRANT ALL ON TABLE "public"."email_log" TO "authenticated";
GRANT ALL ON TABLE "public"."email_log" TO "service_role";



GRANT ALL ON TABLE "public"."email_templates" TO "anon";
GRANT ALL ON TABLE "public"."email_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."email_templates" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_answers" TO "anon";
GRANT ALL ON TABLE "public"."health_check_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_answers" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_question_options" TO "anon";
GRANT ALL ON TABLE "public"."health_check_question_options" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_question_options" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_questions" TO "anon";
GRANT ALL ON TABLE "public"."health_check_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_questions" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_rate_limit_config" TO "anon";
GRANT ALL ON TABLE "public"."health_check_rate_limit_config" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_rate_limit_config" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_rate_limit_log" TO "anon";
GRANT ALL ON TABLE "public"."health_check_rate_limit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_rate_limit_log" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_report_prompts" TO "anon";
GRANT ALL ON TABLE "public"."health_check_report_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_report_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_reports" TO "anon";
GRANT ALL ON TABLE "public"."health_check_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_reports" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_sections" TO "anon";
GRANT ALL ON TABLE "public"."health_check_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_sections" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_sessions" TO "anon";
GRANT ALL ON TABLE "public"."health_check_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."health_check_subsections" TO "anon";
GRANT ALL ON TABLE "public"."health_check_subsections" TO "authenticated";
GRANT ALL ON TABLE "public"."health_check_subsections" TO "service_role";



GRANT ALL ON TABLE "public"."health_checks" TO "anon";
GRANT ALL ON TABLE "public"."health_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."health_checks" TO "service_role";



GRANT ALL ON TABLE "public"."lms_courses" TO "anon";
GRANT ALL ON TABLE "public"."lms_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."lms_courses" TO "service_role";



GRANT ALL ON TABLE "public"."v_public_blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."v_public_blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."v_public_blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_config" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_config" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_config" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_log" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_log" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_log" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_templates" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_templates" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

drop policy "blog_authors_public_read" on "public"."blog_authors";

drop policy "blog_categories_public_read" on "public"."blog_categories";

drop policy "blog_comments_anon_insert" on "public"."blog_comments";

drop policy "blog_comments_public_read" on "public"."blog_comments";

drop policy "blog_posts_public_read" on "public"."blog_posts";

drop policy "consultation_bookings_anon_insert" on "public"."consultation_bookings";

drop policy "hc_answers_anon_insert" on "public"."health_check_answers";

drop policy "hcqo_public_read" on "public"."health_check_question_options";

drop policy "hcq_public_read" on "public"."health_check_questions";

drop policy "hc_reports_token_read" on "public"."health_check_reports";

drop policy "hcs_public_read" on "public"."health_check_sections";

drop policy "hc_sessions_anon_insert" on "public"."health_check_sessions";

drop policy "hcss_public_read" on "public"."health_check_subsections";

drop policy "hc_public_read" on "public"."health_checks";

drop policy "lms_courses_public_read" on "public"."lms_courses";


  create policy "blog_authors_public_read"
  on "public"."blog_authors"
  as permissive
  for select
  to anon, authenticated
using ((is_active = true));



  create policy "blog_categories_public_read"
  on "public"."blog_categories"
  as permissive
  for select
  to anon, authenticated
using ((is_active = true));



  create policy "blog_comments_anon_insert"
  on "public"."blog_comments"
  as permissive
  for insert
  to anon, authenticated
with check (((status = 'pending'::text) AND ((length(btrim(author_name)) >= 1) AND (length(btrim(author_name)) <= 120)) AND ((length(btrim(content)) >= 1) AND (length(btrim(content)) <= 2000))));



  create policy "blog_comments_public_read"
  on "public"."blog_comments"
  as permissive
  for select
  to anon, authenticated
using ((status = 'approved'::text));



  create policy "blog_posts_public_read"
  on "public"."blog_posts"
  as permissive
  for select
  to anon, authenticated
using (((status = 'published'::public.post_status) AND ((published_at IS NULL) OR (published_at <= now()))));



  create policy "consultation_bookings_anon_insert"
  on "public"."consultation_bookings"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "hc_answers_anon_insert"
  on "public"."health_check_answers"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "hcqo_public_read"
  on "public"."health_check_question_options"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "hcq_public_read"
  on "public"."health_check_questions"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "hc_reports_token_read"
  on "public"."health_check_reports"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "hcs_public_read"
  on "public"."health_check_sections"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "hc_sessions_anon_insert"
  on "public"."health_check_sessions"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "hcss_public_read"
  on "public"."health_check_subsections"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "hc_public_read"
  on "public"."health_checks"
  as permissive
  for select
  to anon, authenticated
using ((is_active = true));



  create policy "lms_courses_public_read"
  on "public"."lms_courses"
  as permissive
  for select
  to anon, authenticated
using ((is_active = true));



  create policy "deni_sawa_anon_read_media"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'deni_sawa'::text));



  create policy "deni_sawa_authenticated_all"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using ((bucket_id = 'deni_sawa'::text))
with check ((bucket_id = 'deni_sawa'::text));



  create policy "deni_sawa_service_all"
  on "storage"."objects"
  as permissive
  for all
  to service_role
using ((bucket_id = 'deni_sawa'::text))
with check ((bucket_id = 'deni_sawa'::text));



