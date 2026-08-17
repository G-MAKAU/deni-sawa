-- Deni Sawa — Record AI generation failures on health check reports.
-- Lets the admin/report viewer distinguish a real AI report from the
-- deterministic fallback (which was previously indistinguishable, and the
-- stored model_used even mislabeled it as the configured model).

begin;

alter table public.health_check_reports
  add column if not exists generation_error text;

commit;
