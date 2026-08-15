-- Deni Sawa — Admin team management via RLS.
-- Lets super admins manage admin_users through the authenticated (user-scoped)
-- API client, so the admin console does not require the service-role key for
-- the /admin/team pages. Run after 20260815000001_create_health_check_system.sql.

begin;

-- True when the signed-in user is an active super admin.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and is_active = true
      and role = 'super_admin'
  );
$$;

revoke execute on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- Super admins may read every team member (own-record read already exists).
drop policy if exists admin_users_authenticated_read_all on public.admin_users;
create policy admin_users_authenticated_read_all
  on public.admin_users
  for select
  to authenticated
  using (public.is_super_admin());

-- Super admins may create / update / delete team members.
drop policy if exists admin_users_authenticated_manage on public.admin_users;
create policy admin_users_authenticated_manage
  on public.admin_users
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

commit;
