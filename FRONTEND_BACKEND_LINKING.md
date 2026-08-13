# Deni Sawa — Frontend ⇄ Backend Linking Guide

This document explains how the Next.js frontend connects to the Supabase backend for the
Blog, Academy, admin CMS and consultation bookings. It is the "linking contract" between
the two worlds.

---

## 1. Architecture at a glance

```
┌───────────────────────────── Next.js (deni-sawa-next) ─────────────────────────────┐
│                                                                                     │
│  Public pages (server components)              Admin CMS (client)                    │
│  /blog, /blog/[slug], /academy, /contact       /admin/blog                          │
│        │                                              │                             │
│        ▼                                              ▼                             │
│  lib/supabase/queries.ts                    components/admin/BlogCMSClient.tsx      │
│  (cached, tag = "blog"/"academy")            (Supabase browser auth + fetch API)    │
│        │                                              │                             │
│        ▼                                              ▼                             │
│  getSupabaseClient() (anon/publishable)     /api/admin/me → /api/admin/blog/*      │
│        │                                        │         (bearer JWT)               │
│        ▼                                        ▼         ▼                          │
└──── Supabase REST + PostgREST ◄──────── user-scoped client (RLS applies)  ──────────┘
        │
        ▼
   Supabase project (hgchuyomcusqjcemakpi.supabase.co)
   - Postgres schema (migration 20260813000001_create_blog_academy_cms.sql)
   - Row-level security   - storage bucket `deni_sawa`   - seed data
```

Two read paths, one source of truth:

1. **Public reads** — anonymous/publishable key, only `published` rows are visible (RLS).
2. **Admin writes** — a signed-in staff member's JWT is passed to `/api/admin/*`, which
   validates it and runs queries through a **user-scoped Supabase client** so RLS governs
   writes too. There is no service-role key in the frontend.

---

## 2. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://hgchuyomcusqjcemakpi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=            # optional, legacy
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_f3tW6PUmqZrNJpiw_TJHiQ_gSt4N263
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=  # optional fallback
```

Resolution order used everywhere (clients + `/api/book`):
`NEXT_PUBLIC_SUPABASE_ANON_KEY ?? NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.

- `NEXT_PUBLIC_SUPABASE_URL` + the publishable key are the *minimum* required.
- The **service_role key must never** be added to the frontend build.

---

## 3. Database schema (source of truth)

Migration file: `supabase/migrations/20260813000001_create_blog_academy_cms.sql`

### Tables

| Table | Purpose | Public RLS | Admin RLS |
|---|---|---|---|
| `blog_authors` | Author profiles (name, slug, bio, avatar) | read active | all for `is_blog_admin()` |
| `blog_categories` | Categories (name, slug, description) | read active | all for `is_blog_admin()` |
| `blog_posts` | Posts with `content_markdown` + sanitized `content_html`, status, SEO fields | read `published` & `published_at <= now()` | all for `is_blog_admin()` |
| `lms_courses` | Academy course catalogue | read active | all for `is_blog_admin()` |
| `admin_users` | Staff identity & roles (`super_admin`/`admin`/`manager`/`support`) | — | read own only; service_role all |
| `consultation_bookings` | Booking submissions (used by `/api/book`) | anon insert allowed | — |

### Key design decisions

- **`content_markdown` is the authoring source; `content_html` is the sanitized render
  target.** The Lexical editor writes HTML; the DB keeps both so raw markdown survives
  future migration.
- **Auto-derived fields** (trigger `blog_posts_derive_fields`): slug is generated from
  the title, `reading_minutes` from word count (~220 wpm), `published_at` set on publish.
- **Max 2 featured posts** enforced by trigger `enforce_max_featured_blog_posts`.
- **Status enum**: `draft → review → scheduled → published → archived`, with CHECK
  constraints tying `published_at` / `scheduled_for`.
- **`v_public_blog_posts`** view with `security_invoker = true` exposes published posts
  with denormalized author/category names — but the public queries read the base table so
  they are not limited by the view (the view exists for analytics/reporting convenience).

### How to apply

1. Open the Supabase project at `https://hgchuyomcusqjcemakpi.supabase.co` → **SQL Editor**.
2. Paste the whole migration and run it. It is idempotent (`create ... if not exists`,
   `on conflict do nothing`), so re-running is safe.
3. Seed data inserts 4 categories, 2 authors, 4 published posts and 4 academy courses.

---

## 4. Row-level security & the admin gate

The heart of the linking contract is `public.is_blog_admin()`:

```sql
select exists (
  select 1 from public.admin_users
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and is_active = true
);
```

- Security-definer, search_path locked to `public`, revoked from `public` and granted only
  to `authenticated`.
- Every admin table policy uses it, so **only staff listed in `admin_users` can write**
  blog content — anonymous users and signed-in non-staff get nothing.

### Admin sign-in flow

1. `BlogCMSClient` signs in with Supabase Auth (`signInWithPassword`) using the browser client.
2. It calls `GET /api/admin/me` with `Authorization: Bearer <access_token>`.
3. `requireBlogAdmin()` in `src/app/api/admin/_auth.ts`:
   - verifies the JWT via `supabase.auth.getUser(token)`,
   - looks up the user in `admin_users` (by email, active only),
   - returns `{ user, client, role }` where `client` is a **user-scoped Supabase client**
     created with `global: { headers: { Authorization: Bearer <token> } }`.
