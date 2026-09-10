-- ============================================
-- MIGRATION 069 : clients — pas de SELECT JWT sur AVS / DOB
-- ============================================
-- authenticated a un GRANT SELECT de NIVEAU TABLE (défaut Supabase).
-- REVOKE SELECT (avs_number) seul est insuffisant : le SELECT table
-- continue de couvrir toutes les colonnes, y compris select=*.
--
-- Correction :
--   1) REVOKE SELECT de niveau table pour PUBLIC, anon, authenticated.
--   2) GRANT SELECT explicite (allowlist) à authenticated, hors
--      avs_number et date_of_birth.
--
-- service_role n’est pas modifié (accès complet conservé).
-- RLS 068 inchangée. INSERT / UPDATE / DELETE inchangés.
-- Aucune donnée / colonne supprimée. IDEMPOTENT.
-- GRANT NON dynamique : liste figée, pas d’information_schema.
-- ============================================

REVOKE SELECT ON TABLE public.clients FROM PUBLIC;
REVOKE SELECT ON TABLE public.clients FROM anon;
REVOKE SELECT ON TABLE public.clients FROM authenticated;

REVOKE SELECT (avs_number) ON TABLE public.clients FROM PUBLIC;
REVOKE SELECT (avs_number) ON TABLE public.clients FROM anon;
REVOKE SELECT (avs_number) ON TABLE public.clients FROM authenticated;

REVOKE SELECT (date_of_birth) ON TABLE public.clients FROM PUBLIC;
REVOKE SELECT (date_of_birth) ON TABLE public.clients FROM anon;
REVOKE SELECT (date_of_birth) ON TABLE public.clients FROM authenticated;

GRANT SELECT (
  id,
  organization_id,
  user_id,
  nom,
  email,
  telephone,
  adresse,
  postal_code,
  city,
  role,
  category,
  created_at,
  updated_at,
  created_by,
  updated_by,
  deleted_at,
  deleted_by
) ON TABLE public.clients TO authenticated;

DO $$ BEGIN
  RAISE NOTICE 'Migration 069 OK — authenticated SELECT clients sans avs_number ni date_of_birth';
END $$;
