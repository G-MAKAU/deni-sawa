-- 20260821000001_report_validity_and_feature_gating.sql
-- Adds expires_at column to health_check_reports for feature gating.
-- Summary reports expire after 30 days; detailed reports after 12 months.
-- Set explicitly on insert in generate-report.ts (avoids immutability issue with generated columns).

ALTER TABLE public.health_check_reports
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
