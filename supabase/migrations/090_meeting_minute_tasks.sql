-- ============================================
-- MIGRATION 090 : Tâches opérationnelles des PV
-- Source de vérité unique (liées au PV, pas de copie parallèle)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.meeting_minute_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_minutes_id UUID NOT NULL REFERENCES public.meeting_minutes(id) ON DELETE CASCADE,
  point_index INTEGER NOT NULL DEFAULT 0,
  point_title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  responsible_name TEXT NOT NULL DEFAULT '',
  responsible_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_minute_tasks_club_active
  ON public.meeting_minute_tasks (club_id, is_active, deadline);

CREATE INDEX IF NOT EXISTS idx_meeting_minute_tasks_pv
  ON public.meeting_minute_tasks (meeting_minutes_id);

DROP TRIGGER IF EXISTS update_meeting_minute_tasks_updated_at ON public.meeting_minute_tasks;
CREATE TRIGGER update_meeting_minute_tasks_updated_at
  BEFORE UPDATE ON public.meeting_minute_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.meeting_minute_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meeting_minute_tasks_select_member ON public.meeting_minute_tasks;
CREATE POLICY meeting_minute_tasks_select_member
  ON public.meeting_minute_tasks FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS meeting_minute_tasks_insert_staff ON public.meeting_minute_tasks;
CREATE POLICY meeting_minute_tasks_insert_staff
  ON public.meeting_minute_tasks FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS meeting_minute_tasks_update_staff ON public.meeting_minute_tasks;
CREATE POLICY meeting_minute_tasks_update_staff
  ON public.meeting_minute_tasks FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS meeting_minute_tasks_delete_staff ON public.meeting_minute_tasks;
CREATE POLICY meeting_minute_tasks_delete_staff
  ON public.meeting_minute_tasks FOR DELETE
  USING (public.is_club_staff(club_id));

SELECT 'Migration 090_meeting_minute_tasks terminée' AS status;
