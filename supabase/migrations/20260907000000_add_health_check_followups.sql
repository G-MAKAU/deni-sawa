-- Track follow-up reminder emails sent for incomplete health check sessions.
-- Each row = one email sent. The cron job checks this to avoid duplicates.
CREATE TABLE health_check_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES health_check_sessions(id) ON DELETE CASCADE,
  email_number int NOT NULL CHECK (email_number BETWEEN 1 AND 4),
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_followups_session ON health_check_followups(session_id);
CREATE UNIQUE INDEX idx_followups_session_email ON health_check_followups(session_id, email_number);

ALTER TABLE health_check_followups ENABLE ROW LEVEL SECURITY;

-- Admin read
CREATE POLICY "hcf_admin_r" ON health_check_followups
  FOR SELECT TO authenticated
  USING (is_blog_admin());

-- Service role full access (cron + API)
CREATE POLICY "hcf_svc" ON health_check_followups
  TO service_role
  USING (true) WITH CHECK (true);
