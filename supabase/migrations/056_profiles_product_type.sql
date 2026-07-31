-- ============================================
-- MIGRATION 056 : profiles.product_type
-- ============================================
-- Objectif :
--   Ajouter le produit d'appartenance d'une organisation (V1 : un seul
--   produit par organisation).
--
-- Contexte :
--   - public.profiles représente l'organisation (PK user_id = club_id historique).
--   - Les organisations existantes restent sur Obillz Sport.
--   - Aucun changement de RLS, trigger, FK, ni de code applicatif dans cette
--     migration.
--
-- Valeurs autorisées : 'sport' | 'association'
-- Défaut / backfill implicite : 'sport' (NOT NULL DEFAULT)
--
-- IDEMPOTENT : ré-exécutable sans effet de bord.
-- Pas d'index sur product_type : aucun filtre applicatif ne l'utilise encore.
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'sport';

-- Sécurise les ré-exécutions : drop puis recreate de la contrainte CHECK.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_product_type_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_product_type_check
  CHECK (product_type IN ('sport', 'association'));

COMMENT ON COLUMN public.profiles.product_type IS
  'Produit Obillz de l''organisation : sport | association. V1 = un seul produit par org. Les orgs existantes = sport.';
