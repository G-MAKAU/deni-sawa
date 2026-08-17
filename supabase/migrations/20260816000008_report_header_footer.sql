-- Deni Sawa — Per-report custom Header & Footer (template-level).
-- Each report prompt (per health check + report type) carries its own branded
-- Header and Footer as Lexical EditorState (images + links supported). The
-- report viewer/exporters read them live from this template for the matching
-- (health_check_id, report_type), so edits apply without regenerating reports.

begin;

alter table public.health_check_report_prompts
  add column if not exists header_lexical jsonb,
  add column if not exists footer_lexical jsonb;

commit;
