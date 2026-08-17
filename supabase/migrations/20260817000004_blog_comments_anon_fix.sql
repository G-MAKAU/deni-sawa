-- ── Fix: ensure blog_comments anon insert works ────────────────────────────
-- Recreates the RLS policies (idempotent) and grants so anonymous visitors
-- can post comments (held as pending) while only approved ones are readable.
alter table public.blog_comments enable row level security;

-- Explicit grants in case default privileges missed this table.
grant select, insert on table public.blog_comments to anon;
grant select, insert, update, delete on table public.blog_comments to service_role;

-- Visitors may read approved comments.
drop policy if exists blog_comments_public_read on public.blog_comments;
create policy blog_comments_public_read
on public.blog_comments
for select
to anon, authenticated
using (status = 'approved');

-- Visitors may leave a comment; it is held as pending for moderation.
drop policy if exists blog_comments_anon_insert on public.blog_comments;
create policy blog_comments_anon_insert
on public.blog_comments
for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(btrim(author_name)) between 1 and 120
  and length(btrim(content)) between 1 and 2000
);

-- Admins may approve, reject or remove comments. Guard the is_blog_admin()
-- helper so this statement never aborts the rest of the migration.
create or replace function public.is_blog_admin()
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
  );
$$;

revoke execute on function public.is_blog_admin() from public;
grant execute on function public.is_blog_admin() to authenticated;

drop policy if exists blog_comments_authenticated_all on public.blog_comments;
create policy blog_comments_authenticated_all
on public.blog_comments
for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());