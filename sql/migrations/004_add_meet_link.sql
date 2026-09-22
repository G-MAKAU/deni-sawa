-- Add meet_link column to bookings table for Google Meet integration
ALTER TABLE bookings ADD COLUMN meet_link VARCHAR(500) NULL AFTER google_event_id;
