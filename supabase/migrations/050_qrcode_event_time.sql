-- Migration: Add optional event time to QR codes
-- Keeps event_date (DATE) for backward compatibility; event_time is nullable.

ALTER TABLE qrcodes
  ADD COLUMN IF NOT EXISTS event_time TIME;

COMMENT ON COLUMN qrcodes.event_time IS 'Optional local time of the event (HH:MM:SS), paired with event_date';
