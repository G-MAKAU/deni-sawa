 
-- ============================================ 
-- MIGRATION: 20260809000001_create_consultation_bookings.sql 
-- ============================================ 
-- Deni Sawa — consultation bookings created from the website AI chat
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query), or apply via `supabase db push`.

create table if not exists public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null,
  contact text not null,
  contact_type text not null default 'phone',
  service text not null,
  preferred_date date,
  preferred_time text,
  message text,
  source text not null default 'website-chat',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.consultation_bookings enable row level security;

create policy "Anyone can create a booking"
  on public.consultation_bookings
  for insert
  to anon
  with check (true);

create policy "Service role can manage bookings"
  on public.consultation_bookings
  for all
  to service_role
  using (true)
  with check (true);
 
-- ============================================ 
-- MIGRATION: 20260813000001_create_blog_academy_cms.sql 
-- ============================================ 
-- Deni Sawa — Blog CMS, Academy/LMS catalogue and admin identity.
-- Modeled on the Horizon Spire schema so the frontend and admin CMS stay in sync.
-- Run in the Supabase SQL editor (Dashboard > SQL Editor) or `supabase db push`.

begin;

-- ── Extensions & shared helpers ────────────────────────────────────────────
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists unaccent;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Normalize arbitrary text into a URL-friendly slug.
create or replace function public.make_slug(input_text text)
returns text
language sql
stable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(coalesce(input_text, ''))), '[^a-z0-9]+', '-', 'g'));
$$;

-- Custom enums keep blog and booking state consistent across the schema.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_status') then
    create type public.post_status as enum (
      'draft',
      'review',
      'scheduled',
      'published',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum (
      'super_admin',
      'admin',
      'manager',
      'support'
    );
  end if;
end $$;

-- ── Blog authors ───────────────────────────────────────────────────────────
create table if not exists public.blog_authors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug citext not null unique,
  email citext unique,
  bio text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_blog_authors_updated_at
before update on public.blog_authors
for each row execute function public.set_updated_at();

-- ── Blog categories ────────────────────────────────────────────────────────
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_blog_categories_updated_at
before update on public.blog_categories
for each row execute function public.set_updated_at();

-- ── Blog posts ─────────────────────────────────────────────────────────────
-- content_markdown is the authoring source; content_html is the sanitized,
-- Lexical-editor output rendered by the frontend blog pages.
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  title text not null,
  excerpt text,
  content_markdown text not null,
  content_html text,
  author_id uuid references public.blog_authors(id) on delete set null,
  primary_category_id uuid references public.blog_categories(id) on delete set null,
  status public.post_status not null default 'draft',
  featured boolean not null default false,
  published_at timestamptz,
  scheduled_for timestamptz,
  reading_minutes integer check (reading_minutes is null or reading_minutes > 0),
  cover_image_url text,
  canonical_url text,
  seo_title varchar(70),
  seo_description varchar(160),
  seo_keywords text,
  seo_robots text not null default 'index_follow'
    check (seo_robots in ('index_follow', 'index_nofollow', 'noindex_follow', 'noindex_nofollow')),
  og_title text,
  og_description text,
  og_image_url text,
  twitter_card text check (twitter_card is null or twitter_card in ('summary', 'summary_large_image')),
  schema_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null),
  check (status <> 'scheduled' or scheduled_for is not null)
);

create index if not exists idx_blog_posts_status_published
  on public.blog_posts(status, published_at desc);

create index if not exists idx_blog_posts_featured
  on public.blog_posts(featured)
  where featured is true;

create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

-- Derive slug, reading time, and publish timestamp automatically.
create or replace function public.blog_posts_derive_fields()
returns trigger
language plpgsql
as $$
declare
  word_count integer;
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.make_slug(new.title);
  else
    new.slug := public.make_slug(new.slug);
  end if;

  word_count := array_length(regexp_split_to_array(coalesce(new.content_markdown, ''), E'\\s+'), 1);

  if coalesce(new.reading_minutes, 0) <= 0 then
    new.reading_minutes := greatest(1, ceil(coalesce(word_count, 0) / 220.0)::int);
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_blog_posts_derive_fields on public.blog_posts;
create trigger trg_blog_posts_derive_fields
before insert or update on public.blog_posts
for each row execute function public.blog_posts_derive_fields();

-- Keep the featured set intentionally small (max 2).
create or replace function public.enforce_max_featured_blog_posts()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  update public.blog_posts
  set featured = false
  where featured = true
    and id not in (
      select id
      from public.blog_posts
      where featured = true
      order by coalesce(published_at, created_at) desc nulls last, updated_at desc
      limit 2
    );

  return null;
end;
$$;

drop trigger if exists trg_enforce_max_featured_blog_posts on public.blog_posts;
create trigger trg_enforce_max_featured_blog_posts
after insert or update of featured on public.blog_posts
for each statement execute function public.enforce_max_featured_blog_posts();

-- ── Academy / LMS course catalogue ─────────────────────────────────────────
create table if not exists public.lms_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug citext not null unique,
  category text not null,
  format text not null,
  duration text not null,
  level text not null default 'All Levels',
  description text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lms_courses_active_order
  on public.lms_courses(is_active, sort_order);

create trigger trg_lms_courses_updated_at
before update on public.lms_courses
for each row execute function public.set_updated_at();

-- ── Admin identity (minimal, blog-scoped) ──────────────────────────────────
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email citext not null unique,
  role public.admin_role not null default 'support',
  is_active boolean not null default true,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_users_active on public.admin_users(is_active);

create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

-- ── Public-facing blog view ────────────────────────────────────────────────
-- security_invoker means the anon RLS policy below still applies, so drafts
-- never leak even if someone queries the view directly.
create or replace view public.v_public_blog_posts
with (security_invoker = true) as
select
  p.id,
  p.slug,
  p.title,
  p.excerpt,
  p.reading_minutes,
  p.cover_image_url,
  p.featured,
  p.published_at,
  coalesce(p.seo_title, p.title) as seo_title,
  coalesce(p.seo_description, p.excerpt) as seo_description,
  p.canonical_url,
  p.og_title,
  p.og_description,
  p.og_image_url,
  c.name as primary_category,
  c.slug as primary_category_slug,
  a.full_name as author_name,
  a.slug as author_slug
from public.blog_posts p
left join public.blog_categories c on c.id = p.primary_category_id
left join public.blog_authors a on a.id = p.author_id
where p.status = 'published';

-- ── Row-level security ─────────────────────────────────────────────────────
alter table public.blog_authors enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.lms_courses enable row level security;
alter table public.admin_users enable row level security;

-- Whether the signed-in user is an active member of the Deni Sawa team.
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

-- Public (anon) read policies — published content only.
drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read
on public.blog_posts
for select
to anon, authenticated
using (status = 'published' and (published_at is null or published_at <= now()));

drop policy if exists blog_authors_public_read on public.blog_authors;
create policy blog_authors_public_read
on public.blog_authors
for select
to anon, authenticated
using (is_active = true);

drop policy if exists blog_categories_public_read on public.blog_categories;
create policy blog_categories_public_read
on public.blog_categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists lms_courses_public_read on public.lms_courses;
create policy lms_courses_public_read
on public.lms_courses
for select
to anon, authenticated
using (is_active = true);

-- Anonymous visitors may create consultation bookings (existing table).
drop policy if exists consultation_bookings_anon_insert on public.consultation_bookings;
create policy consultation_bookings_anon_insert
on public.consultation_bookings
for insert
to anon, authenticated
with check (true);

-- Authenticated admin policies allow direct management of blog content.
drop policy if exists blog_authors_authenticated_all on public.blog_authors;
create policy blog_authors_authenticated_all
on public.blog_authors
for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

drop policy if exists blog_categories_authenticated_all on public.blog_categories;
create policy blog_categories_authenticated_all
on public.blog_categories
for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

drop policy if exists blog_posts_authenticated_all on public.blog_posts;
create policy blog_posts_authenticated_all
on public.blog_posts
for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

drop policy if exists lms_courses_authenticated_all on public.lms_courses;
create policy lms_courses_authenticated_all
on public.lms_courses
for all
to authenticated
using (public.is_blog_admin())
with check (public.is_blog_admin());

-- Admin identity: authenticated users may read their own record only.
drop policy if exists admin_users_authenticated_read_own on public.admin_users;
create policy admin_users_authenticated_read_own
on public.admin_users
for select
to authenticated
using (auth.uid() is not null and email = auth.jwt() ->> 'email');

-- Service-role full control for server-side management.
drop policy if exists admin_users_service_all on public.admin_users;
create policy admin_users_service_all
on public.admin_users
for all
to service_role
using (true)
with check (true);

drop policy if exists blog_authors_service_all on public.blog_authors;
create policy blog_authors_service_all
on public.blog_authors
for all
to service_role
using (true)
with check (true);

drop policy if exists blog_categories_service_all on public.blog_categories;
create policy blog_categories_service_all
on public.blog_categories
for all
to service_role
using (true)
with check (true);

drop policy if exists blog_posts_service_all on public.blog_posts;
create policy blog_posts_service_all
on public.blog_posts
for all
to service_role
using (true)
with check (true);

drop policy if exists lms_courses_service_all on public.lms_courses;
create policy lms_courses_service_all
on public.lms_courses
for all
to service_role
using (true)
with check (true);

-- ── Storage bucket for blog & course media ─────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deni_sawa',
  'deni_sawa',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists deni_sawa_anon_read_media on storage.objects;
create policy deni_sawa_anon_read_media
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'deni_sawa');

drop policy if exists deni_sawa_authenticated_all on storage.objects;
create policy deni_sawa_authenticated_all
on storage.objects
for all
to authenticated
using (bucket_id = 'deni_sawa')
with check (bucket_id = 'deni_sawa');

drop policy if exists deni_sawa_service_all on storage.objects;
create policy deni_sawa_service_all
on storage.objects
for all
to service_role
using (bucket_id = 'deni_sawa')
with check (bucket_id = 'deni_sawa');

-- ── Seed: categories ───────────────────────────────────────────────────────
insert into public.blog_categories (name, slug, description)
values
  ('Debt Management', 'debt-management', 'Practical guidance for understanding, reducing and resolving personal and business debt.'),
  ('Financial Coaching', 'financial-coaching', 'One-on-one coaching, budgeting, saving and accountability for lasting money habits.'),
  ('Corporate Wellness', 'corporate-wellness', 'Financial wellness for the workforce and advisory for SMEs and entrepreneurs.'),
  ('Money Mindset', 'money-mindset', 'The psychology of money — behavioural finance rooted in values and integrity.')
on conflict (slug) do nothing;

-- ── Seed: authors ──────────────────────────────────────────────────────────
insert into public.blog_authors (full_name, slug, email, bio, is_active)
values
  ('Deni Sawa Team', 'deni-sawa-team', 'advisory@denisawa.co.ke',
   'The Deni Sawa advisory team — seasoned bankers and financial coaches helping individuals and businesses reach debt-free futures.', true),
  ('Daniel Mwangi', 'daniel-mwangi', null,
   'Senior debt management advisor with 15+ years in banking, risk and restructuring.', true)
on conflict (slug) do nothing;

