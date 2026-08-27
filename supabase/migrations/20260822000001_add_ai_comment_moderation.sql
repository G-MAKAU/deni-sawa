-- Deni Sawa — AI comment moderation.
-- Adds moderation metadata to blog_comments so the AI verdict at submission
-- time is stored and visible in the admin moderation UI.

begin;

alter table public.blog_comments
  add column if not exists ai_moderated boolean not null default false,
  add column if not exists moderation_verdict text check (
    moderation_verdict is null or moderation_verdict in ('approve', 'reject', 'review')
  ),
  add column if not exists moderation_reasons text[] not null default '{}',
  add column if not exists moderation_model text,
  add column if not exists moderated_at timestamptz;

comment on column public.blog_comments.ai_moderated is
  'True when the comment was classified by the configured AI provider.';
comment on column public.blog_comments.moderation_verdict is
  'AI verdict at submission: approve | reject | review (null when AI unavailable).';
comment on column public.blog_comments.moderation_reasons is
  'Short reasons given by the AI for its verdict.';

commit;