-- ============================================
-- MIGRATION 060 : profiles.is_founder
-- ============================================
-- Colonne déjà lue par lib/billing (bypass fondateur) mais absente des
-- migrations versionnées. Ajout idempotent pour aligner schéma / code.
-- Ne change aucune donnée existante (DEFAULT false).
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_founder IS
  'Bypass abonnement pour comptes fondateurs Obillz. false pour tous les clubs clients.';

DO $$ BEGIN RAISE NOTICE '✓ Migration 060 OK — profiles.is_founder'; END $$;
