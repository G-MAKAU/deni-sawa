-- Deni Sawa — Persist the Lexical editor state for blog posts so the server can
-- always regenerate canonical content_html with the current converter, making
-- image size/layout and other rich-editor output stable across deploys.

begin;

alter table public.blog_posts
  add column if not exists content_lexical jsonb;

commit;
