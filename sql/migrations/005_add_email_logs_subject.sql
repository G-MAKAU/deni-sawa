-- Migration 005: Add subject column to email_logs
-- Run this on cPanel phpMyAdmin

ALTER TABLE email_logs
  ADD COLUMN subject VARCHAR(255) NULL AFTER email_type;

-- Expand email_type enum to include new types
ALTER TABLE email_logs
  MODIFY COLUMN email_type ENUM('payment_confirmation','booking_confirmation','booking_date_prompt','booking_cancellation') NOT NULL;
