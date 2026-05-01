-- ============================================
-- MIGRATION 026 : Intégrations chiffrées + dépréciation resend_api_key
-- ============================================
-- Aujourd'hui, profiles.resend_api_key est stockée EN CLAIR dans la base.
-- C'est une clé privée d'un service tiers (Resend) → risque majeur si la
-- base ou un dump est exposé (et risque accru si un membre obtient un
-- accès SELECT sur profiles).
--
-- Cette migration :
--   1. Crée une table public.club_integrations dédiée, séparée de profiles.
--   2. Stocke les secrets dans une colonne `secret_ciphertext` (BYTEA),
--      chiffrés via pgsodium (si dispo) ou pgcrypto + clé serveur.
--   3. Restreint l'accès SELECT direct à la colonne ciphertext :
--      seul le service_role peut LIRE le secret en clair via une RPC.
--   4. Conserve resend_api_key dans profiles pour rétrocompat le temps
--      du backfill, mais marque la colonne comme DÉPRÉCIÉE et la masque
--      via une vue (à utiliser dans le code applicatif).
--
-- IMPORTANT : pgsodium n'est pas activable partout. On opte pour une
-- approche pgcrypto + clé applicative passée par le backend Node
-- (variable d'env INTEGRATIONS_ENCRYPTION_KEY). La fonction RPC
-- `decrypt_integration_secret` n'est PAS appelable par les rôles
-- authenticated/anon : seul le service_role (côté serveur) peut l'invoquer.
--
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1) Table club_integrations
-- ============================================
CREATE TABLE IF NOT EXISTS public.club_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('resend', 'stripe')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Le secret est chiffré symétriquement avec pgcrypto. La clé n'est jamais
  -- en base : elle est passée comme argument par le backend Node.
  secret_ciphertext BYTEA,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(club_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_club_integrations_club
  ON public.club_integrations(club_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS update_club_integrations_updated_at ON public.club_integrations;
CREATE TRIGGER update_club_integrations_updated_at
  BEFORE UPDATE ON public.club_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON COLUMN public.club_integrations.secret_ciphertext IS
  'Secret chiffré via pgcrypto (pgp_sym_encrypt) avec une clé serveur (INTEGRATIONS_ENCRYPTION_KEY). Jamais lu en clair par le rôle authenticated.';

-- ============================================
-- 2) RLS sur club_integrations
-- ============================================
ALTER TABLE public.club_integrations ENABLE ROW LEVEL SECURITY;

-- SELECT : owner/admin du club voient l'existence et la config (pas le secret).
-- Le secret_ciphertext est techniquement visible mais inutilisable sans la clé.
DROP POLICY IF EXISTS "club_integrations_select_admin" ON public.club_integrations;
CREATE POLICY "club_integrations_select_admin"
  ON public.club_integrations FOR SELECT
  USING (public.is_club_admin(club_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS "club_integrations_insert_admin" ON public.club_integrations;
CREATE POLICY "club_integrations_insert_admin"
  ON public.club_integrations FOR INSERT
  WITH CHECK (public.is_club_admin(club_id));

DROP POLICY IF EXISTS "club_integrations_update_admin" ON public.club_integrations;
CREATE POLICY "club_integrations_update_admin"
  ON public.club_integrations FOR UPDATE
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

DROP POLICY IF EXISTS "club_integrations_delete_owner" ON public.club_integrations;
CREATE POLICY "club_integrations_delete_owner"
  ON public.club_integrations FOR DELETE
  USING (public.is_club_owner(club_id));

-- ============================================
-- 3) RPC : déchiffrement (service_role uniquement)
-- ============================================
-- Cette fonction est SECURITY INVOKER et pas SECURITY DEFINER : elle
-- n'élève pas les privilèges. Elle ne sera appelable QUE par le rôle
-- service_role (backend serveur) car on REVOQUE EXECUTE pour authenticated.
CREATE OR REPLACE FUNCTION public.decrypt_integration_secret(
  p_ciphertext BYTEA,
  p_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_ciphertext IS NULL OR p_key IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(p_ciphertext, p_key);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.decrypt_integration_secret(BYTEA, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_integration_secret(BYTEA, TEXT) FROM authenticated, anon;
-- service_role a accès par défaut.

CREATE OR REPLACE FUNCTION public.encrypt_integration_secret(
  p_plain TEXT,
  p_key TEXT
)
RETURNS BYTEA
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_plain IS NULL OR p_key IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_encrypt(p_plain, p_key);
END;
$$;

REVOKE ALL ON FUNCTION public.encrypt_integration_secret(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.encrypt_integration_secret(TEXT, TEXT) FROM authenticated, anon;

-- ============================================
-- 4) Marquer la colonne profiles.resend_api_key comme dépréciée
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'resend_api_key'
  ) THEN
    COMMENT ON COLUMN public.profiles.resend_api_key IS
      '⚠ DÉPRÉCIÉ — à supprimer après backfill vers club_integrations(provider=resend). Ne plus utiliser dans le code applicatif.';
  END IF;
END $$;

-- ============================================
-- 5) Vue safe sur profiles (sans le secret)
-- ============================================
-- Le code applicatif doit utiliser cette vue à la place de `profiles`
-- pour s'assurer qu'on ne récupère jamais accidentellement resend_api_key.
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT
  p.user_id,
  p.plan,
  p.company_name,
  p.company_email,
  p.company_phone,
  p.company_address,
  p.logo_path,
  p.logo_url,
  p.primary_color,
  p.currency,
  p.currency_symbol,
  p.subscription_status,
  p.trial_started_at,
  p.billing_cycle,
  p.subscription_started_at,
  p.subscription_ends_at,
  p.buvette_slug,
  p.email_custom_enabled,
  p.email_sender_name,
  p.email_sender_email,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.deleted_at IS NULL;

GRANT SELECT ON public.profiles_public TO authenticated;

DO $$ BEGIN RAISE NOTICE '✓ Migration 026 OK — club_integrations en place'; END $$;
