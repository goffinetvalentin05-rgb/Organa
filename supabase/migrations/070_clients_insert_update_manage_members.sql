-- ============================================
-- MIGRATION 070 : clients INSERT/UPDATE = manage_members
-- ============================================
-- 038 autorisait :
--   is_club_staff(user_id) OR has_club_permission(user_id, 'manage_members')
-- Un committee actif SANS manage_members pouvait donc INSERT/UPDATE
-- toute fiche (nom, email, avs_number, date_of_birth, …) via PostgREST.
--
-- Correction : INSERT/UPDATE = uniquement
--   public.has_club_permission(user_id, 'manage_members')
-- Owner/admin : toujours autorisés (028, rôle fort).
-- Committee/member : JSON manage_members = true + status active (066).
--
-- SELECT 068/069, DELETE, GRANT, service_role, schéma, données : inchangés.
-- IDEMPOTENT.
-- ============================================

DROP POLICY IF EXISTS clients_insert_staff ON public.clients;
DROP POLICY IF EXISTS clients_update_staff ON public.clients;
DROP POLICY IF EXISTS clients_insert_manage_members ON public.clients;
DROP POLICY IF EXISTS clients_update_manage_members ON public.clients;

CREATE POLICY clients_insert_manage_members
  ON public.clients
  FOR INSERT
  WITH CHECK (
    public.has_club_permission(user_id, 'manage_members')
  );

CREATE POLICY clients_update_manage_members
  ON public.clients
  FOR UPDATE
  USING (
    public.has_club_permission(user_id, 'manage_members')
  )
  WITH CHECK (
    public.has_club_permission(user_id, 'manage_members')
  );

DO $$ BEGIN
  RAISE NOTICE 'Migration 070 OK — clients INSERT/UPDATE = manage_members';
END $$;
