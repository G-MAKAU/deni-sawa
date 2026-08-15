-- Deni Sawa — Allow report prompt max_tokens up to 200,000 (Claude's context
-- window). Run after 20260816000002_report_failed_template.sql.

begin;

alter table public.health_check_report_prompts
  drop constraint if exists health_check_report_prompts_max_tokens_check;

alter table public.health_check_report_prompts
  add constraint health_check_report_prompts_max_tokens_check
  check (max_tokens between 500 and 200000);

commit;
