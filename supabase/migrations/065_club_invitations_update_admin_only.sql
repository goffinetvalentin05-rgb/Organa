-- ============================================
-- MIGRATION 065 : club_invitations UPDATE — admin uniquement
-- ============================================
-- La policy 030 « club_invitations_update_admin_or_invitee » laissait
-- un invité authentifié (e-mail correspondant, invitation pending) passer
-- un UPDATE direct, sans geler role / permissions / club_id / status.
-- L'application n'utilise pas cet UPDATE : l'acceptation passe par la RPC
-- SECURITY DEFINER accept_invitation (inchangée).
--
-- Cette migration retire la branche invitee. L'UPDATE reste is_club_admin
-- (owner / admin), comme l'INSERT. SELECT / INSERT / DELETE inchangés.
--
-- IDEMPOTENT. Aucune donnée touchée.
-- ============================================

DROP POLICY IF EXISTS "club_invitations_update_admin_or_invitee"
  ON public.club_invitations;
DROP POLICY IF EXISTS "club_invitations_update_admin"
  ON public.club_invitations;

CREATE POLICY "club_invitations_update_admin"
  ON public.club_invitations
  FOR UPDATE
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

DO $$ BEGIN
  RAISE NOTICE 'Migration 065 OK — club_invitations UPDATE admin-only';
END $$;
