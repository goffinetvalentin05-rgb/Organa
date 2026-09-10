-- ============================================
-- MIGRATION 071 : clients — plus d’INSERT/UPDATE JWT
-- ============================================
-- Aucun flux Obillz n’écrit public.clients via authenticated :
-- POST/PUT/import/buvette find-or-create passent par service_role
-- (requirePermission + createAdminClient + clubId).
-- DELETE owner reste JWT (GRANT DELETE + RLS owner) — non touché.
--
-- Correction : REVOKE INSERT, UPDATE pour PUBLIC, anon, authenticated.
-- service_role inchangé. Policies 070 conservées (défense en profondeur).
-- SELECT 068/069, schéma, données : inchangés. IDEMPOTENT.
-- ============================================

REVOKE INSERT, UPDATE ON TABLE public.clients FROM PUBLIC;
REVOKE INSERT, UPDATE ON TABLE public.clients FROM anon;
REVOKE INSERT, UPDATE ON TABLE public.clients FROM authenticated;

DO $$ BEGIN
  RAISE NOTICE 'Migration 071 OK — authenticated sans INSERT/UPDATE sur clients';
END $$;