-- ── Seed: featured post (index 1) ──────────────────────────────────────────
insert into public.blog_posts (
  slug, title, excerpt, content_markdown, content_html,
  author_id, primary_category_id, status, featured, published_at,
  reading_minutes, cover_image_url, seo_title, seo_description, seo_keywords
)
select
  'understanding-what-is-driving-your-debt',
  'Understanding What Is Driving Your Debt',
  'The first step to freedom is clarity. Learn to understand what created your debt and take a calm, confident first step toward resolving it.',
  E'## Debt is rarely a single moment\n\nMost debt builds quietly. A small emergency here, a habit there, and suddenly repayments dominate your month. Before anything else, we need **clarity**.\n\n### The most common drivers\n\n- **Bank charges & penalties** on missed or late repayments\n- **Auction fees & legal charges** that escalate a manageable loan\n- **Credit card & digital loan debt** with compounding interest\n- **Payday loan cycles** that trap you month after month\n- **Business & SME debt distress** from uneven cash flow\n\n> The moment you name your debt, it stops being a mystery and starts being a plan.\n\n## Take stock without judgement\n\nWrite down what you owe, to whom, and the interest rate. You do not need every detail — a rough map is enough to begin. This is the single most powerful first step because it turns anxiety into a list of decisions.\n\n## A plan is a decision\n\nWith a complete picture, we build a structured repayment plan tailored to your income. Our three programmes run **12 to 48 weeks** and pair you with a seasoned advisor who stays with you through check-ins and accountability.\n\n- **Starter** — 12 weeks of dedicated advisory and coaching\n- **Standard** — 24 weeks with regular monitoring\n- **Solid** — 48 weeks with governance and funding support',
  E'<h2>Debt is rarely a single moment</h2><p>Most debt builds quietly. A small emergency here, a habit there, and suddenly repayments dominate your month. Before anything else, we need <strong>clarity</strong>.</p><h3>The most common drivers</h3><ul><li><p><strong>Bank charges &amp; penalties</strong> on missed or late repayments</p></li><li><p><strong>Auction fees &amp; legal charges</strong> that escalate a manageable loan</p></li><li><p><strong>Credit card &amp; digital loan debt</strong> with compounding interest</p></li><li><p><strong>Payday loan cycles</strong> that trap you month after month</p></li><li><p><strong>Business &amp; SME debt distress</strong> from uneven cash flow</p></li></ul><blockquote>The moment you name your debt, it stops being a mystery and starts being a plan.</blockquote><h2>Take stock without judgement</h2><p>Write down what you owe, to whom, and the interest rate. You do not need every detail — a rough map is enough to begin. This is the single most powerful first step because it turns anxiety into a list of decisions.</p><h2>A plan is a decision</h2><p>With a complete picture, we build a structured repayment plan tailored to your income. Our three programmes run <strong>12 to 48 weeks</strong> and pair you with a seasoned advisor who stays with you through check-ins and accountability.</p><ul><li><p><strong>Starter</strong> — 12 weeks of dedicated advisory and coaching</p></li><li><p><strong>Standard</strong> — 24 weeks with regular monitoring</p></li><li><p><strong>Solid</strong> — 48 weeks with governance and funding support</p></li></ul>',
  (select id from public.blog_authors where slug = 'deni-sawa-team'),
  (select id from public.blog_categories where slug = 'debt-management'),
  'published', true,
  now() - interval '35 days',
  5, null,
  'Understanding What Is Driving Your Debt | Deni Sawa',
  'Learn how to identify the real drivers of your debt and take the first calm, confident step toward resolving it.',
  'debt, debt management, financial coaching, loans, Kenya'
on conflict (slug) do nothing;

-- ── Seed: post 2 ───────────────────────────────────────────────────────────
insert into public.blog_posts (
  slug, title, excerpt, content_markdown, content_html,
  author_id, primary_category_id, status, featured, published_at,
  reading_minutes, cover_image_url, seo_title, seo_description, seo_keywords
)
select
  'how-to-build-a-debt-free-future',
  'How to Build a Debt-Free Future',
  'A practical, step-by-step guide from the Deni Sawa advisory team to help you break free from debt and enjoy lasting financial peace of mind.',
  E'## Freedom is built, not found\n\nA debt-free future is the result of a sequence of small, consistent decisions. Here is the path our advisors walk with clients every week.\n\n### 1. See your whole picture\n\nList every debt, its interest rate, and its minimum payment. Group them by urgency — secured loans first, then the highest-interest unsecured debt.\n\n### 2. Build a buffer before you overpay\n\nKeep a small emergency fund (even KES 5,000–10,000) so an unexpected bill does not push you back into borrowing.\n\n### 3. Choose a repayment strategy\n\n- **Avalanche** — pay the highest-interest debt first to save money\n- **Snowball** — clear the smallest debt first to build momentum\n\n> The best strategy is the one you will actually stick to.\n\n### 4. Negotiate like a pro\n\nMany creditors will restructure or waive penalties if you engage early. Our advisors regularly negotiate repayment plans that protect clients from auction fees and legal costs.\n\n### 5. Protect the new habit\n\nAutomate savings, keep a monthly budget, and review your money with someone who holds you accountable — that is exactly what one-on-one coaching provides.',
  E'<h2>Freedom is built, not found</h2><p>A debt-free future is the result of a sequence of small, consistent decisions. Here is the path our advisors walk with clients every week.</p><h3>1. See your whole picture</h3><p>List every debt, its interest rate, and its minimum payment. Group them by urgency — secured loans first, then the highest-interest unsecured debt.</p><h3>2. Build a buffer before you overpay</h3><p>Keep a small emergency fund (even KES 5,000–10,000) so an unexpected bill does not push you back into borrowing.</p><h3>3. Choose a repayment strategy</h3><ul><li><p><strong>Avalanche</strong> — pay the highest-interest debt first to save money</p></li><li><p><strong>Snowball</strong> — clear the smallest debt first to build momentum</p></li></ul><blockquote>The best strategy is the one you will actually stick to.</blockquote><h3>4. Negotiate like a pro</h3><p>Many creditors will restructure or waive penalties if you engage early. Our advisors regularly negotiate repayment plans that protect clients from auction fees and legal costs.</p><h3>5. Protect the new habit</h3><p>Automate savings, keep a monthly budget, and review your money with someone who holds you accountable — that is exactly what one-on-one coaching provides.</p>',
  (select id from public.blog_authors where slug = 'deni-sawa-team'),
  (select id from public.blog_categories where slug = 'financial-coaching'),
  'published', true,
  now() - interval '21 days',
  7, null,
  'How to Build a Debt-Free Future | Deni Sawa',
  'A practical step-by-step guide to breaking free from debt and building lasting financial peace of mind.',
  'debt-free, budgeting, saving, repayment plan, coaching'
on conflict (slug) do nothing;

-- ── Seed: post 3 ───────────────────────────────────────────────────────────
insert into public.blog_posts (
  slug, title, excerpt, content_markdown, content_html,
  author_id, primary_category_id, status, featured, published_at,
  reading_minutes, cover_image_url, seo_title, seo_description, seo_keywords
)
select
  'financial-wellness-in-the-workplace',
  'Financial Wellness in the Workplace',
  'Why corporate financial wellness matters and how organisations can support employees facing financial pressure — without judgement or stigma.',
  E'## Stress follows employees to work\n\nFinancial pressure is one of the largest silent drags on productivity. When employees worry about debt, focus drops, absence rises, and morale erodes.\n\n### Why it matters\n\n- Lower presenteeism — worried employees are physically present but mentally absent\n- Reduced attrition — staff stay where they feel supported\n- Better decision-making under pressure\n\n> An employer that supports financial wellbeing builds loyalty money alone cannot buy.\n\n### What a wellness programme looks like\n\nOur corporate offering is delivered on-site or as group sessions and includes:\n\n- Confidential one-on-one coaching windows\n- Budgeting and debt-awareness workshops\n- Group savings and investment basics\n- Manager guidance on responding to financial stress with dignity\n\n## Start small, measure often\n\nBegin with a two-hour workshop and a confidential survey. The data tells you what your workforce needs next — and the results compound quickly.',
  E'<h2>Stress follows employees to work</h2><p>Financial pressure is one of the largest silent drags on productivity. When employees worry about debt, focus drops, absence rises, and morale erodes.</p><h3>Why it matters</h3><ul><li><p>Lower presenteeism — worried employees are physically present but mentally absent</p></li><li><p>Reduced attrition — staff stay where they feel supported</p></li><li><p>Better decision-making under pressure</p></li></ul><blockquote>An employer that supports financial wellbeing builds loyalty money alone cannot buy.</blockquote><h3>What a wellness programme looks like</h3><p>Our corporate offering is delivered on-site or as group sessions and includes:</p><ul><li><p>Confidential one-on-one coaching windows</p></li><li><p>Budgeting and debt-awareness workshops</p></li><li><p>Group savings and investment basics</p></li><li><p>Manager guidance on responding to financial stress with dignity</p></li></ul><h2>Start small, measure often</h2><p>Begin with a two-hour workshop and a confidential survey. The data tells you what your workforce needs next — and the results compound quickly.</p>',
  (select id from public.blog_authors where slug = 'daniel-mwangi'),
  (select id from public.blog_categories where slug = 'corporate-wellness'),
  'published', false,
  now() - interval '10 days',
  6, null,
  'Financial Wellness in the Workplace | Deni Sawa',
  'How organisations can support employees facing financial pressure through confidential corporate wellness programmes.',
  'corporate wellness, employee wellbeing, financial literacy, SME advisory'
on conflict (slug) do nothing;

-- ── Seed: post 4 ───────────────────────────────────────────────────────────
insert into public.blog_posts (
  slug, title, excerpt, content_markdown, content_html,
  author_id, primary_category_id, status, featured, published_at,
  reading_minutes, cover_image_url, seo_title, seo_description, seo_keywords
)
select
  'money-mindset-a-biblical-approach',
  'Money Mindset: A Biblical Approach',
  'How our Christian-based principles of service and integrity shape the way we coach, and how they can reshape your relationship with money.',
  E'## Money is a servant, not a master\n\nScripture is full of wisdom about money — stewardship, contentment, honesty, and generosity. These principles shape how we coach because they work.\n\n### Stewardship\n\nWe do not own our resources; we manage them. Stewardship reframes budgeting from restriction to faithful responsibility.\n\n> \u201cWhere your treasure is, there your heart will be also.\u201d — Matthew 6:21\n\n### Contentment and honesty\n\nDebt often grows in the gap between what we earn and what we feel we must have. Practising contentment lowers that pressure; honesty keeps our plans realistic.\n\n### Service to others\n\nOur mission is to serve God and humankind. That is why every Deni Sawa programme is built on professional, ethical, sustainable advice — never pressure, never judgement.\n\n## From guilt to grace\n\nIf shame keeps you from facing your finances, you are not alone. Our coaches meet you where you are, without judgement, and help you build a plan grounded in dignity and hope.',
  E'<h2>Money is a servant, not a master</h2><p>Scripture is full of wisdom about money — stewardship, contentment, honesty, and generosity. These principles shape how we coach because they work.</p><h3>Stewardship</h3><p>We do not own our resources; we manage them. Stewardship reframes budgeting from restriction to faithful responsibility.</p><blockquote>\u201cWhere your treasure is, there your heart will be also.\u201d — Matthew 6:21</blockquote><h3>Contentment and honesty</h3><p>Debt often grows in the gap between what we earn and what we feel we must have. Practising contentment lowers that pressure; honesty keeps our plans realistic.</p><h3>Service to others</h3><p>Our mission is to serve God and humankind. That is why every Deni Sawa programme is built on professional, ethical, sustainable advice — never pressure, never judgement.</p><h2>From guilt to grace</h2><p>If shame keeps you from facing your finances, you are not alone. Our coaches meet you where you are, without judgement, and help you build a plan grounded in dignity and hope.</p>',
  (select id from public.blog_authors where slug = 'deni-sawa-team'),
  (select id from public.blog_categories where slug = 'money-mindset'),
  'published', false,
  now() - interval '3 days',
  4, null,
  'Money Mindset: A Biblical Approach | Deni Sawa',
  'How Christian-based principles of service, stewardship and integrity shape the way Deni Sawa coaches.',
  'money mindset, biblical finance, stewardship, coaching, Kenya'
