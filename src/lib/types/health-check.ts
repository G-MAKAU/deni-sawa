export type QuestionType = 'paragraph' | 'single_select' | 'multi_select';

export interface HealthCheck {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  estimated_minutes: number | null;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckSection {
  id: string;
  health_check_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckSubsection {
  id: string;
  section_id: string;
  heading: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckQuestion {
  id: string;
  subsection_id: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  helper_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckOption {
  id: string;
  question_id: string;
  option_text: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HealthCheckSession {
  id: string;
  health_check_id: string;
  full_name: string;
  business_name: string | null;
  email: string | null;
  whatsapp: string | null;
  preferred_delivery: 'email' | 'whatsapp' | 'both';
  ip_address: string | null;
  user_agent: string | null;
  started_at: string;
  completed_at: string | null;
  time_taken_seconds: number | null;
  is_complete: boolean;
}

export interface HealthCheckAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_text: string | null;
  selected_option_ids: string[];
}

export interface HealthCheckReport {
  id: string;
  session_id: string;
  report_type: 'summary' | 'detailed';
  lexical_state: Record<string, unknown>;
  prompt_snapshot: string;
  model_used: string;
  tokens_used: number | null;
  generation_seconds: string | number | null;
  report_url_token: string;
  is_paid: boolean;
  delivery_status: 'pending' | 'sent' | 'failed' | 'skipped';
  accessed_at: string | null;
  created_at: string;
}

export interface ReportPrompt {
  id: string;
  health_check_id: string;
  report_type: 'summary' | 'detailed';
  system_prompt: string;
  system_prompt_lexical: Record<string, unknown> | null;
  provider: 'anthropic' | 'google';
  model: string;
  max_tokens: number;
  is_active: boolean;
  updated_by: string | null;
  version: number;
  previous_system_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  preview_text: string | null;
  body_lexical: Record<string, unknown>;
  body_html: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  is_active: boolean;
  available_variables: string[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  template_key: string;
  name: string;
  body_text: string;
  available_variables: string[];
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejection_reason: string | null;
  wa_template_id: string | null;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailLogEntry {
  id: string;
  template_key: string | null;
  to_email: string;
  to_name: string | null;
  subject: string;
  body_html: string;
  variables_used: Record<string, unknown>;
  smtp_message_id: string | null;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  error_message: string | null;
  report_id: string | null;
  session_id: string | null;
  attempts: number;
  last_attempted_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface WhatsAppLogEntry {
  id: string;
  template_key: string | null;
  to_number: string;
  to_name: string | null;
  body_sent: string;
  variables_used: Record<string, unknown>;
  provider: string;
  provider_message_id: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  error_message: string | null;
  report_id: string | null;
  session_id: string | null;
  attempts: number;
  last_attempted_at: string | null;
  sent_at: string | null;
  created_at: string;
}
