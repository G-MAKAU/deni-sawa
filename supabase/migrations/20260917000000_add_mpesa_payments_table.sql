-- ============================================================
-- M-Pesa payments transaction log + receipt tracking
-- ============================================================

-- 1. Dedicated payments table — one row per STK push / callback.
CREATE TABLE IF NOT EXISTS mpesa_payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       uuid NOT NULL REFERENCES health_check_sessions(id) ON DELETE CASCADE,
  checkout_request_id text,            -- Safaricom's CheckoutRequestID (STK push ref)
  mpesa_receipt    text,              -- MpesaReceiptNumber (what the user sees in SMS)
  phone_number     text,              -- normalised phone (254…)
  amount           numeric(10,2) NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','success','failed','timeout')),
  result_code      text,              -- Safaricom ResultCode
  result_desc      text,              -- Safaricom ResultDesc
  raw_callback     jsonb,             -- full callback payload for audit
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for lookups by receipt number, phone, and session.
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_receipt ON mpesa_payments(mpesa_receipt);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_phone   ON mpesa_payments(phone_number);
CREATE INDEX IF NOT EXISTS idx_mpesa_payments_session ON mpesa_payments(session_id);

-- 2. RLS — admin full access, service role bypasses.
ALTER TABLE mpesa_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view mpesa payments"
  ON mpesa_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service role can insert mpesa payments"
  ON mpesa_payments FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update mpesa payments"
  ON mpesa_payments FOR UPDATE
  TO service_role
  USING (true);

-- 3. Add mpesa_receipt column to health_check_sessions for quick reference.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_check_sessions' AND column_name = 'mpesa_receipt'
  ) THEN
    ALTER TABLE health_check_sessions ADD COLUMN mpesa_receipt text;
  END IF;
END $$;

-- 4. Updated_at trigger for mpesa_payments.
CREATE OR REPLACE FUNCTION update_mpesa_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mpesa_payments_updated_at ON mpesa_payments;
CREATE TRIGGER mpesa_payments_updated_at
  BEFORE UPDATE ON mpesa_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_mpesa_payments_updated_at();
