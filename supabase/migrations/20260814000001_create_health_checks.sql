-- Deni Sawa — Health Checks: questions, responses and AI diagnostic reports.
-- The app degrades gracefully to bundled question banks when these tables are
-- not yet created, so this migration is optional for the site to function.
-- Run in the Supabase SQL editor (Dashboard > SQL Editor) or `supabase db push`.

begin;

create extension if not exists pgcrypto;

-- ── health_check_questions ────────────────────────────────────────────────
-- Question banks per check type. Question set can be edited in the admin/DB
-- without code changes; the app reads active rows ordered by sort_order.
create table if not exists public.health_check_questions (
  id            text primary key,
  check_type    text not null default 'business' check (check_type in ('business', 'professional')),
  category      text not null,
  text          text not null,
  input_type    text not null check (input_type in ('choice', 'multi', 'scale', 'text')),
  options       text[] default '{}',
  scale_labels  jsonb,
  placeholder   text,
  required      boolean not null default true,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists health_check_questions_type_idx
  on public.health_check_questions (check_type, sort_order);

-- ── health_check_responses ────────────────────────────────────────────────
-- Raw answers keyed by report/session id.
create table if not exists public.health_check_responses (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  check_type  text not null check (check_type in ('business', 'professional')),
  question_id text not null,
  answer      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists health_check_responses_session_idx
  on public.health_check_responses (session_id);

-- ── health_check_reports ──────────────────────────────────────────────────
-- The generated lexical-state report, private and unique per report_id.
create table if not exists public.health_check_reports (
  report_id     text primary key,
  check_type    text not null check (check_type in ('business', 'professional')),
  email         text,
  lexical_state jsonb not null default '{}'::jsonb,
  summary       text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists health_check_reports_email_idx
  on public.health_check_reports (email)
  where email is not null;

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Reports are private: the app reads them with the service-role key from the
-- server (route + report page), so the anon key can never list or read them.
-- The unguessable report URL is the only access path.
alter table public.health_check_questions enable row level security;
alter table public.health_check_responses enable row level security;
alter table public.health_check_reports enable row level security;

create policy "questions are readable"
  on public.health_check_questions for select
  using (is_active = true);

create policy "responses are insertable"
  on public.health_check_responses for insert
  with check (true);

create policy "responses are not readable"
  on public.health_check_responses for select
  using (false);

create policy "reports are insertable"
  on public.health_check_reports for insert
  with check (true);

create policy "reports are not publicly readable"
  on public.health_check_reports for select
  using (false);

commit;
