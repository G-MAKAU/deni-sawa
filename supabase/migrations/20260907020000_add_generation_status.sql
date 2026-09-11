-- Add generation_status to track background report generation.
-- 'pending'  = not yet generated
-- 'generating' = AI call in progress (background)
-- 'completed' = generation finished (success or fallback)
-- 'failed'   = generation failed
ALTER TABLE health_check_reports
  ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'completed';

-- Backfill existing rows as completed.
UPDATE health_check_reports SET generation_status = 'completed' WHERE generation_status IS NULL;

-- Add index for polling queries.
CREATE INDEX IF NOT EXISTS idx_health_check_reports_generation_status
  ON health_check_reports (id, generation_status);
