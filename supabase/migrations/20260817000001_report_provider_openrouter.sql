-- Deni Sawa — Allow OpenRouter as a report-generation provider so reports can
-- be generated via a paid, quota-free key (e.g. google/gemini-2.5-flash on
-- OpenRouter) instead of the Gemini free tier's 20 requests/day cap.
-- Run after 20260816000004_report_provider.sql.

begin;

alter table public.health_check_report_prompts
  drop constraint if exists health_check_report_prompts_provider_check;

alter table public.health_check_report_prompts
  add constraint health_check_report_prompts_provider_check
  check (provider in ('anthropic', 'google', 'openrouter'));

commit;