4. API routes run all queries through that client → PostgREST enforces RLS using the
   caller's JWT claims (the `is_blog_admin()` check).
5. Role permissions: `support` can read/create/update but **not delete**; `admin` and above
   can delete. Enforcement lives in `_auth.ts` via `user.role`.

> No service-role key, no insecure `using (true)` for authenticated users — this is a
> hardening improvement over the original Horizon Spire reference.

### Adding a staff member

```sql
insert into public.admin_users (full_name, email, role, is_active)
values ('Jane Doe', 'jane@denisawa.co.ke', 'admin', true);
```

Then create/confirm that email in Supabase **Authentication → Users**. Done — they can
sign in at `/admin/blog`.

---

## 5. Frontend data access (public pages)

`src/lib/supabase/queries.ts` exports cached, typed queries:

- `getBlogPosts({ limit, category })` — published, newest first
- `getBlogPostBySlug(slug)` — single published post (+ author + category)
- `getBlogCategories()` — active categories
- `getLmsCourses()` — active academy courses

All are wrapped in `unstable_cache` with tags `blog` / `academy` and use
`getSupabaseClient()` (server-side, no session persistence).

```ts
export const getBlogPosts = cacheFunction(
  async (opts) => { ... },
  { tags: ['blog'], revalidate: 300 }
);
```

- Revalidated on a timer (default 300 s). To force a refresh after an admin edit, call
  `revalidateTag('blog')` server-side or use the Next.js revalidation endpoints.
- Pages are **server components** that render the sanitized `content_html` via
  `BlogContentRenderer` with `dangerouslySetInnerHTML`.
- **Graceful degradation**: if the Supabase tables do not exist yet, queries return empty
  lists / `null` and the pages render friendly empty states instead of crashing the build.

---

## 6. Admin API routes

All under `src/app/api/admin/` and gated by `requireBlogAdmin`:

| Route | Methods | Notes |
|---|---|---|
| `/api/admin/me` | GET | Returns current admin identity + role |
| `/api/admin/blog/posts` | GET, POST | List posts (with author/category) or create |
| `/api/admin/blog/posts/[id]` | PUT, DELETE | Update or delete (delete requires role ≠ `support`) |
| `/api/admin/blog/authors` | GET | Active authors for the editor select |
| `/api/admin/blog/categories` | GET | Active categories for the editor select |

Shared plumbing: `src/lib/supabase/client.ts` (server client), `src/app/api/admin/_auth.ts`
(guard). Every route maps the camelCase UI payload to snake_case columns, so the schema
names above stay the single source of truth.

---

## 7. Lexical editor → sanitized HTML pipeline

1. **Write** — the admin composes in `src/components/admin/LexicalEditor.tsx` (a
   lightweight Lexical-style editor built on `contentEditable` + `document.execCommand`,
   ported from Horizon Spire's backend). On every change it emits HTML.
2. **Paste sanitization** — `src/lib/sanitizePastedHtml.ts` cleans pasted content in the
   browser before it enters the editor.
3. **Server sanitization** — before writing to the DB, `normalizeBlogHtml` +
   `sanitize-html` strip unsafe markup. See `src/lib/normalizeBlogHtml.ts`.
4. **Render** — public pages render `content_html` (server-sanitized) through
   `BlogContentRenderer`, which applies styles defined in `BlogContentRenderer.module.css`
   (headings, lists, blockquotes, tables, code, images, links).
5. **Metadata** — `seo_title`, `seo_description`, `seo_keywords` are emitted in the page
   `<head>` via Next.js `Metadata`; `reading_minutes`, `cover_image_url`, author/category
   drive the post template.

### Image uploads

- `BlogPostEditor` passes `onUploadImage` to `LexicalEditor`.
- `BlogCMSClient` uploads the file to Supabase Storage bucket **`deni_sawa`** under
  `blog/<timestamp>-<random>-<name>` using the signed-in user's session (RLS allows
  authenticated uploads) and returns the public URL, which the editor inserts as an image.

---

## 8. Storage bucket

- Bucket: `deni_sawa` (public, 10 MB limit, image/pdf mime types).
- Policies: anon read; authenticated all; service_role all.
- Public URLs come back as `https://hgchuyomcusqjcemakpi.supabase.co/storage/v1/object/public/deni_sawa/blog/...`.

---

## 9. Consultation bookings

- The `/contact` page form and the AI chat widget both `POST /api/book`.
- `/api/book` validates input, inserts a row into `consultation_bookings` (RLS allows
  anonymous insert), and always returns a receipt with WhatsApp + email hand-off links —
  even if the insert fails (best-effort persistence).

---

## 10. Caching & revalidation summary

| Resource | Query | Cache tag | Revalidate |
|---|---|---|---|
| Blog list | `getBlogPosts` | `blog` | 300 s |
| Blog post | `getBlogPostBySlug` | `blog` | 300 s |
| Categories | `getBlogCategories` | `blog` | 300 s |
| Academy courses | `getLmsCourses` | `academy` | 300 s |

After publishing/editing in the CMS, trigger a refresh with:
`revalidateTag('blog')` (server-side) — this keeps the public site in sync.

---

## 11. Checklist after deploying to a fresh environment

1. Run the migration (section 3).
2. Add staff to `admin_users` + create their Supabase Auth user (section 4).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. `npm run build` — public pages degrade gracefully if data is missing.
5. Verify `/blog`, `/blog/[slug]`, `/academy`, `/contact`, and `/admin/blog`.
