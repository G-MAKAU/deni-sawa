-- Admin report editing: track who last edited a report body and when.
alter table public.health_check_reports
  add column if not exists edited_by  uuid references public.admin_users(id) on delete set null,
  add column if not exists edited_at  timestamptz;
