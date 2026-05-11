-- ============================================
-- MIGRATION 037 : Slugs pour liens publics plannings
-- ============================================

CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Ajout de la colonne (au départ nullable pour backfill)
ALTER TABLE public.public_planning_links
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill des anciens liens publics
DO $$
DECLARE
  r RECORD;
  planning_name TEXT;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INT := 2;
BEGIN
  FOR r IN
    SELECT id, planning_id
    FROM public.public_planning_links
    WHERE slug IS NULL OR slug = ''
    ORDER BY created_at ASC
  LOOP
    SELECT name INTO planning_name
    FROM public.plannings
    WHERE id = r.planning_id;

    base_slug := lower(coalesce(unaccent(planning_name), ''));
    -- Remplace tout groupe de caractères non alphanumérique par des tirets
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    -- Trim tirets en début/fin
    base_slug := regexp_replace(base_slug, '(^-+)|(-+$)', '', 'g');
    -- Limite longueur, puis re-trim
    base_slug := regexp_replace(substr(base_slug, 1, 48), '(^-+)|(-+$)', '', 'g');
    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'planning';
    END IF;

    candidate_slug := base_slug;
    suffix := 2;

    -- Garantit l'unicité : base, puis -2, -3, etc.
    WHILE EXISTS (
      SELECT 1
      FROM public.public_planning_links
      WHERE slug = candidate_slug
        AND id <> r.id
    ) LOOP
      candidate_slug := base_slug || '-' || suffix::TEXT;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.public_planning_links
    SET slug = candidate_slug
    WHERE id = r.id;
  END LOOP;
END $$;

-- Rendre le slug obligatoire pour les nouveaux liens
ALTER TABLE public.public_planning_links
  ALTER COLUMN slug SET NOT NULL;

-- Unicité globale du slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_planning_links_slug
  ON public.public_planning_links(slug);

SELECT 'Migration 037_public_planning_links_slug terminée' AS status;

