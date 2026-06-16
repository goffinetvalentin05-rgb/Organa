-- ============================================
-- MIGRATION 053 : Points structurés pour les PV
-- ============================================

ALTER TABLE public.meeting_minutes
  ADD COLUMN IF NOT EXISTS points JSONB NOT NULL DEFAULT '[]'::jsonb;

SELECT 'Migration 053_meeting_minutes_points terminée' AS status;
