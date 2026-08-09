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
