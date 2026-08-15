-- Deni Sawa — Report-failed notification templates.
-- Sent to a user when their health check report could not be generated, so the
-- admin can then regenerate it from the admin console.
-- Run after 20260816000001_business_financial_health_check.sql.

begin;

insert into public.email_templates
  (template_key, name, subject, preview_text, body_lexical, body_html, available_variables)
values
(
  'health_check_report_failed',
  'Health Check — Report Generation Failed',
  'We could not generate your {{check_name}} report',
  'We are sorry — your diagnostic report could not be generated.',
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hello {{recipient_name}},","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"We are sorry — we could not generate your {{check_name}} report. Our team has been notified and will assist you shortly. For immediate help, reply to this email or contact us at advisory@denisawa.co.ke.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
  '<p>Hello {{recipient_name}},</p><p>We are sorry — we could not generate your <strong>{{check_name}}</strong> report. Our team has been notified and will assist you shortly. For immediate help, reply to this email or contact us at advisory@denisawa.co.ke.</p>',
  array['recipient_name','check_name']
)
on conflict (template_key) do nothing;

insert into public.whatsapp_templates
  (template_key, name, body_text, available_variables, approval_status)
values
(
  'health_check_report_failed',
  'Health Check Report Failed',
  'Hello {{recipient_name}}, we could not generate your {{check_name}} report. Our team has been notified and will help you shortly.',
  array['recipient_name','check_name'],
  'draft'
)
on conflict (template_key) do nothing;

commit;