on conflict (slug) do nothing;

-- ── Seed: academy courses ──────────────────────────────────────────────────
insert into public.lms_courses (title, slug, category, format, duration, level, description, image_url, is_featured, sort_order)
values
  ('Young Adults Coaching Program', 'young-adults-coaching-program', 'Coaching', 'Workshop Series', '6 weeks', 'Beginner',
   'A coaching program designed for young adults stepping into financial independence — covering personal financial management, debt avoidance, and money mindset.', '/images/service-financial-coaching.jpg', true, 10),
  ('Financial Wellness Coaching', 'financial-wellness-coaching', 'Wellness', 'Webinar', '4 sessions', 'All Levels',
   'Transform your financial situation with guided wellness coaching sessions covering budgeting, saving, and sustainable debt management.', '/images/service-financial-literacy.jpg', false, 20),
  ('Debt Management & Advisory', 'debt-management-and-advisory', 'Debt Management', 'One-on-One', '12–48 weeks', 'Intermediate',
   'Structured advisory programmes that take you from debt crisis to debt-free status through professional, ethical, and sustainable solutions.', '/images/service-debt-management.jpg', true, 30),
  ('Corporate Financial Wellness', 'corporate-financial-wellness', 'Corporate', 'On-Site Training', 'Custom', 'All Levels',
   'Organisational financial wellness training that reduces employee financial stress and builds a culture of financial health across your company.', '/images/service-corporate-wellness.jpg', false, 40)
on conflict (slug) do nothing;

-- ── Comments ───────────────────────────────────────────────────────────────
comment on table public.blog_posts is 'Blog posts with editorial content (markdown + sanitized HTML) and SEO metadata.';
comment on table public.lms_courses is 'Academy course catalogue powering the Academy page.';
comment on table public.admin_users is 'Staff who may sign in and manage blog content.';

commit; 
-- ============================================ 
-- MIGRATION: 20260814000001_create_health_checks.sql 
-- ============================================ 
-- Deni Sawa — Health Checks: questions, responses and AI diagnostic reports.
-- The app degrades gracefully to bundled question banks when these tables are
-- not yet created, so this migration is optional for the site to function.
-- Run in the Supabase SQL editor (Dashboard > SQL Editor) or `supabase db push`.

begin;

create extension if not exists pgcrypto;

