-- ============================================
-- MIGRATION 039 : clients.organization_id nullable
-- ============================================
-- Le modèle actuel rattache chaque membre au club via `user_id` (= club_id).
-- L’ancien schéma (schema.sql) imposait `organization_id NOT NULL` vers la
-- table legacy `organizations`, que le code Next n’alimente plus à l’INSERT.
-- Résultat : erreur PostgreSQL 23502 (violates not-null constraint) à la
-- création d’un membre malgré un formulaire complet.
--
-- On conserve la colonne pour les bases qui en ont encore une valeur, mais
-- les nouvelles lignes peuvent omettre organization_id.
-- IDEMPOTENT.
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clients'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.clients ALTER COLUMN organization_id DROP NOT NULL;
    RAISE NOTICE '039 OK — clients.organization_id nullable';
  ELSE
    RAISE NOTICE '039 skip — pas de colonne organization_id sur clients';
  END IF;
END $$;
