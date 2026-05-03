-- ============================================
-- FIX : accept_invitation — "club_id is ambiguous"
-- ============================================
-- RETURNS TABLE (membership_id, club_id) crée des variables PL/pgSQL
-- homonymes. Dans « WHERE club_id = v_inv.club_id », PostgreSQL ne sait
-- pas si club_id désigne la colonne club_memberships.club_id ou la
-- variable de sortie → erreur à l'acceptation d'invitation.
-- On qualifie explicitement les colonnes via un alias de table.
-- ============================================

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT)
RETURNS TABLE (
  membership_id UUID,
  club_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_user_email TEXT;
  v_inv RECORD;
  v_membership_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_uid;
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Email utilisateur introuvable';
  END IF;

  SELECT * INTO v_inv FROM public.club_invitations
   WHERE token = p_token
   FOR UPDATE;

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'Invitation introuvable';
  END IF;

  IF v_inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation non valide (statut=%)', v_inv.status;
  END IF;

  IF v_inv.expires_at < NOW() THEN
    UPDATE public.club_invitations SET status = 'expired' WHERE id = v_inv.id;
    RAISE EXCEPTION 'Invitation expirée';
  END IF;

  IF LOWER(v_inv.email) <> LOWER(v_user_email) THEN
    RAISE EXCEPTION 'L''email de votre compte ne correspond pas à celui de l''invitation';
  END IF;

  SELECT m.id INTO v_membership_id
  FROM public.club_memberships m
  WHERE m.club_id = v_inv.club_id
    AND m.user_id = v_uid
    AND m.deleted_at IS NULL
  LIMIT 1;

  IF v_membership_id IS NOT NULL THEN
    UPDATE public.club_memberships cm
    SET name = COALESCE(v_inv.name, cm.name),
        email = v_inv.email,
        function_title = COALESCE(v_inv.function_title, cm.function_title),
        role = v_inv.role,
        permissions = v_inv.permissions,
        status = 'active',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE cm.id = v_membership_id;
  ELSE
    INSERT INTO public.club_memberships (
      club_id, user_id, role, status,
      name, email, function_title, permissions,
      invited_by, invited_at, accepted_at, created_by
    )
    VALUES (
      v_inv.club_id, v_uid, v_inv.role, 'active',
      v_inv.name, v_inv.email, v_inv.function_title, v_inv.permissions,
      v_inv.created_by, v_inv.created_at, NOW(), v_inv.created_by
    )
    RETURNING id INTO v_membership_id;
  END IF;

  UPDATE public.club_invitations
  SET status = 'accepted',
      accepted_by = v_uid,
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_inv.id;

  PERFORM public.log_audit(
    v_inv.club_id,
    'accept_invitation',
    'club_invitation',
    v_inv.id::text,
    jsonb_build_object('email', v_inv.email, 'role', v_inv.role),
    'success'
  );

  RETURN QUERY SELECT v_membership_id, v_inv.club_id;
END;
$$;

DO $$ BEGIN RAISE NOTICE '✓ Migration 031 OK — accept_invitation club_id non ambigu'; END $$;