-- ── health_check_questions ────────────────────────────────────────────────
-- Question banks per check type. Question set can be edited in the admin/DB
-- without code changes; the app reads active rows ordered by sort_order.
create table if not exists public.health_check_questions (
  id            text primary key,
  check_type    text not null default 'business' check (check_type in ('business', 'professional')),
  category      text not null,
  text          text not null,
  input_type    text not null check (input_type in ('choice', 'multi', 'scale', 'text')),
  options       text[] default '{}',
  scale_labels  jsonb,
  placeholder   text,
  required      boolean not null default true,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists health_check_questions_type_idx
  on public.health_check_questions (check_type, sort_order);

-- ── health_check_responses ────────────────────────────────────────────────
-- Raw answers keyed by report/session id.
create table if not exists public.health_check_responses (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  check_type  text not null check (check_type in ('business', 'professional')),
  question_id text not null,
  answer      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists health_check_responses_session_idx
  on public.health_check_responses (session_id);

-- ── health_check_reports ──────────────────────────────────────────────────
-- The generated lexical-state report, private and unique per report_id.
create table if not exists public.health_check_reports (
  report_id     text primary key,
  check_type    text not null check (check_type in ('business', 'professional')),
  email         text,
  lexical_state jsonb not null default '{}'::jsonb,
  summary       text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists health_check_reports_email_idx
  on public.health_check_reports (email)
  where email is not null;

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Reports are private: the app reads them with the service-role key from the
-- server (route + report page), so the anon key can never list or read them.
-- The unguessable report URL is the only access path.
alter table public.health_check_questions enable row level security;
alter table public.health_check_responses enable row level security;
alter table public.health_check_reports enable row level security;

create policy "questions are readable"
  on public.health_check_questions for select
  using (is_active = true);

create policy "responses are insertable"
  on public.health_check_responses for insert
  with check (true);

create policy "responses are not readable"
  on public.health_check_responses for select
  using (false);

create policy "reports are insertable"
  on public.health_check_reports for insert
  with check (true);

create policy "reports are not publicly readable"
  on public.health_check_reports for select
  using (false);

commit;
 
-- ============================================ 
-- MIGRATION: 20260815000001_create_health_check_system.sql 
-- ============================================ 
-- ────────────────────────────────────────────────────────────────────────────
-- Deni Sawa Partners — Health Check System
-- Full schema: health check question tree, sessions, answers, AI reports,
-- report prompts, email + WhatsApp templates, delivery logging, rate limiting.
-- Run the ENTIRE file as a single transaction (Supabase SQL Editor).
-- ────────────────────────────────────────────────────────────────────────────

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- Extensions & shared helpers
-- ════════════════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;
create extension if not exists citext;

-- ════════════════════════════════════════════════════════════════════════════
-- FIX 1 — Link admin_users to Supabase Auth
-- ════════════════════════════════════════════════════════════════════════════
alter table public.admin_users
  add column if not exists auth_user_id uuid
    references auth.users(id) on delete set null;

create unique index if not exists idx_admin_users_auth_user_id
  on public.admin_users(auth_user_id)
  where auth_user_id is not null;

-- ════════════════════════════════════════════════════════════════════════════
-- FIX 2 — consultation_bookings (referenced by existing RLS but never defined)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.consultation_bookings (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       citext,
  whatsapp    text,
  message     text,
  source      text,
  created_at  timestamptz not null default now(),
  check (email is not null or whatsapp is not null)
);

alter table public.consultation_bookings enable row level security;

drop policy if exists consultation_bookings_anon_insert on public.consultation_bookings;
create policy consultation_bookings_anon_insert
  on public.consultation_bookings
  for insert to anon, authenticated
  with check (true);

drop policy if exists consultation_bookings_service_all on public.consultation_bookings;
create policy consultation_bookings_service_all
  on public.consultation_bookings
  for all to service_role
  using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════════════
-- Transition: v1 health-check tables used a different shape (text ids,
-- check_type / category / text columns) and are replaced by the v2 schema.
-- ════════════════════════════════════════════════════════════════════════════
drop table if exists public.health_check_responses;
drop table if exists public.health_check_questions;
drop table if exists public.health_check_reports;

-- ────────────────────────────────────────────────────────────────────────────
-- health_checks — the top-level assessment catalogue entry
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_checks (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               citext not null unique,
  description        text,
  estimated_minutes  integer,
  tags               text[] not null default '{}',
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger trg_health_checks_updated_at
  before update on public.health_checks
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_sections — top-level grouping of a health check
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_sections (
  id               uuid primary key default gen_random_uuid(),
  health_check_id  uuid not null references public.health_checks(id) on delete cascade,
  title            text not null,
  description      text,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_health_check_sections_updated_at
  before update on public.health_check_sections
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_subsections — grouping inside a section
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_subsections (
  id          uuid primary key default gen_random_uuid(),
  section_id  uuid not null references public.health_check_sections(id) on delete cascade,
  heading     text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_health_check_subsections_updated_at
  before update on public.health_check_subsections
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_questions
--   question_type controls the UI:
--     paragraph      → free-text textarea; answer stored in answer_text
--     single_select  → radio buttons; exactly ONE uuid in selected_option_ids
--     multi_select   → checkboxes; one or more uuids in selected_option_ids
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_questions (
  id             uuid primary key default gen_random_uuid(),
  subsection_id  uuid not null references public.health_check_subsections(id) on delete cascade,
  question_text  text not null,
  question_type  text not null
    check (question_type in ('paragraph', 'single_select', 'multi_select')),
  is_required    boolean not null default true,
  helper_text    text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_health_check_questions_updated_at
  before update on public.health_check_questions
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_question_options — options for single/multi select questions
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.health_check_questions(id) on delete cascade,
  option_text text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_sessions — a started assessment
--   business_name required for Business Health Check, optional for Professional.
--   At least one of email / whatsapp required. preferred_delivery controls
--   which channel(s) the report is delivered on.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_sessions (
  id                    uuid primary key default gen_random_uuid(),
  health_check_id       uuid not null references public.health_checks(id) on delete cascade,
  full_name             text not null,
  business_name         text,
  email                 citext,
  whatsapp              text,
  preferred_delivery    text not null default 'email'
    check (preferred_delivery in ('email', 'whatsapp', 'both')),
  ip_address            inet,
  user_agent            text,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  time_taken_seconds    integer,
  is_complete           boolean not null default false,
  check (email is not null or whatsapp is not null)
);

create index if not exists idx_hcs_check_started
  on public.health_check_sessions(health_check_id, started_at);
create index if not exists idx_hcs_email
  on public.health_check_sessions(email);
create index if not exists idx_hcs_whatsapp
  on public.health_check_sessions(whatsapp);
create index if not exists idx_hcs_ip
  on public.health_check_sessions(ip_address);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_answers — one row per question per session.
--   paragraph      → answer_text populated, selected_option_ids = {}
--   single_select  → selected_option_ids has exactly 1 uuid, answer_text NULL
--   multi_select   → selected_option_ids has 1+ uuids, answer_text NULL
--   Single-select cardinality enforced in the API layer.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_answers (
  id                   uuid primary key default gen_random_uuid(),
  session_id           uuid not null references public.health_check_sessions(id) on delete cascade,
  question_id          uuid not null references public.health_check_questions(id) on delete cascade,
  answer_text          text,
  selected_option_ids  uuid[] not null default '{}',
  created_at           timestamptz not null default now(),
  unique(session_id, question_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_reports — generated reports per session per report_type.
--   lexical_state: Claude returns Lexical EditorState JSON — stored here.
--   report_url_token: 64-char hex public access key (no auth needed).
--   is_paid: detailed reports require payment before delivery.
--   delivery_status: whether the report was sent to the user.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_reports (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.health_check_sessions(id) on delete cascade,
  report_type         text not null check (report_type in ('summary', 'detailed')),
  lexical_state       jsonb not null,
  prompt_snapshot     text not null,
  model_used          text not null,
  tokens_used         integer,
  generation_seconds  numeric(6,2),
  report_url_token    text unique not null default encode(gen_random_bytes(32), 'hex'),
  is_paid             boolean not null default false,
  delivery_status     text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'failed', 'skipped')),
  accessed_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique(session_id, report_type)
);

create index if not exists idx_hcr_token
  on public.health_check_reports(report_url_token);
create index if not exists idx_hcr_session
  on public.health_check_reports(session_id);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_report_prompts — AI prompt config per health check per type.
--   system_prompt:         plain text sent directly to Claude on generation.
--   system_prompt_lexical: Lexical EditorState JSON loaded into the admin editor.
--   version + previous_system_prompt allow one-step rollback in the admin UI.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_report_prompts (
  id                      uuid primary key default gen_random_uuid(),
  health_check_id         uuid not null
    references public.health_checks(id) on delete cascade,
  report_type             text not null
    check (report_type in ('summary', 'detailed')),
  system_prompt           text not null,
  system_prompt_lexical   jsonb,
  model                   text not null default 'claude-sonnet-4-6',
  max_tokens              integer not null default 4000
    check (max_tokens between 500 and 8000),
  is_active               boolean not null default true,
  updated_by              uuid
    references public.admin_users(id) on delete set null,
  version                 integer not null default 1,
  previous_system_prompt  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique(health_check_id, report_type)
);

create trigger trg_hc_report_prompts_updated_at
  before update on public.health_check_report_prompts
  for each row execute function public.set_updated_at();

-- Auto-increment version and snapshot previous plain text on every save.
create or replace function public.hc_prompt_version_bump()
returns trigger language plpgsql as $$
begin
  if new.system_prompt is distinct from old.system_prompt then
    new.version := old.version + 1;
    new.previous_system_prompt := old.system_prompt;
  end if;
  return new;
end;
$$;

create trigger trg_hc_prompt_version_bump
  before update on public.health_check_report_prompts
  for each row execute function public.hc_prompt_version_bump();

-- ────────────────────────────────────────────────────────────────────────────
-- email_templates — editable branded email templates for all notifications.
--   body_lexical: Lexical EditorState JSON — what the admin edits in the UI.
--   body_html:    rendered HTML cache; regenerated from lexical on every save.
--   Variables use {{variable_name}} syntax in subject, preview_text and body.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_templates (
  id                   uuid primary key default gen_random_uuid(),
  template_key         text not null unique,
  name                 text not null,
  subject              text not null,
  preview_text         text,
  body_lexical         jsonb not null,
  body_html            text,
  from_name            text not null default 'Deni Sawa Partners',
  from_email           citext not null default 'noreply@denisawa.co.ke',
  reply_to             citext,
  is_active            boolean not null default true,
  available_variables  text[] not null default '{}',
  updated_by           uuid references public.admin_users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- email_log — every outbound email attempt for audit, retry, delivery tracking
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_log (
  id               uuid primary key default gen_random_uuid(),
  template_key     text,
  to_email         citext not null,
  to_name          text,
  subject          text not null,
  body_html        text not null,
  variables_used   jsonb not null default '{}',
  smtp_message_id  text,
  status           text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'bounced')),
  error_message    text,
  report_id        uuid references public.health_check_reports(id) on delete set null,
  session_id       uuid references public.health_check_sessions(id) on delete set null,
  attempts         integer not null default 0,
  last_attempted_at timestamptz,
  sent_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists idx_email_log_status  on public.email_log(status);
create index if not exists idx_email_log_session on public.email_log(session_id);
create index if not exists idx_email_log_report  on public.email_log(report_id);

-- ────────────────────────────────────────────────────────────────────────────
-- whatsapp_templates — pre-approved WhatsApp Business message templates.
--   body_text uses {{variable_name}} syntax (plain text only).
--   is_active only becomes true after approval_status = 'approved'.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_templates (
  id                  uuid primary key default gen_random_uuid(),
  template_key        text not null unique,
  name                text not null,
  body_text           text not null,
  available_variables text[] not null default '{}',
  approval_status     text not null default 'draft'
    check (approval_status in ('draft', 'submitted', 'approved', 'rejected')),
  rejection_reason    text,
  wa_template_id      text,
  is_active           boolean not null default false,
  updated_by          uuid references public.admin_users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_whatsapp_templates_updated_at
  before update on public.whatsapp_templates
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- whatsapp_config — single-row WhatsApp Business API credentials.
--   Credentials encrypted at the application layer with AES-256-GCM
--   (Node crypto + CREDENTIALS_ENCRYPTION_KEY env var) before storage.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_config (
  id                    uuid primary key default gen_random_uuid(),
  provider              text not null default 'twilio'
    check (provider in ('twilio', 'meta_cloud_api', 'infobip')),
  phone_number_id       text,
  access_token_encrypted text,
  account_sid           text,
  auth_token_encrypted  text,
  from_number           text,
  is_active             boolean not null default false,
  updated_by            uuid references public.admin_users(id) on delete set null,
  updated_at            timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- whatsapp_log — every outbound WhatsApp message attempt.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.whatsapp_log (
  id                  uuid primary key default gen_random_uuid(),
  template_key        text,
  to_number           text not null,
  to_name             text,
  body_sent           text not null,
  variables_used      jsonb not null default '{}',
  provider            text not null,
  provider_message_id text,
  status              text not null default 'pending'
    check (status in ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message       text,
  report_id           uuid references public.health_check_reports(id) on delete set null,
  session_id          uuid references public.health_check_sessions(id) on delete set null,
  attempts            integer not null default 0,
  last_attempted_at   timestamptz,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_wa_log_status  on public.whatsapp_log(status);
create index if not exists idx_wa_log_session on public.whatsapp_log(session_id);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_rate_limit_config — per-check monthly limits from admin UI.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_rate_limit_config (
  id                          uuid primary key default gen_random_uuid(),
  health_check_id             uuid not null
    references public.health_checks(id) on delete cascade unique,
  monthly_limit_per_ip        integer not null default 5,
  monthly_limit_per_email     integer not null default 5,
  monthly_limit_per_whatsapp  integer not null default 5,
  is_active                   boolean not null default true,
  updated_by                  uuid references public.admin_users(id) on delete set null,
  updated_at                  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- health_check_rate_limit_log — every rate-limit check attempt.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.health_check_rate_limit_log (
  id               uuid primary key default gen_random_uuid(),
  health_check_id  uuid not null references public.health_checks(id) on delete cascade,
  ip_address       inet,
  email            citext,
  whatsapp         text,
  attempted_at     timestamptz not null default now(),
  was_blocked      boolean not null default false
);

create index if not exists idx_rl_log_ip
  on public.health_check_rate_limit_log(health_check_id, ip_address, attempted_at);
create index if not exists idx_rl_log_email
  on public.health_check_rate_limit_log(health_check_id, email, attempted_at);
create index if not exists idx_rl_log_wa
  on public.health_check_rate_limit_log(health_check_id, whatsapp, attempted_at);

-- ════════════════════════════════════════════════════════════════════════════
-- Rate limiting function
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.check_rate_limit(
  p_health_check_id  uuid,
  p_ip               inet,
  p_email            citext,
  p_whatsapp         text
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_config       public.health_check_rate_limit_config%rowtype;
  v_ip_count     integer := 0;
  v_email_count  integer := 0;
  v_wa_count     integer := 0;
  v_month_start  timestamptz := date_trunc('month', now());
  v_allowed      boolean := true;
begin
  select * into v_config
  from public.health_check_rate_limit_config
  where health_check_id = p_health_check_id;

  if not found or not v_config.is_active then
    v_config.monthly_limit_per_ip        := 5;
    v_config.monthly_limit_per_email     := 5;
    v_config.monthly_limit_per_whatsapp  := 5;
  end if;

  if p_ip is not null then
    select count(*) into v_ip_count
    from public.health_check_rate_limit_log
    where health_check_id = p_health_check_id
      and ip_address = p_ip
      and attempted_at >= v_month_start
      and was_blocked = false;
    if v_ip_count >= v_config.monthly_limit_per_ip then
      v_allowed := false;
    end if;
  end if;

  if v_allowed and p_email is not null then
    select count(*) into v_email_count
    from public.health_check_rate_limit_log
    where health_check_id = p_health_check_id
      and email = p_email
      and attempted_at >= v_month_start
      and was_blocked = false;
    if v_email_count >= v_config.monthly_limit_per_email then
      v_allowed := false;
    end if;
  end if;

  if v_allowed and p_whatsapp is not null then
    select count(*) into v_wa_count
    from public.health_check_rate_limit_log
    where health_check_id = p_health_check_id
      and whatsapp = p_whatsapp
      and attempted_at >= v_month_start
      and was_blocked = false;
    if v_wa_count >= v_config.monthly_limit_per_whatsapp then
      v_allowed := false;
    end if;
  end if;

  insert into public.health_check_rate_limit_log
    (health_check_id, ip_address, email, whatsapp, was_blocked)
  values
    (p_health_check_id, p_ip, p_email, p_whatsapp, not v_allowed);

  return v_allowed;
end;
$$;

revoke execute on function public.check_rate_limit(uuid, inet, citext, text) from public;
grant  execute on function public.check_rate_limit(uuid, inet, citext, text) to service_role;

-- ════════════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ════════════════════════════════════════════════════════════════════════════
alter table public.health_checks                  enable row level security;
alter table public.health_check_sections          enable row level security;
alter table public.health_check_subsections       enable row level security;
alter table public.health_check_questions         enable row level security;
alter table public.health_check_question_options  enable row level security;
alter table public.health_check_sessions          enable row level security;
alter table public.health_check_answers           enable row level security;
alter table public.health_check_reports           enable row level security;
alter table public.health_check_rate_limit_config enable row level security;
alter table public.health_check_rate_limit_log    enable row level security;
alter table public.email_templates                enable row level security;
alter table public.email_log                      enable row level security;
alter table public.whatsapp_templates             enable row level security;
alter table public.whatsapp_config                enable row level security;
alter table public.whatsapp_log                   enable row level security;
alter table public.health_check_report_prompts    enable row level security;

-- Public read: active health checks and the full question tree
create policy hc_public_read   on public.health_checks               for select to anon, authenticated using (is_active = true);
create policy hcs_public_read  on public.health_check_sections        for select to anon, authenticated using (true);
create policy hcss_public_read on public.health_check_subsections     for select to anon, authenticated using (true);
create policy hcq_public_read  on public.health_check_questions       for select to anon, authenticated using (true);
create policy hcqo_public_read on public.health_check_question_options for select to anon, authenticated using (true);

-- Anon can start a session and submit answers
create policy hc_sessions_anon_insert on public.health_check_sessions for insert to anon, authenticated with check (true);
create policy hc_answers_anon_insert  on public.health_check_answers  for insert to anon, authenticated with check (true);

-- Reports: public read by token (token IS the access control — no auth needed)
create policy hc_reports_token_read on public.health_check_reports for select to anon, authenticated using (true);

-- Admin full access
create policy hc_admin_all         on public.health_checks                  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcs_admin_all        on public.health_check_sections           for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcss_admin_all       on public.health_check_subsections        for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcq_admin_all        on public.health_check_questions          for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hcqo_admin_all       on public.health_check_question_options   for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hc_rl_config_admin   on public.health_check_rate_limit_config  for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy hc_sessions_admin_r  on public.health_check_sessions           for select to authenticated using (public.is_blog_admin());
create policy hc_answers_admin_r   on public.health_check_answers            for select to authenticated using (public.is_blog_admin());
create policy hc_reports_admin_all on public.health_check_reports            for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy email_tmpl_admin_all on public.email_templates                 for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy email_log_admin_r    on public.email_log                       for select to authenticated using (public.is_blog_admin());
create policy wa_tmpl_admin_all    on public.whatsapp_templates               for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy wa_config_admin_all  on public.whatsapp_config                 for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());
create policy wa_log_admin_r       on public.whatsapp_log                    for select to authenticated using (public.is_blog_admin());
create policy hc_prompts_admin_all on public.health_check_report_prompts      for all to authenticated using (public.is_blog_admin()) with check (public.is_blog_admin());

-- Service role full access
create policy hc_service      on public.health_checks                  for all to service_role using (true) with check (true);
create policy hcs_service     on public.health_check_sections          for all to service_role using (true) with check (true);
create policy hcss_service    on public.health_check_subsections       for all to service_role using (true) with check (true);
create policy hcq_service     on public.health_check_questions         for all to service_role using (true) with check (true);
create policy hcqo_service    on public.health_check_question_options  for all to service_role using (true) with check (true);
create policy hc_sessions_svc on public.health_check_sessions          for all to service_role using (true) with check (true);
create policy hc_answers_svc  on public.health_check_answers           for all to service_role using (true) with check (true);
create policy hc_reports_svc  on public.health_check_reports           for all to service_role using (true) with check (true);
create policy hc_rl_cfg_svc   on public.health_check_rate_limit_config for all to service_role using (true) with check (true);
create policy hc_rl_log_svc   on public.health_check_rate_limit_log    for all to service_role using (true) with check (true);
create policy email_tmpl_svc  on public.email_templates                for all to service_role using (true) with check (true);
create policy email_log_svc   on public.email_log                      for all to service_role using (true) with check (true);
create policy wa_tmpl_svc     on public.whatsapp_templates             for all to service_role using (true) with check (true);
create policy wa_config_svc   on public.whatsapp_config                for all to service_role using (true) with check (true);
create policy wa_log_svc      on public.whatsapp_log                   for all to service_role using (true) with check (true);
create policy hc_prompts_svc  on public.health_check_report_prompts    for all to service_role using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════════════
-- Seed data
-- ════════════════════════════════════════════════════════════════════════════

-- ── Health checks ───────────────────────────────────────────────────────────
insert into public.health_checks
  (name, slug, description, estimated_minutes, tags, sort_order)
values
(
  'Business Health Check',
  'business-health-check',
  'An AI-powered assessment of your business across Financial Health, Operations, Governance, Cashflow and Growth Readiness. Receive a prioritised diagnostic report.',
  20,
  array['Financial','Operations','Governance','Cashflow','Growth'],
  10
),
(
  'Professional Financial Health Check',
  'professional-financial-health-check',
  'An AI-powered assessment of your personal financial position across income, debt, cashflow, savings, resilience and future security.',
  15,
  array['Personal Finance','Debt','Cashflow','Savings','Resilience'],
  20
)
on conflict (slug) do nothing;

-- ── Sections: Business Health Check ─────────────────────────────────────────
with chk as (select id from public.health_checks where slug = 'business-health-check')
insert into public.health_check_sections (health_check_id, title, sort_order)
select chk.id, s.title, s.ord from chk,
(values
  ('Financial Health', 1),
  ('Operations',       2),
  ('Governance',       3),
  ('Cashflow',         4),
  ('Growth & Investment Readiness', 5)
) as s(title, ord)
on conflict do nothing;

-- ── Sections: Professional Financial Health Check ───────────────────────────
with chk as (select id from public.health_checks where slug = 'professional-financial-health-check')
insert into public.health_check_sections (health_check_id, title, sort_order)
select chk.id, s.title, s.ord from chk,
(values
  ('Personal Finances',       1),
  ('Debt & Liabilities',      2),
  ('Cashflow',                3),
  ('Savings & Investments',   4),
  ('Future Resilience',       5)
) as s(title, ord)
on conflict do nothing;

-- ── Report prompts ──────────────────────────────────────────────────────────
insert into public.health_check_report_prompts
  (health_check_id, report_type, system_prompt, max_tokens)
values
(
  (select id from public.health_checks where slug = 'business-health-check'),
  'summary',
  'You are a professional financial analyst for Deni Sawa Partners. The user has completed a Business Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section summary, ParagraphNode for key findings. Do NOT include recommendations. Do NOT return any text outside the JSON object. Keep the output concise — this is a summary report.',
  2000
),
(
  (select id from public.health_checks where slug = 'business-health-check'),
  'detailed',
  'You are a senior strategic advisor for Deni Sawa Partners. The user has completed a Business Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section, HeadingNode H3 for sub-findings, ParagraphNode for analysis, ListNode (bullet) for detailed findings, QuoteNode for the top 3 priority areas requiring immediate attention. End with an H2 section titled Recommendations containing ListNode items for each actionable recommendation. Be thorough, specific, and professionally direct. Do NOT return any text outside the JSON object.',
  4000
),
(
  (select id from public.health_checks where slug = 'professional-financial-health-check'),
  'summary',
  'You are a professional financial analyst for Deni Sawa Partners. The user has completed a Professional Financial Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section summary, ParagraphNode for key findings. Do NOT include recommendations. Do NOT return any text outside the JSON object. Keep the output concise — this is a summary report.',
  2000
),
(
  (select id from public.health_checks where slug = 'professional-financial-health-check'),
  'detailed',
  'You are a senior strategic advisor for Deni Sawa Partners. The user has completed a Professional Financial Health Check. Return ONLY a valid Lexical EditorState JSON object. Use HeadingNode H1 for the report title, HeadingNode H2 for each section, HeadingNode H3 for sub-findings, ParagraphNode for analysis, ListNode (bullet) for detailed findings, QuoteNode for the top 3 priority areas covering debt, cashflow and resilience. End with an H2 section titled Recommendations containing ListNode items for each actionable recommendation. Be thorough and direct. Do NOT return any text outside the JSON object.',
  4000
)
on conflict (health_check_id, report_type) do nothing;

-- ── Rate limit config ───────────────────────────────────────────────────────
insert into public.health_check_rate_limit_config
  (health_check_id, monthly_limit_per_ip, monthly_limit_per_email, monthly_limit_per_whatsapp)
select id, 5, 5, 5 from public.health_checks
on conflict (health_check_id) do nothing;

-- ── Email templates ─────────────────────────────────────────────────────────
insert into public.email_templates
  (template_key, name, subject, preview_text, body_lexical, body_html, available_variables)
values
(
  'health_check_report_summary',
  'Health Check — Summary Report Delivery',
  'Your {{check_name}} summary report is ready',
  'Your diagnostic summary from Deni Sawa Partners',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Your {{check_name}} summary report is ready. Click below to view your results.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>Your {{check_name}} summary report is ready. <a href="{{report_url}}">View your report</a></p>',
  array['recipient_name','check_name','report_url','report_type']
),
(
  'health_check_report_detailed',
  'Health Check — Full Report Delivery',
  'Your {{check_name}} full report is ready',
  'Your detailed diagnostic report from Deni Sawa Partners',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>Your full <strong>{{check_name}}</strong> report is ready. <a href="{{report_url}}">Access your report</a></p>',
  array['recipient_name','check_name','report_url','report_type']
),
(
  'health_check_started',
  'Health Check — Started Confirmation',
  'You have started your {{check_name}}',
  'Save this link to return to your assessment',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>You have started your {{check_name}}. <a href="{{resume_url}}">Resume your assessment</a></p>',
  array['recipient_name','check_name','resume_url']
)
on conflict (template_key) do nothing;

-- ── WhatsApp templates ──────────────────────────────────────────────────────
insert into public.whatsapp_templates
  (template_key, name, body_text, available_variables, approval_status)
values
(
  'health_check_report_summary',
  'Health Check Summary Report',
  'Hello {{recipient_name}}, your {{check_name}} summary report from Deni Sawa Partners is ready. View it here: {{report_url}}',
  array['recipient_name','check_name','report_url'],
  'draft'
),
(
  'health_check_report_detailed',
  'Health Check Full Report',
  'Hello {{recipient_name}}, your full {{check_name}} report from Deni Sawa Partners is ready. Access it here: {{report_url}}. This is your confidential diagnostic report.',
  array['recipient_name','check_name','report_url'],
  'draft'
),
(
  'health_check_started',
  'Health Check Started',
  'Hello {{recipient_name}}, you have started your {{check_name}} with Deni Sawa Partners. Resume here: {{resume_url}}',
  array['recipient_name','check_name','resume_url'],
  'draft'
)
on conflict (template_key) do nothing;

-- ── Comments ────────────────────────────────────────────────────────────────
comment on table public.health_checks is 'Top-level health check catalogue entries.';
comment on table public.health_check_sessions is 'A started health check session with delivery preferences.';
comment on table public.health_check_reports is 'Generated Lexical-state reports keyed to a session and report_type.';
comment on table public.email_templates is 'Branded email templates edited with Lexical; body_html is the rendered cache.';
comment on table public.whatsapp_templates is 'WhatsApp Business message templates requiring approval before activation.';

commit;
 
-- ============================================ 
-- MIGRATION: 20260815000002_admin_team_policies.sql 
-- ============================================ 
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
 
-- ============================================ 
-- MIGRATION: 20260815000003_storage_bucket_quota.sql 
-- ============================================ 
-- Deni Sawa — Storage bucket: remove the 10 MB per-file cap.
-- The bucket now allows files up to the project's storage plan quota (Supabase
-- direct uploads are still bounded by the platform's per-request upload limit).
-- Run after 20260815000002_admin_team_policies.sql.

begin;

update storage.buckets
set file_size_limit = null
where id = 'deni_sawa';

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000001_business_financial_health_check.sql 
-- ============================================ 
-- ────────────────────────────────────────────────────────────────────────────
-- Deni Sawa Partners — Business Financial Health Check™
-- Replaces the previous Business Health Check question bank with the full
-- 10-section, 44-question assessment (profile, cash flow & debt, operations &
-- sustainability, business sustainability, marketing & growth, technology & AI,
-- resilience, founder wellbeing, open reflection, report selection).
--
-- Run the ENTIRE file as a single transaction (Supabase SQL Editor).
-- ────────────────────────────────────────────────────────────────────────────

begin;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Update the catalog entry + delete the OLD business check content
--    (sections cascade to subsections → questions → options).
-- ════════════════════════════════════════════════════════════════════════════
update public.health_checks
set name               = 'Business Financial Health Check™',
    description        = 'For Entrepreneurs, Founders, SMEs and Business Owners. This assessment is confidential and helps establish your business baseline across finance, marketing, technology and sustainability.' || E'\n\n' ||
                         'By submitting this form, I consent to Deni Sawa Partners collecting and using my information for assessment, mentorship, and support purposes. My information will be treated confidentially and used in accordance with applicable data protection requirements.',
    estimated_minutes  = 20,
    tags               = array['Finance','Marketing','Technology','Sustainability','Resilience'],
    updated_at         = now()
where slug = 'business-health-check';

delete from public.health_check_sections
where health_check_id = (select id from public.health_checks where slug = 'business-health-check');

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Rebuild sections → subsections → questions → options.
--    Sections have a fixed sort_order (sec_ord) which the question rows reuse
--    to attach each question to the right subsection. Options map back to their
--    question by unique question_text.
-- ════════════════════════════════════════════════════════════════════════════
with chk as (
  select id from public.health_checks where slug = 'business-health-check'
),
sec as (
  insert into public.health_check_sections (health_check_id, title, sort_order)
  select chk.id, s.title, s.ord
  from chk,
  (values
    ('Your Business Profile',                1),
    ('Section A: Cash Flow & Debt',          2),
    ('Section B: Operations & Sustainability', 3),
    ('Business Sustainability',              4),
    ('Section C: Marketing & Customer Growth', 5),
    ('Section D: Technology, AI & Digital Tools', 6),
    ('Section E: Resilience & Emergency Readiness', 7),
    ('Section F: Founder Wellbeing',         8),
    ('Open Reflection',                      9),
    ('Report Selection',                    10)
  ) as s(title, ord)
  returning id, sort_order, title
),
sub as (
  insert into public.health_check_subsections (section_id, heading, sort_order)
  select sec.id, sec.title, 1
  from sec
  returning id, section_id
),
sec_map as (
  select sec.sort_order, sec.id as section_id, sub.id as subsection_id
  from sec
  join sub on sub.section_id = sec.id
),
q as (
  insert into public.health_check_questions
    (subsection_id, question_text, question_type, is_required, helper_text, sort_order)
  select sm.subsection_id, qq.text, qq.qtype, qq.required, qq.helper::text, qq.ord
  from sec_map sm
  join (values
    -- ── Section 1: Your Business Profile ────────────────────────────────
    (1,  1, 'Your full name', 'paragraph', true,  null),
    (1,  2, 'Business name', 'paragraph', true,  null),
    (1,  3, 'Email address', 'paragraph', true,  null),
    (1,  4, 'WhatsApp number', 'paragraph', false, null),
    (1,  5, 'How would you describe your business?', 'single_select', true, null),
    (1,  6, 'What industry are you in?', 'paragraph', false, null),
    (1,  7, 'How long has your business been operating?', 'single_select', true, null),
    (1,  8, 'Approximate monthly business revenue (KES)?', 'single_select', true, null),
    -- ── Section 2: Cash Flow & Debt ─────────────────────────────────────
    (2,  1, 'How would you describe your business revenue over the last 3 months?', 'single_select', true, null),
    (2,  2, 'At the end of most months, your business cash position is:', 'single_select', true, null),
    (2,  3, 'Does your business currently have outstanding loans or credit obligations?', 'single_select', true, null),
    (2,  4, 'How much of your monthly revenue goes to debt repayments?', 'single_select', true, null),
    (2,  5, 'Rate the overall health of your business cash flow right now.', 'single_select', true, '1 = Critical · 5 = Strong'),
    -- ── Section 3: Operations & Sustainability ──────────────────────────
    (3,  1, 'How dependent is the business on you personally to function day-to-day?', 'single_select', true, null),
    (3,  2, 'Are you able to pay staff (if any) and suppliers on time?', 'single_select', true, null),
    (3,  3, 'Does your business have any of the following? (Select all that apply)', 'multi_select', true, null),
    -- ── Section 4: Business Sustainability ──────────────────────────────
    (4,  1, 'How would you describe your current customer base?', 'single_select', true, null),
    (4,  2, 'Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'single_select', true, null),
    (4,  3, 'How conscious is your business about environmental and social impact?', 'single_select', true, null),
    (4,  4, 'What sustainability practices does your business currently have? (Select all that apply)', 'multi_select', true, null),
    (4,  5, 'Rate how sustainable and resilient your current business model feels right now.', 'single_select', true, '1 = Collapsing · 5 = Built to last'),
    -- ── Section 5: Marketing & Customer Growth ──────────────────────────
    (5,  1, 'How do most of your new customers find you?', 'single_select', true, null),
    (5,  2, 'Does your business have a defined marketing strategy or plan?', 'single_select', true, null),
    (5,  3, 'Which marketing channels does your business actively use? (Select all that apply)', 'multi_select', true, null),
    (5,  4, 'Do you have a system to follow up with leads or past customers?', 'single_select', true, null),
    (5,  5, 'Can you clearly articulate what makes your business different from competitors?', 'single_select', true, null),
    (5,  6, 'Rate the effectiveness of your current marketing and customer growth efforts.', 'single_select', true, '1 = Non-existent · 5 = Strong'),
    -- ── Section 6: Technology, AI & Digital Tools ───────────────────────
    (6,  1, 'How would you describe your business''s overall use of digital technology?', 'single_select', true, null),
    (6,  2, 'Which of these digital tools does your business currently use? (Select all that apply)', 'multi_select', true, null),
    (6,  3, 'Does your business have a professional online presence? (Select all that apply)', 'multi_select', true, null),
    (6,  4, 'Are you currently using any AI-powered tools in your business?', 'single_select', true, null),
    (6,  5, 'Which AI or automation tools have you used or are open to using? (Select all that apply)', 'multi_select', true, null),
    (6,  6, 'What is the main barrier to using more technology in your business?', 'single_select', true, null),
    (6,  7, 'Rate how digitally equipped and future-ready your business is right now.', 'single_select', true, '1 = Not at all · 5 = Future-ready'),
    -- ── Section 7: Resilience & Emergency Readiness ─────────────────────
    (7,  1, 'If your business had zero revenue for 30 days, could it survive?', 'single_select', true, null),
    (7,  2, 'Has your business experienced a significant financial shock in the last 12 months?', 'single_select', true, null),
    (7,  3, 'Rate your business''s overall resilience to disruption right now.', 'single_select', true, '1 = Very fragile · 5 = Very resilient'),
    -- ── Section 8: Founder Wellbeing ────────────────────────────────────
    (8,  1, 'How are you personally coping with the pressures of running this business?', 'single_select', true, null),
    (8,  2, 'Is business stress affecting your personal life (family, health, relationships)?', 'single_select', true, null),
    (8,  3, 'Rate your personal motivation and clarity about the way forward for your business.', 'single_select', true, '1 = Lost / hopeless · 5 = Clear & driven'),
    -- ── Section 9: Open Reflection ──────────────────────────────────────
    (9,  1, 'What is the single most urgent challenge your business faces right now?', 'paragraph', false, null),
    (9,  2, 'What kind of support would be most valuable to you at this stage? (Select all that apply)', 'multi_select', true, null),
    (9,  3, 'Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'single_select', true, null),
    -- ── Section 10: Report Selection ────────────────────────────────────
    (10, 1, 'Please select your preferred option:', 'single_select', true, 'Choose the report or programme you would like.')
  ) as qq(sec_ord, ord, text, qtype, required, helper)
    on qq.sec_ord = sm.sort_order
  returning id, question_text
)
insert into public.health_check_question_options (question_id, option_text, sort_order)
select q.id, o.text, o.ord
from q
join (values
  -- Q5
  ('How would you describe your business?', 'Sole trader / One-person business', 1),
  ('How would you describe your business?', 'Startup (less than 2 years old)', 2),
  ('How would you describe your business?', 'Small business (2-10 employees)', 3),
  ('How would you describe your business?', 'Social enterprise / NGO', 4),
  ('How would you describe your business?', 'Medium business (11-50 employees)', 5),
  ('How would you describe your business?', 'Other', 6),
  -- Q7
  ('How long has your business been operating?', 'Less than 1 year', 1),
  ('How long has your business been operating?', '1-2 years', 2),
  ('How long has your business been operating?', '3-5 years', 3),
  ('How long has your business been operating?', '6-10 years', 4),
  ('How long has your business been operating?', 'Over 10 years', 5),
  -- Q8
  ('Approximate monthly business revenue (KES)?', 'Below 50,000', 1),
  ('Approximate monthly business revenue (KES)?', '50,000-200,000', 2),
  ('Approximate monthly business revenue (KES)?', '200,001-500,000', 3),
  ('Approximate monthly business revenue (KES)?', '500,001-1,000,000', 4),
  ('Approximate monthly business revenue (KES)?', 'Above 1,000,000', 5),
  ('Approximate monthly business revenue (KES)?', 'Revenue is irregular / hard to estimate', 6),
  -- Q9
  ('How would you describe your business revenue over the last 3 months?', 'Growing consistently', 1),
  ('How would you describe your business revenue over the last 3 months?', 'Stable but flat', 2),
  ('How would you describe your business revenue over the last 3 months?', 'Declining', 3),
  ('How would you describe your business revenue over the last 3 months?', 'Very unpredictable - up and down', 4),
  ('How would you describe your business revenue over the last 3 months?', 'We have barely been making sales', 5),
  -- Q10
  ('At the end of most months, your business cash position is:', 'In surplus - we have money left over', 1),
  ('At the end of most months, your business cash position is:', 'Break-even - revenue just covers costs', 2),
  ('At the end of most months, your business cash position is:', 'In deficit - costs regularly exceed revenue', 3),
  ('At the end of most months, your business cash position is:', 'We rely on credit or loans to stay operational', 4),
  -- Q11
  ('Does your business currently have outstanding loans or credit obligations?', 'No debt at all', 1),
  ('Does your business currently have outstanding loans or credit obligations?', 'Yes - manageable, payments are up to date', 2),
  ('Does your business currently have outstanding loans or credit obligations?', 'Yes - struggling to keep up with repayments', 3),
  ('Does your business currently have outstanding loans or credit obligations?', 'Yes - in arrears or defaulting on some obligations', 4),
  -- Q12
  ('How much of your monthly revenue goes to debt repayments?', 'Nothing - no debt', 1),
  ('How much of your monthly revenue goes to debt repayments?', 'Less than 20%', 2),
  ('How much of your monthly revenue goes to debt repayments?', '20-40%', 3),
  ('How much of your monthly revenue goes to debt repayments?', '41-60%', 4),
  ('How much of your monthly revenue goes to debt repayments?', 'Over 60% - it is suffocating the business', 5),
  -- Q13
  ('Rate the overall health of your business cash flow right now.', '1', 1),
  ('Rate the overall health of your business cash flow right now.', '2', 2),
  ('Rate the overall health of your business cash flow right now.', '3', 3),
  ('Rate the overall health of your business cash flow right now.', '4', 4),
  ('Rate the overall health of your business cash flow right now.', '5', 5),
  -- Q14
  ('How dependent is the business on you personally to function day-to-day?', 'Fully dependent - it stops when I stop', 1),
  ('How dependent is the business on you personally to function day-to-day?', 'Mostly dependent - I handle most things', 2),
  ('How dependent is the business on you personally to function day-to-day?', 'Somewhat - key roles are shared', 3),
  ('How dependent is the business on you personally to function day-to-day?', 'Mostly independent - strong team and systems in place', 4),
  -- Q15
  ('Are you able to pay staff (if any) and suppliers on time?', 'Yes - always on time', 1),
  ('Are you able to pay staff (if any) and suppliers on time?', 'Usually - with occasional delays', 2),
  ('Are you able to pay staff (if any) and suppliers on time?', 'Often delayed - it causes tension', 3),
  ('Are you able to pay staff (if any) and suppliers on time?', 'No - we are behind on payroll or supplier payments', 4),
  ('Are you able to pay staff (if any) and suppliers on time?', 'No employees or suppliers', 5),
  -- Q16
  ('Does your business have any of the following? (Select all that apply)', 'Separate business bank account', 1),
  ('Does your business have any of the following? (Select all that apply)', 'Business insurance', 2),
  ('Does your business have any of the following? (Select all that apply)', 'Basic bookkeeping or accounting records', 3),
  ('Does your business have any of the following? (Select all that apply)', 'A written business plan or strategy', 4),
  ('Does your business have any of the following? (Select all that apply)', 'A defined pricing structure', 5),
  ('Does your business have any of the following? (Select all that apply)', 'Written contracts with clients or suppliers', 6),
  ('Does your business have any of the following? (Select all that apply)', 'None of the above', 7),
  -- Q17
  ('How would you describe your current customer base?', 'One or two major clients - very concentrated risk', 1),
  ('How would you describe your current customer base?', 'A few regular clients with occasional new ones', 2),
  ('How would you describe your current customer base?', 'A healthy mix of loyal and new customers', 3),
  ('How would you describe your current customer base?', 'Largely transactional - we chase new customers constantly', 4),
  -- Q18
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'Yes - a significant portion of revenue is recurring', 1),
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'Yes - but it is a small portion', 2),
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'No - most revenue is once-off or project-based', 3),
  ('Does your business generate any recurring revenue (retainers, subscriptions, repeat orders)?', 'Not yet, but I am working towards it', 4),
  -- Q19
  ('How conscious is your business about environmental and social impact?', 'We actively measure and reduce our environmental footprint', 1),
  ('How conscious is your business about environmental and social impact?', 'We are aware but have not yet taken formal steps', 2),
  ('How conscious is your business about environmental and social impact?', 'It is not currently a focus', 3),
  ('How conscious is your business about environmental and social impact?', 'We are interested but do not know where to start', 4),
  -- Q20
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Waste reduction or recycling practices', 1),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Community investment or social programmes', 2),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Ethical sourcing or supplier standards', 3),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Energy efficiency measures', 4),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'Fair employment and staff welfare policies', 5),
  ('What sustainability practices does your business currently have? (Select all that apply)', 'None currently', 6),
  -- Q21
  ('Rate how sustainable and resilient your current business model feels right now.', '1', 1),
  ('Rate how sustainable and resilient your current business model feels right now.', '2', 2),
  ('Rate how sustainable and resilient your current business model feels right now.', '3', 3),
  ('Rate how sustainable and resilient your current business model feels right now.', '4', 4),
  ('Rate how sustainable and resilient your current business model feels right now.', '5', 5),
  -- Q22
  ('How do most of your new customers find you?', 'Word of mouth / referrals', 1),
  ('How do most of your new customers find you?', 'Networking and events', 2),
  ('How do most of your new customers find you?', 'Social media (organic)', 3),
  ('How do most of your new customers find you?', 'Walk-in / physical presence', 4),
  ('How do most of your new customers find you?', 'Paid advertising (online or offline)', 5),
  ('How do most of your new customers find you?', 'We do not have a clear customer acquisition channel', 6),
  -- Q23
  ('Does your business have a defined marketing strategy or plan?', 'Yes - written, active and working', 1),
  ('Does your business have a defined marketing strategy or plan?', 'Yes - but it is not consistently followed', 2),
  ('Does your business have a defined marketing strategy or plan?', 'Informal - we market reactively when needed', 3),
  ('Does your business have a defined marketing strategy or plan?', 'No marketing strategy at all', 4),
  -- Q24
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Facebook / Instagram', 1),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Email marketing', 2),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'WhatsApp Business', 3),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'SMS / bulk messaging', 4),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'LinkedIn', 5),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Radio / TV / print advertising', 6),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'TikTok', 7),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Flyers and physical marketing', 8),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'Google My Business / SEO', 9),
  ('Which marketing channels does your business actively use? (Select all that apply)', 'None currently active', 10),
  -- Q25
  ('Do you have a system to follow up with leads or past customers?', 'Yes - automated or structured follow-up process', 1),
  ('Do you have a system to follow up with leads or past customers?', 'Yes - but it is manual and inconsistent', 2),
  ('Do you have a system to follow up with leads or past customers?', 'Occasionally - when we remember', 3),
  ('Do you have a system to follow up with leads or past customers?', 'No - we do not follow up', 4),
  -- Q26
  ('Can you clearly articulate what makes your business different from competitors?', 'Yes - our value proposition is clear and compelling', 1),
  ('Can you clearly articulate what makes your business different from competitors?', 'Somewhat - we have a sense of it but struggle to communicate it', 2),
  ('Can you clearly articulate what makes your business different from competitors?', 'Not really - we compete mostly on price', 3),
  ('Can you clearly articulate what makes your business different from competitors?', 'No - we have not defined our differentiation', 4),
  -- Q27
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '1', 1),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '2', 2),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '3', 3),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '4', 4),
  ('Rate the effectiveness of your current marketing and customer growth efforts.', '5', 5),
  -- Q28
  ('How would you describe your business''s overall use of digital technology?', 'Advanced - we rely heavily on digital tools and systems', 1),
  ('How would you describe your business''s overall use of digital technology?', 'Moderate - we use some digital tools but not consistently', 2),
  ('How would you describe your business''s overall use of digital technology?', 'Basic - we use mainly phones and WhatsApp', 3),
  ('How would you describe your business''s overall use of digital technology?', 'Minimal - most operations are manual or paper-based', 4),
  -- Q29
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Accounting / bookkeeping software', 1),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Payroll software', 2),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Point of Sale (POS) system', 3),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Google Workspace or Microsoft 365', 4),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Customer Relationship Management (CRM) tool', 5),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'E-commerce platform or online store', 6),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Project or task management tool', 7),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Payment platforms (M-Pesa, Stripe, Pesalink etc.)', 8),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'Inventory management software', 9),
  ('Which of these digital tools does your business currently use? (Select all that apply)', 'None of the above', 10),
  -- Q30
  ('Does your business have a professional online presence? (Select all that apply)', 'Website', 1),
  ('Does your business have a professional online presence? (Select all that apply)', 'LinkedIn company page', 2),
  ('Does your business have a professional online presence? (Select all that apply)', 'Active Facebook or Instagram business page', 3),
  ('Does your business have a professional online presence? (Select all that apply)', 'Online shop or marketplace listing', 4),
  ('Does your business have a professional online presence? (Select all that apply)', 'Google My Business listing', 5),
  ('Does your business have a professional online presence? (Select all that apply)', 'None - we rely on WhatsApp and word of mouth', 6),
  -- Q31
  ('Are you currently using any AI-powered tools in your business?', 'Yes - regularly across multiple areas', 1),
  ('Are you currently using any AI-powered tools in your business?', 'Yes - occasionally for one or two tasks', 2),
  ('Are you currently using any AI-powered tools in your business?', 'I have tried a few but not consistently', 3),
  ('Are you currently using any AI-powered tools in your business?', 'No - I have not used AI tools yet', 4),
  ('Are you currently using any AI-powered tools in your business?', 'I am not sure what AI tools are available', 5),
  -- Q32
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'ChatGPT, Claude or Gemini', 1),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI for accounting or financial reporting', 2),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI image or design tools', 3),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI-assisted market research', 4),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI-powered customer service or chatbots', 5),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'AI translation or language tools', 6),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'Automated email or social media scheduling', 7),
  ('Which AI or automation tools have you used or are open to using? (Select all that apply)', 'None - I am not yet using AI tools', 8),
  -- Q33
  ('What is the main barrier to using more technology in your business?', 'Cost - tools are too expensive', 1),
  ('What is the main barrier to using more technology in your business?', 'Skills - I do not know how to use them', 2),
  ('What is the main barrier to using more technology in your business?', 'Time - I do not have time to learn', 3),
  ('What is the main barrier to using more technology in your business?', 'Awareness - I am not sure what tools are available', 4),
  ('What is the main barrier to using more technology in your business?', 'No barrier - I am already using technology effectively', 5),
  -- Q34
  ('Rate how digitally equipped and future-ready your business is right now.', '1', 1),
  ('Rate how digitally equipped and future-ready your business is right now.', '2', 2),
  ('Rate how digitally equipped and future-ready your business is right now.', '3', 3),
  ('Rate how digitally equipped and future-ready your business is right now.', '4', 4),
  ('Rate how digitally equipped and future-ready your business is right now.', '5', 5),
  -- Q35
  ('If your business had zero revenue for 30 days, could it survive?', 'Yes - we have reserves to cover over 60 days', 1),
  ('If your business had zero revenue for 30 days, could it survive?', 'Maybe - we would survive 30 days with difficulty', 2),
  ('If your business had zero revenue for 30 days, could it survive?', 'Unlikely - we would need to borrow within 2 weeks', 3),
  ('If your business had zero revenue for 30 days, could it survive?', 'No - we would collapse within days', 4),
  -- Q36
  ('Has your business experienced a significant financial shock in the last 12 months?', 'No', 1),
  ('Has your business experienced a significant financial shock in the last 12 months?', 'Yes - minor, we recovered quickly', 2),
  ('Has your business experienced a significant financial shock in the last 12 months?', 'Yes - significant, we are still recovering', 3),
  ('Has your business experienced a significant financial shock in the last 12 months?', 'Yes - severe, it is the reason we are here', 4),
  -- Q37
  ('Rate your business''s overall resilience to disruption right now.', '1', 1),
  ('Rate your business''s overall resilience to disruption right now.', '2', 2),
  ('Rate your business''s overall resilience to disruption right now.', '3', 3),
  ('Rate your business''s overall resilience to disruption right now.', '4', 4),
  ('Rate your business''s overall resilience to disruption right now.', '5', 5),
  -- Q38
  ('How are you personally coping with the pressures of running this business?', 'Well - I feel in control and clear-headed', 1),
  ('How are you personally coping with the pressures of running this business?', 'Managing - some stress but I am holding it together', 2),
  ('How are you personally coping with the pressures of running this business?', 'Struggling - the pressure is affecting me significantly', 3),
  ('How are you personally coping with the pressures of running this business?', 'Overwhelmed - I feel burnt out or close to giving up', 4),
  -- Q39
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Not really', 1),
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Slightly', 2),
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Noticeably', 3),
  ('Is business stress affecting your personal life (family, health, relationships)?', 'Significantly', 4),
  -- Q40
  ('Rate your personal motivation and clarity about the way forward for your business.', '1', 1),
  ('Rate your personal motivation and clarity about the way forward for your business.', '2', 2),
  ('Rate your personal motivation and clarity about the way forward for your business.', '3', 3),
  ('Rate your personal motivation and clarity about the way forward for your business.', '4', 4),
  ('Rate your personal motivation and clarity about the way forward for your business.', '5', 5),
  -- Q42
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Cash flow restructuring', 1),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Access to funding or credit', 2),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Debt negotiation or rescheduling', 3),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Cost reduction plan', 4),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Marketing strategy and customer growth', 5),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Financial management training', 6),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Digital tools setup and training', 7),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Sustainability planning', 8),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'AI tools for my business', 9),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Just having someone to talk to who understands', 10),
  ('What kind of support would be most valuable to you at this stage? (Select all that apply)', 'Business recovery roadmap', 11),
  -- Q43
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'Yes - WhatsApp preferred', 1),
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'Yes - phone call preferred', 2),
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'Yes - email preferred', 3),
  ('Would you like an advisor to contact you and share the Business Financial Health Check Analysis Report?', 'No - I will reach out when ready', 4),
  -- Q44
  ('Please select your preferred option:', 'FREE Summary Report', 1),
  ('Please select your preferred option:', 'Detailed Business Analysis Report – KES 2,500', 2),
  ('Please select your preferred option:', 'Detailed Analysis Report + 1-Hour Business Clarity Call – KES 5,000', 3),
  ('Please select your preferred option:', 'Join the Deni Sawa Business Mentorship Program', 4),
  ('Please select your preferred option:', 'None of the Above', 5)
) as o(qtext, text, ord)
  on o.qtext = q.question_text;

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000002_report_failed_template.sql 
-- ============================================ 
-- Deni Sawa — Report-failed notification templates.
-- Sent to a user when their health check report could not be generated, so the
-- admin can then regenerate it from the admin console.
-- Run after 20260816000001_business_financial_health_check.sql.

