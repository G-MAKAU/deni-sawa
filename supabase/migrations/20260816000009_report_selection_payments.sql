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
