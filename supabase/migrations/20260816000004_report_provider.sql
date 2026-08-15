-- Deni Sawa — Allow choosing the report-generation provider (Anthropic or
-- Google Gemini) per prompt, and keep models free-text so newly released
-- models can be used without code changes. Run after 20260816000003_max_tokens.sql.

begin;

alter table public.health_check_report_prompts
  add column if not exists provider text not null default 'anthropic'
  check (provider in ('anthropic', 'google'));

commit;