begin;

insert into public.email_templates
  (template_key, name, subject, preview_text, body_lexical, body_html, available_variables)
values
(
  'health_check_report_failed',
  'Health Check — Report Generation Failed',
  'We could not generate your {{check_name}} report',
  'We are sorry — your diagnostic report could not be generated.',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"We are sorry — we could not generate your {{check_name}} report. Our team has been notified and will assist you shortly. For immediate help, reply to this email or contact us at advisory@denisawa.co.ke.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>We are sorry — we could not generate your <strong>{{check_name}}</strong> report. Our team has been notified and will assist you shortly. For immediate help, reply to this email or contact us at advisory@denisawa.co.ke.</p>',
  array['recipient_name','check_name']
)
on conflict (template_key) do nothing;

insert into public.whatsapp_templates
  (template_key, name, body_text, available_variables, approval_status)
values
(
  'health_check_report_failed',
  'Health Check Report Failed',
  'Hello {{recipient_name}}, we could not generate your {{check_name}} report. Our team has been notified and will help you shortly.',
  array['recipient_name','check_name'],
  'draft'
)
on conflict (template_key) do nothing;

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000003_max_tokens.sql 
-- ============================================ 
-- Deni Sawa — Allow report prompt max_tokens up to 200,000 (Claude's context
-- window). Run after 20260816000002_report_failed_template.sql.

