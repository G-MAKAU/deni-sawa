-- Add is_public column to health_check_reports.
-- When false, the public token endpoint returns 403 (report is revoked).
-- Defaults to true so existing reports remain accessible.
ALTER TABLE health_check_reports
  ADD COLUMN is_public boolean NOT NULL DEFAULT true;

CREATE INDEX idx_reports_is_public ON health_check_reports(is_public);
