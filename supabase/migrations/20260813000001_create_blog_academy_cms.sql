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
insert into public.lms_courses (title, slug, category, format, duration, level, description, is_featured, sort_order)
values
  ('Young Adults Coaching Program', 'young-adults-coaching-program', 'Coaching', 'Workshop Series', '6 weeks', 'Beginner',
   'A coaching program designed for young adults stepping into financial independence — covering personal financial management, debt avoidance, and money mindset.', true, 10),
  ('Financial Wellness Coaching', 'financial-wellness-coaching', 'Wellness', 'Webinar', '4 sessions', 'All Levels',
   'Transform your financial situation with guided wellness coaching sessions covering budgeting, saving, and sustainable debt management.', false, 20),
  ('Debt Management & Advisory', 'debt-management-and-advisory', 'Debt Management', 'One-on-One', '12–48 weeks', 'Intermediate',
   'Structured advisory programmes that take you from debt crisis to debt-free status through professional, ethical, and sustainable solutions.', true, 30),
  ('Corporate Financial Wellness', 'corporate-financial-wellness', 'Corporate', 'On-Site Training', 'Custom', 'All Levels',
   'Organisational financial wellness training that reduces employee financial stress and builds a culture of financial health across your company.', false, 40)
on conflict (slug) do nothing;

-- ── Comments ───────────────────────────────────────────────────────────────
comment on table public.blog_posts is 'Blog posts with editorial content (markdown + sanitized HTML) and SEO metadata.';
comment on table public.lms_courses is 'Academy course catalogue powering the Academy page.';
comment on table public.admin_users is 'Staff who may sign in and manage blog content.';

commit;