begin;

alter table public.health_check_report_prompts
  drop constraint if exists health_check_report_prompts_max_tokens_check;

alter table public.health_check_report_prompts
  add constraint health_check_report_prompts_max_tokens_check
  check (max_tokens between 500 and 200000);

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000004_report_provider.sql 
-- ============================================ 
-- Deni Sawa — Allow choosing the report-generation provider (Anthropic or
-- Google Gemini) per prompt, and keep models free-text so newly released
-- models can be used without code changes. Run after 20260816000003_max_tokens.sql.

begin;

alter table public.health_check_report_prompts
  add column if not exists provider text not null default 'anthropic'
  check (provider in ('anthropic', 'google'));

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000005_admin_password_reset.sql 
-- ============================================ 
-- Deni Sawa — Admin password reset support.
-- Lets super admins/team members reset a forgotten password from the login
-- screen. Run after 20260815000001_create_health_check_system.sql.

begin;

alter table public.admin_users
  add column if not exists reset_token text,
  add column if not exists reset_token_expires_at timestamptz;

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000006_health_check_image.sql 
-- ============================================ 
-- Deni Sawa — Health check cover image.
-- Lets each health check have a cover image selected from Supabase storage,
-- shown on the public intro page. Run after 20260815000001_create_health_check_system.sql.

