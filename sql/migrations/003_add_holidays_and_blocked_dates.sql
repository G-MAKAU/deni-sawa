-- ============================================
-- Holidays & Blocked Dates for Booking System
-- ============================================

-- Holidays table: DB-managed public holidays
-- Recurring holidays stored once (is_recurring=1) — matched by month+day every year.
-- Moveable holidays (Easter, Eid) stored per-year (is_recurring=0).
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
-- Seed: Kenyan public holidays
-- Recurring: stored once with month+day
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
