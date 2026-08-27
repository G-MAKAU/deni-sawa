-- Deni Sawa — Runtime settings: DB-managed configuration (AI keys/models, etc.)
-- lets operators change keys without redeploying (no Vercel env changes).
-- Secrets are AES-256-GCM encrypted before storage (see src/lib/crypto.ts);
-- the decrypt key (CREDENTIALS_ENCRYPTION_KEY) stays in the environment.
-- RLS: no anon policies — only the service-role client (server-side) can read/write.

begin;

create table if not exists public.app_settings (
  key         text primary key,
  value       text not null,
  is_secret   boolean not null default true,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

alter table public.app_settings enable row level security;

-- No policies: the anon role has zero access. All reads/writes happen
-- server-side via the service-role client, which bypasses RLS.

comment on table public.app_settings is
  'Runtime configuration overrides. Server-side only; encrypted secrets; no anon access.';
comment on column public.app_settings.is_secret is
  'When true, value holds an AES-256-GCM encrypted envelope (iv:tag:ciphertext).';

commit;