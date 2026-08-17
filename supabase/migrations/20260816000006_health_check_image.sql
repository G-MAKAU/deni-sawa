-- Deni Sawa — Health check cover image.
-- Lets each health check have a cover image selected from Supabase storage,
-- shown on the public intro page. Run after 20260815000001_create_health_check_system.sql.

begin;

alter table public.health_checks
  add column if not exists image_url text;

commit;
