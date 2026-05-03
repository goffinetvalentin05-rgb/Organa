-- ============================================
-- MIGRATION 035 : Suivi des participations (événements / plannings)
-- ============================================
-- Table member_participations enrichie : club_id, member_id, event_title, event_date,
-- status (registered / present / absent / cancelled), created_by, updated_at.
-- Annulation d'inscription → status = cancelled (pas de DELETE applicatif).
-- RLS filtrée par club_id (is_club_staff).
-- ============================================

-- 1) Création initiale si la table n'existe pas (ex. 034 jamais appliquée)
DO $$
BEGIN
  IF to_regclass('public.member_participations') IS NULL THEN
    CREATE TABLE public.member_participations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      member_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      planning_id UUID NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
      event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
      event_title TEXT NOT NULL,
      event_date DATE,
      status TEXT NOT NULL DEFAULT 'registered',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT member_participations_status_check
        CHECK (status IN ('registered', 'present', 'absent', 'cancelled')),
      CONSTRAINT member_participations_planning_member UNIQUE (planning_id, member_id)
    );

    CREATE INDEX idx_member_participations_club_member
      ON public.member_participations(club_id, member_id);
    CREATE INDEX idx_member_participations_member_id
      ON public.member_participations(member_id);
    CREATE INDEX idx_member_participations_planning_id
      ON public.member_participations(planning_id);
    CREATE INDEX idx_member_participations_club_event_date
      ON public.member_participations(club_id, event_date)
      WHERE status IS DISTINCT FROM 'cancelled';

    RAISE NOTICE '✓ Table member_participations créée (035)';
  END IF;
END $$;

-- 2) Mise à jour depuis le schéma minimal (migration 034)
DO $$
BEGIN
  IF to_regclass('public.member_participations') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'client_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'member_id'
  ) THEN
    ALTER TABLE public.member_participations RENAME COLUMN client_id TO member_id;
    RAISE NOTICE '✓ Colonne client_id renommée en member_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'club_id'
  ) THEN
    ALTER TABLE public.member_participations
      ADD COLUMN club_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'event_title'
  ) THEN
    ALTER TABLE public.member_participations ADD COLUMN event_title TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE public.member_participations ADD COLUMN event_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.member_participations
      ADD COLUMN status TEXT NOT NULL DEFAULT 'registered';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.member_participations
      ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'member_participations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.member_participations
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Contraintes / unicité (idempotent)
ALTER TABLE public.member_participations
  DROP CONSTRAINT IF EXISTS member_participations_planning_client;

ALTER TABLE public.member_participations
  DROP CONSTRAINT IF EXISTS member_participations_planning_member;

ALTER TABLE public.member_participations
  DROP CONSTRAINT IF EXISTS member_participations_status_check;

ALTER TABLE public.member_participations
  ADD CONSTRAINT member_participations_status_check
  CHECK (status IN ('registered', 'present', 'absent', 'cancelled'));

ALTER TABLE public.member_participations
  ADD CONSTRAINT member_participations_planning_member UNIQUE (planning_id, member_id);

-- Backfill depuis plannings + clients
UPDATE public.member_participations mp
SET
  club_id = p.user_id,
  event_title = COALESCE(NULLIF(trim(mp.event_title), ''), NULLIF(trim(p.name), ''), 'Planning'),
  event_date = COALESCE(mp.event_date, p.date::date),
  event_id = COALESCE(mp.event_id, p.event_id),
  updated_at = COALESCE(mp.updated_at, mp.created_at, NOW())
FROM public.plannings p
WHERE p.id = mp.planning_id
  AND (
    mp.club_id IS NULL
    OR mp.event_title IS NULL
    OR trim(COALESCE(mp.event_title, '')) = ''
    OR mp.event_date IS NULL
  );

UPDATE public.member_participations
SET event_title = 'Planning'
WHERE event_title IS NULL OR trim(event_title) = '';

UPDATE public.member_participations
SET updated_at = created_at
WHERE updated_at < created_at;

ALTER TABLE public.member_participations ALTER COLUMN club_id SET NOT NULL;
ALTER TABLE public.member_participations ALTER COLUMN event_title SET NOT NULL;

-- Index (hors bloc DO pour IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_member_participations_club_member
  ON public.member_participations(club_id, member_id);
CREATE INDEX IF NOT EXISTS idx_member_participations_member_id
  ON public.member_participations(member_id);
CREATE INDEX IF NOT EXISTS idx_member_participations_planning_id
  ON public.member_participations(planning_id);
CREATE INDEX IF NOT EXISTS idx_member_participations_club_event_date
  ON public.member_participations(club_id, event_date)
  WHERE status IS DISTINCT FROM 'cancelled';

DROP INDEX IF EXISTS public.idx_member_participations_client_id;

COMMENT ON TABLE public.member_participations IS
  'Participation d''un membre (clients) à un planning ; conservée à l''annulation (status cancelled).';

COMMENT ON COLUMN public.member_participations.event_title IS
  'Titre affiché (synchronisé si le planning est modifié).';

COMMENT ON COLUMN public.member_participations.event_date IS
  'Date de référence pour tris et futures agrégations (saison, année, cotisation).';

-- RLS
ALTER TABLE public.member_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_participations_select_staff" ON public.member_participations;
DROP POLICY IF EXISTS "member_participations_insert_staff" ON public.member_participations;
DROP POLICY IF EXISTS "member_participations_update_staff" ON public.member_participations;
DROP POLICY IF EXISTS "member_participations_delete_staff" ON public.member_participations;

CREATE POLICY "member_participations_select_staff"
  ON public.member_participations FOR SELECT
  USING (public.is_club_staff(club_id));

CREATE POLICY "member_participations_insert_staff"
  ON public.member_participations FOR INSERT
  WITH CHECK (
    public.is_club_staff(club_id)
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = member_id AND c.user_id = club_id AND c.deleted_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM public.plannings p
      WHERE p.id = planning_id AND p.user_id = club_id AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "member_participations_update_staff"
  ON public.member_participations FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (
    public.is_club_staff(club_id)
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = member_id AND c.user_id = club_id
    )
  );

SELECT 'Migration 035 member_participations_tracking OK' AS status;
