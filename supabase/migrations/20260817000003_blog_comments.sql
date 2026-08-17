-- ── Blog comments ─────────────────────────────────────────────────────────
-- Visitors may leave comments on published posts; comments are held for
-- moderation and appear publicly once approved.
create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null references public.blog_posts(id) on delete cascade,
  parent_id uuid references public.blog_comments(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  author_website text,
  content text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_comments_post_status
  on public.blog_comments(blog_post_id, status, created_at desc);

create index if not exists idx_blog_comments_recent
  on public.blog_comments(status, created_at desc);

alter table public.blog_comments enable row level security;

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

-- Admins may approve, reject or remove comments.
drop policy if exists blog_comments_authenticated_all on public.blog_comments;
create policy blog_comments_authenticated_all
on public.blog_comments
for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());
