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