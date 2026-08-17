-- Deni Sawa — Admin password reset support.
-- Lets super admins/team members reset a forgotten password from the login
-- screen. Run after 20260815000001_create_health_check_system.sql.

begin;

alter table public.admin_users
  add column if not exists reset_token text,
  add column if not exists reset_token_expires_at timestamptz;

commit;
