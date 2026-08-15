export type CheckType = 'business' | 'professional';

export type QuestionInputType = 'choice' | 'multi' | 'scale' | 'text';

export interface HealthQuestion {
  id: string;
  category: string;
  text: string;
  input_type: QuestionInputType;
  /** Options for choice/multi questions. */
  options?: string[];
  /** Scale labels for scale questions. */
  scale_labels?: { min: string; max: string };
  placeholder?: string;
  required?: boolean;
}

export interface QuestionResponse {
  question_id: string;
  question_text: string;
  category: string;
  answer: string | string[];
}

export interface HealthReport {
  report_id: string;
  check_type: CheckType;
  check_title: string;
  lexical_state: Record<string, unknown>;
  summary: string;
  created_at: string;
  email: string | null;
}

export interface ReportExportPayload {
  state: Record<string, unknown> | string;
  checkType?: CheckType;
  title?: string;
  created?: string;
}
