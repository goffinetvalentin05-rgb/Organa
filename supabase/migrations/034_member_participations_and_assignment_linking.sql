-- ============================================
-- MIGRATION 034 : Participations membre + rattachement inscriptions publiques
-- ============================================
-- 1) Assouplir la contrainte source : public_signup peut avoir client_id (membre lié)
-- 2) member_link_status sur planning_assignments
-- 3) Table member_participations (un enregistrement par membre et par planning)
-- 4) RLS alignée sur le club du planning
-- ============================================

-- 1) Contrainte source / client_id
ALTER TABLE public.planning_assignments
  DROP CONSTRAINT IF EXISTS planning_assignments_source_consistency;

ALTER TABLE public.planning_assignments
  ADD CONSTRAINT planning_assignments_source_consistency
  CHECK (
    (source = 'internal_member' AND client_id IS NOT NULL)
    OR
    (
      source = 'public_signup'
      AND public_name IS NOT NULL
      AND length(trim(public_name)) > 0
    )
  );

-- 2) Statut de liaison (inscriptions publiques)
ALTER TABLE public.planning_assignments
  ADD COLUMN IF NOT EXISTS member_link_status TEXT;

ALTER TABLE public.planning_assignments
  DROP CONSTRAINT IF EXISTS planning_assignments_member_link_status_check;

ALTER TABLE public.planning_assignments
  ADD CONSTRAINT planning_assignments_member_link_status_check
  CHECK (
    member_link_status IS NULL
    OR member_link_status IN ('linked', 'unlinked', 'pending_review')
  );

COMMENT ON COLUMN public.planning_assignments.member_link_status IS
  'Inscription publique : linked = membre club identifié, unlinked = aucune correspondance sûre, pending_review = ambiguïté. NULL pour internal_member.';

-- Données existantes : inscriptions publiques sans membre = non lié
UPDATE public.planning_assignments
SET member_link_status = 'unlinked'
WHERE source = 'public_signup'
  AND client_id IS NULL
  AND member_link_status IS NULL;

-- 3) Participations (fiche membre / historique par planning)
CREATE TABLE IF NOT EXISTS public.member_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  planning_id UUID NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT member_participations_planning_client UNIQUE (planning_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_member_participations_client_id
  ON public.member_participations(client_id);

CREATE INDEX IF NOT EXISTS idx_member_participations_planning_id
  ON public.member_participations(planning_id);

COMMENT ON TABLE public.member_participations IS
  'Présence d''un membre (clients) sur un planning ; une ligne par couple (planning, membre), alimentée par les affectations liées.';

ALTER TABLE public.member_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_participations_select_staff" ON public.member_participations;
CREATE POLICY "member_participations_select_staff"
  ON public.member_participations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.plannings p
      WHERE p.id = member_participations.planning_id
        AND public.is_club_staff(p.user_id)
    )
  );

DROP POLICY IF EXISTS "member_participations_insert_staff" ON public.member_participations;
CREATE POLICY "member_participations_insert_staff"
  ON public.member_participations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.plannings p
      WHERE p.id = member_participations.planning_id
        AND public.is_club_staff(p.user_id)
    )
    AND EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = member_participations.client_id
        AND c.user_id = (
          SELECT p2.user_id FROM public.plannings p2 WHERE p2.id = member_participations.planning_id
        )
    )
  );

DROP POLICY IF EXISTS "member_participations_update_staff" ON public.member_participations;
CREATE POLICY "member_participations_update_staff"
  ON public.member_participations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.plannings p
      WHERE p.id = member_participations.planning_id
        AND public.is_club_staff(p.user_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.plannings p
      WHERE p.id = member_participations.planning_id
        AND public.is_club_staff(p.user_id)
    )
  );

DROP POLICY IF EXISTS "member_participations_delete_staff" ON public.member_participations;
CREATE POLICY "member_participations_delete_staff"
  ON public.member_participations FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.plannings p
      WHERE p.id = member_participations.planning_id
        AND public.is_club_staff(p.user_id)
    )
  );

SELECT 'Migration 034 member_participations_and_assignment_linking OK' AS status;
