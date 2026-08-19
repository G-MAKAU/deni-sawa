-- ────────────────────────────────────────────────────────────────────────────
-- Academy course cover images.
--   image_url stores a Supabase storage public URL for the course card artwork.
--   Mirrors blog_posts.cover_image_url.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.lms_courses
  add column if not exists image_url text;