-- ============================================
-- MIGRATION 052 : Procès-verbaux de séances (PV)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'other'
    CHECK (meeting_type IN ('committee', 'general_assembly', 'coaches', 'sponsoring', 'finance', 'other')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'validated', 'archived')),
  chairman TEXT,
  secretary TEXT,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  excused JSONB NOT NULL DEFAULT '[]'::jsonb,
  absent JSONB NOT NULL DEFAULT '[]'::jsonb,
  agenda_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  discussion_points TEXT NOT NULL DEFAULT '',
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  miscellaneous TEXT NOT NULL DEFAULT '',
  next_meeting TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_club_date
  ON public.meeting_minutes (club_id, meeting_date DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_minutes_club_updated
  ON public.meeting_minutes (club_id, updated_at DESC);

DROP TRIGGER IF EXISTS update_meeting_minutes_updated_at ON public.meeting_minutes;
CREATE TRIGGER update_meeting_minutes_updated_at
  BEFORE UPDATE ON public.meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meeting_minutes_select_member ON public.meeting_minutes;
CREATE POLICY meeting_minutes_select_member
  ON public.meeting_minutes FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS meeting_minutes_insert_staff ON public.meeting_minutes;
CREATE POLICY meeting_minutes_insert_staff
  ON public.meeting_minutes FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS meeting_minutes_update_staff ON public.meeting_minutes;
CREATE POLICY meeting_minutes_update_staff
  ON public.meeting_minutes FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS meeting_minutes_delete_staff ON public.meeting_minutes;
CREATE POLICY meeting_minutes_delete_staff
  ON public.meeting_minutes FOR DELETE
  USING (public.is_club_staff(club_id));

SELECT 'Migration 052_meeting_minutes terminée' AS status;