begin;

alter table public.health_checks
  add column if not exists image_url text;

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000007_report_generation_error.sql 
-- ============================================ 
-- Deni Sawa — Record AI generation failures on health check reports.
-- Lets the admin/report viewer distinguish a real AI report from the
-- deterministic fallback (which was previously indistinguishable, and the
-- stored model_used even mislabeled it as the configured model).

begin;

alter table public.health_check_reports
  add column if not exists generation_error text;

commit;
 
-- ============================================ 
-- MIGRATION: 20260816000008_report_header_footer.sql 
-- ============================================ 
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
 
-- ============================================ 
-- MIGRATION: 20260816000009_report_selection_payments.sql 
-- ============================================ 
-- Deni Sawa — Report selection, pricing and M-Pesa payments.
-- Lets each health check set prices for the paid Detailed report and the
-- Detailed + Advisory Call report, and tracks the user's chosen report type
-- plus payment status on each session.

begin;

alter table public.health_checks
  add column if not exists detailed_price numeric(10, 2) not null default 0,
  add column if not exists detailed_call_price numeric(10, 2) not null default 0;

alter table public.health_check_sessions
  add column if not exists report_selection text not null default 'summary'
    check (report_selection in ('summary', 'detailed', 'detailed_call')),
  add column if not exists payment_status text not null default 'none'
    check (payment_status in ('none', 'pending', 'paid', 'failed')),
  add column if not exists payment_amount numeric(10, 2),
  add column if not exists payment_reference text,
  add column if not exists requires_call boolean not null default false,
  add column if not exists admin_notified boolean not null default false;

