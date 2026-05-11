-- ============================================
-- MIGRATION 038 : RLS clients — permission manage_members (JSON)
-- ============================================
-- Contexte : la migration 023 n'autorisait l'INSERT/UPDATE que via
-- is_club_staff (owner / admin / committee). Or la migration 028 a
-- introduit has_club_permission(...) aligné avec l'API Next, qui autorise
-- aussi les rôles « member » disposant de manage_members en JSON.
-- Sans ce correctif, l'API accepte la requête mais Supabase renvoie une
-- erreur RLS (new row violates row-level security policy).
--
-- IDEMPOTENT : repose sur les noms de policies créés par 023.
-- ============================================

DROP POLICY IF EXISTS clients_insert_staff ON public.clients;
CREATE POLICY clients_insert_staff
  ON public.clients FOR INSERT
  WITH CHECK (
    public.is_club_staff(user_id)
    OR public.has_club_permission(user_id, 'manage_members')
  );

DROP POLICY IF EXISTS clients_update_staff ON public.clients;
CREATE POLICY clients_update_staff
  ON public.clients FOR UPDATE
  USING (
    public.is_club_staff(user_id)
    OR public.has_club_permission(user_id, 'manage_members')
  )
  WITH CHECK (
    public.is_club_staff(user_id)
    OR public.has_club_permission(user_id, 'manage_members')
  );

DO $$ BEGIN RAISE NOTICE 'Migration 038 OK — clients RLS INSERT/UPDATE + manage_members'; END $$;
