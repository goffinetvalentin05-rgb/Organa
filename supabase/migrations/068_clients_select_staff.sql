-- ============================================
-- MIGRATION 068 : clients — SELECT staff uniquement
-- ============================================
-- Un member actif pouvait SELECT * sur public.clients (policy 023
-- clients_select = is_club_member) et lire avs_number, date_of_birth,
-- email, téléphone, adresse.
--
-- Correction : SELECT = is_club_staff uniquement (owner / admin / committee).
-- L’annuaire member passe par GET /api/clients après VIEW_MEMBERS + service_role.
--
-- INSERT/UPDATE inchangés (038). Aucune donnée / colonne supprimée. IDEMPOTENT.
-- ============================================

DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_select_staff" ON public.clients;
DROP POLICY IF EXISTS "clients_select_member" ON public.clients;

CREATE POLICY "clients_select_staff"
  ON public.clients
  FOR SELECT
  USING (
    public.is_club_staff(user_id)
    AND deleted_at IS NULL
  );

DO $$ BEGIN
  RAISE NOTICE 'Migration 068 OK — clients SELECT staff only';
END $$;