commit;
 
-- ============================================ 
-- MIGRATION: 20260817000001_report_provider_openrouter.sql 
-- ============================================ 
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
-- ============================================ 
-- MIGRATION: 20260817000002_blog_content_lexical.sql 
-- ============================================ 
-- Deni Sawa — Persist the Lexical editor state for blog posts so the server can
-- always regenerate canonical content_html with the current converter, making
-- image size/layout and other rich-editor output stable across deploys.

begin;

alter table public.blog_posts
  add column if not exists content_lexical jsonb;

commit;
 
-- ============================================ 
-- MIGRATION: 20260817000003_blog_comments.sql 
-- ============================================ 
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
 
-- ============================================ 
-- MIGRATION: 20260817000004_blog_comments_anon_fix.sql 
-- ============================================ 
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
-- ============================================ 
-- MIGRATION: 20260818000001_report_editing.sql 
-- ============================================ 
-- Admin report editing: track who last edited a report body and when.
alter table public.health_check_reports
  add column if not exists edited_by  uuid references public.admin_users(id) on delete set null,
  add column if not exists edited_at  timestamptz;
 
-- ============================================ 
-- MIGRATION: 20260818000002_ui_fix_copy.sql 
-- ============================================ 
-- System-wide UI copy fixes: remove AI-referencing brand language from
-- live health check descriptions (see system-wide-ui-fix.md).
-- Migrations are additive; these UPDATEs refresh already-seeded rows.

update public.health_checks
set description = 'A structured assessment of your business across Financial Health, Operations, Governance, Cashflow and Growth Readiness. Your responses are analysed and a structured report is prepared, which our advisors use as the foundation for your first conversation.'
where name = 'Business Health Check';

update public.health_checks
set description = 'A structured assessment of your personal financial position across income, debt, cashflow, savings, resilience and future security.'
where name = 'Professional Financial Health Check'; 
-- ============================================ 
-- MIGRATION: 20260819000001_health_check_consent.sql 
-- ============================================ 
-- Health Check consent: privacy/terms agreement + communications consent.
-- Adds an audit trail (who agreed, when, which version, from which IP) to every
-- health_check_sessions row. Run after 20260815000001_create_health_check_system.sql.
alter table public.health_check_sessions
  add column if not exists terms_agreed boolean not null default false,
  add column if not exists terms_agreed_at timestamptz,
  -- Which version of the Privacy Policy / Terms of Use was agreed to (e.g. '2026-08').
  -- Bump TERMS_VERSION whenever the documents are materially changed so historical
  -- records show exactly what each user consented to.
  add column if not exists terms_version text,
  add column if not exists comms_consent boolean not null default false,
  add column if not exists comms_consent_at timestamptz,
  add column if not exists consent_ip inet;

comment on column public.health_check_sessions.terms_agreed is 'User confirmed they accept the Privacy Policy and Terms of Use.';
comment on column public.health_check_sessions.terms_agreed_at is 'Timestamp when the user agreed to the Privacy Policy and Terms of Use.';
comment on column public.health_check_sessions.terms_version is 'Version of the Privacy Policy / Terms of Use agreed to (e.g. 2026-08).';
comment on column public.health_check_sessions.comms_consent is 'User consented to receive their report via their chosen channel(s).';
comment on column public.health_check_sessions.comms_consent_at is 'Timestamp when communications consent was given.';
comment on column public.health_check_sessions.consent_ip is 'IP address at the time of consent, for the compliance audit trail.'; 
-- ============================================ 
-- MIGRATION: 20260820000001_whatsapp_meta_template_fields.sql 
-- ============================================ 
-- ────────────────────────────────────────────────────────────────────────────
-- WhatsApp Meta Cloud API enhancements.
--   whatsapp_templates: Meta requires a template category (MARKETING/UTILITY/
--     AUTHENTICATION) and a language code. The language is used at send time
--     and the category is carried for future template submission.
--   whatsapp_config: stores the webhook verify token used to respond to
--     Meta's GET hub.challenge verification handshake.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.whatsapp_templates
  add column if not exists category text,
  add column if not exists language text not null default 'en';

alter table public.whatsapp_config
  add column if not exists webhook_verify_token text;

-- Webhook-driven delivery tracking columns.
alter table public.whatsapp_log
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz; 
-- ============================================ 
-- MIGRATION: 20260820000002_academy_course_images.sql 
-- ============================================ 
-- ────────────────────────────────────────────────────────────────────────────
-- Academy course cover images.
--   image_url stores a Supabase storage public URL for the course card artwork.
--   Mirrors blog_posts.cover_image_url.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.lms_courses
  add column if not exists image_url text;

-- ── Seed: learning pathways (public /learning pages) ────────────────────────
-- Defaults powering the public Learning page; slugs match the static
-- /learning/[slug] detail pages so cards link straight through.
insert into public.lms_courses (title, slug, category, format, duration, level, description, image_url, is_featured, is_active, sort_order)
values
  ('Business Recovery', 'business-recovery', 'Business', 'Learning Pathway', '6 weeks', 'All Levels',
   'Rebuild and restructure under pressure — stabilising cash, creditors, operations and stakeholder confidence.', '/images/recovery.jpg', true, true, 50),
  ('Governance', 'governance', 'Business', 'Learning Pathway', '6 weeks', 'All Levels',
   'Boards, policies and accountability — the discipline that protects value between and beyond meetings.', '/images/governance.jpg', true, true, 60),
  ('Financial Resilience', 'financial-resilience', 'Business', 'Learning Pathway', '6 weeks', 'All Levels',
   'Buffers, systems and sustainable performance — so the next shock is absorbed, not absorbed by you.', '/images/resilience.jpg', true, true, 70)
on conflict (slug) do nothing;