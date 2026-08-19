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