-- ============================================
-- Denisawa Booking System - Database Schema
-- Compatible: Local MySQL + cPanel MySQL
-- ============================================

CREATE DATABASE IF NOT EXISTS denisawa_booking;
USE denisawa_booking;

-- Services table: prices managed here, not hardcoded in frontend
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(255),
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INT DEFAULT 60,
  is_active TINYINT(1) DEFAULT 1,
  allow_custom_amount TINYINT(1) DEFAULT 0 COMMENT 'If 1, price is the minimum; customers can pay more',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table: core booking record
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(36) NOT NULL UNIQUE,  -- UUID
  service_id INT NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending_payment','paid','booked','cancelled') DEFAULT 'pending_payment',
  booked_date DATE NULL,
  booked_time TIME NULL,
  google_event_id VARCHAR(255) NULL,
  meet_link VARCHAR(500) NULL,
  payment_confirmed_at TIMESTAMP NULL,
  booking_confirmed_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- Payments table: M-Pesa transaction records
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(36) NOT NULL,
  mpesa_checkout_id VARCHAR(100) NULL,       -- CheckoutRequestID from STK push
  mpesa_merchant_request_id VARCHAR(100) NULL,
  mpesa_receipt VARCHAR(50) NULL,            -- MpesaReceiptNumber from callback
  phone_number VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('initiated','success','failed','cancelled') DEFAULT 'initiated',
  raw_callback JSON NULL,                    -- Store full M-Pesa callback
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_reference) REFERENCES bookings(reference)
);

-- Email logs: track all sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(36) NOT NULL,
  email_type ENUM('payment_confirmation','booking_confirmation','booking_date_prompt','booking_cancellation') NOT NULL,
  subject VARCHAR(255) NULL,
  recipient_email VARCHAR(150) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent','failed') DEFAULT 'sent',
  error_message TEXT NULL
);

-- Holidays: DB-managed public holidays
-- Recurring holidays (is_recurring=1) stored once — matched by month+day every year.
-- Moveable holidays (Easter, Eid) stored per-year with is_recurring=0.
CREATE TABLE IF NOT EXISTS holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  holiday_date DATE NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_recurring TINYINT(1) DEFAULT 0 COMMENT 'If 1, matches every year on same month+day',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_holiday_date (holiday_date),
  INDEX idx_recurring (is_recurring)
);

-- Blocked dates: admin-managed office closures / unavailable dates
CREATE TABLE IF NOT EXISTS blocked_dates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blocked_date DATE NOT NULL UNIQUE,
  reason VARCHAR(255) NULL,
  created_by VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Seed: Sample Services
-- ============================================
INSERT INTO services (name, slug, description, short_description, price, duration_minutes) VALUES
(
  'Business Consultation',
  'business-consultation',
  'A comprehensive one-on-one session covering business strategy, market positioning, financial planning, and growth roadmaps tailored to your specific industry and goals.',
  'Strategic session covering growth, finance & market positioning.',
  5000.00,
  90
),
(
  'Legal Advisory',
  'legal-advisory',
  'Expert legal guidance on contracts, business registration, compliance, intellectual property, and dispute resolution from a qualified Kenyan legal professional.',
  'Legal guidance on contracts, compliance & business law.',
  8000.00,
  60
),
(
  'Financial Planning',
  'financial-planning',
  'Personalised financial review including investment analysis, savings strategies, retirement planning, and tax optimisation for individuals and SMEs.',
  'Investment, savings & tax planning for individuals and SMEs.',
  6500.00,
  75
),
(
  'Website Design & Development',
  'web-development',
  'Custom website design and development tailored to your brand. Includes responsive design, SEO setup, and one month of post-launch support.',
  'Custom responsive websites with SEO and post-launch support.',
  15000.00,
  120
),
(
  'Brand Identity Design',
  'brand-identity',
  'Full brand identity package including logo design, colour palette, typography selection, business card design, and a brand guideline document.',
  'Logo, palette, typography and full brand guidelines.',
  12000.00,
  90
);

-- ============================================
-- Seed: Kenyan Public Holidays
-- Recurring: stored once (matched by month+day every year)
-- Moveable (Easter/Eid): per-year entries
-- ============================================
INSERT INTO holidays (holiday_date, name, is_recurring) VALUES
-- Recurring (every year, same month+day)
('2025-01-01', 'New Year''s Day', 1),
('2025-04-25', 'Labour Day', 1),
('2025-06-01', 'Madaraka Day', 1),
('2025-10-10', 'Moi Day', 1),
('2025-10-20', 'Mashujaa Day', 1),
('2025-12-12', 'Jamhuri Day', 1),
('2025-12-25', 'Christmas Day', 1),
('2025-12-26', 'Boxing Day', 1),
-- Moveable 2025 (Easter, Eid — different each year)
('2025-04-18', 'Good Friday', 0),
('2025-04-21', 'Easter Monday', 0),
('2025-03-31', 'Eid al-Fitr', 0),
('2025-06-07', 'Eid al-Adha', 0),
-- Moveable 2026
('2026-04-03', 'Good Friday', 0),
('2026-04-06', 'Easter Monday', 0),
('2026-03-20', 'Eid al-Fitr', 0),
('2026-05-27', 'Eid al-Adha', 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);
