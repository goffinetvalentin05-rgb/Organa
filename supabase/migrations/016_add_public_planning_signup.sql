-- ============================================
-- MIGRATION : Inscription publique aux plannings
-- ============================================
-- Cette migration ajoute :
-- 1) Table des liens publics de planning
-- 2) Colonnes pour bénévoles publics sur planning_assignments
-- 3) Policies RLS pour les admins de club
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Table public_planning_links
CREATE TABLE IF NOT EXISTS public.public_planning_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_id UUID NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  require_name BOOLEAN NOT NULL DEFAULT TRUE,
  require_email BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(planning_id)
);

CREATE INDEX IF NOT EXISTS idx_public_planning_links_planning_id
  ON public.public_planning_links(planning_id);

CREATE INDEX IF NOT EXISTS idx_public_planning_links_club_id
  ON public.public_planning_links(club_id);

CREATE INDEX IF NOT EXISTS idx_public_planning_links_active
  ON public.public_planning_links(active);

-- 2) Extension de planning_assignments pour les bénévoles publics
ALTER TABLE public.planning_assignments
  ALTER COLUMN client_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'planning_assignments'
      AND column_name = 'public_name'
  ) THEN
    ALTER TABLE public.planning_assignments
      ADD COLUMN public_name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'planning_assignments'
      AND column_name = 'public_email'
  ) THEN
    ALTER TABLE public.planning_assignments
      ADD COLUMN public_email TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'planning_assignments'
      AND column_name = 'public_phone'
  ) THEN
    ALTER TABLE public.planning_assignments
      ADD COLUMN public_phone TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'planning_assignments'
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.planning_assignments
      ADD COLUMN source TEXT NOT NULL DEFAULT 'internal_member'
      CHECK (source IN ('internal_member', 'public_signup'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_planning_assignments_source
  ON public.planning_assignments(source);

CREATE INDEX IF NOT EXISTS idx_planning_assignments_public_email
  ON public.planning_assignments(public_email);

ALTER TABLE public.planning_assignments
  DROP CONSTRAINT IF EXISTS planning_assignments_source_consistency;

ALTER TABLE public.planning_assignments
  ADD CONSTRAINT planning_assignments_source_consistency
  CHECK (
    (source = 'internal_member' AND client_id IS NOT NULL)
    OR
    (source = 'public_signup' AND client_id IS NULL AND public_name IS NOT NULL AND length(trim(public_name)) > 0)
  );

-- 3) RLS pour public_planning_links
ALTER TABLE public.public_planning_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own public planning links" ON public.public_planning_links;
CREATE POLICY "Users can view their own public planning links"
  ON public.public_planning_links FOR SELECT
  USING (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can insert their own public planning links" ON public.public_planning_links;
CREATE POLICY "Users can insert their own public planning links"
  ON public.public_planning_links FOR INSERT
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can update their own public planning links" ON public.public_planning_links;
CREATE POLICY "Users can update their own public planning links"
  ON public.public_planning_links FOR UPDATE
  USING (auth.uid() = club_id)
  WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Users can delete their own public planning links" ON public.public_planning_links;
CREATE POLICY "Users can delete their own public planning links"
  ON public.public_planning_links FOR DELETE
  USING (auth.uid() = club_id);

SELECT 'Migration 016_add_public_planning_signup terminée avec succès' AS status;
