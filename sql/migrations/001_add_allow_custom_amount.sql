-- Migration: Add allow_custom_amount to services table
-- Run this on your cPanel MySQL database
-- When enabled, customers can enter their own amount (price = minimum)

ALTER TABLE services
  ADD COLUMN allow_custom_amount TINYINT(1) DEFAULT 0
  AFTER is_active;

-- Optional: enable custom amount on all existing services (uncomment if needed)
-- UPDATE services SET allow_custom_amount = 1;
