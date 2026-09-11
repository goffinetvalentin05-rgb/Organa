BEGIN;

-- find_user_id_by_email : plus d’EXECUTE JWT (service_role uniquement).
-- Appels applicatifs : admin après MANAGE_USERS, ou token d’invitation.
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog
AS $$
  SELECT id
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) TO service_role;

-- soft_delete_row : retire `clients` de la whitelist (plus aucun appel app).
-- buvette_requests reste autorisé (staff du club de la ligne).
CREATE OR REPLACE FUNCTION public.soft_delete_row(
  p_table TEXT,
  p_row_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_club_id UUID;
  v_query TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_actor UUID := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF p_row_id IS NULL THEN
    RAISE EXCEPTION 'Identifiant invalide';
  END IF;

  IF p_table NOT IN (
    'documents','events','event_types','plannings',
    'public_planning_links','depenses','expenses',
    'email_history','qrcodes','buvette_slots','buvette_requests',
    'marketing_contacts','marketing_campaigns','club_revenues'
  ) THEN
    RAISE EXCEPTION 'Table non autorisée pour soft_delete_row : %', p_table;
  END IF;

  EXECUTE format(
    'SELECT user_id FROM public.%I WHERE id = $1',
    p_table
  ) INTO v_club_id USING p_row_id;

  IF v_club_id IS NULL THEN
    RAISE EXCEPTION 'Ligne introuvable ou non rattachée à un club (%/%)', p_table, p_row_id;
  END IF;

  IF NOT public.is_club_staff(v_club_id) THEN
    RAISE EXCEPTION 'Permission insuffisante (rôle staff requis)';
  END IF;

  v_query := format(
    'UPDATE public.%I SET deleted_at = $1, deleted_by = $2 WHERE id = $3 AND deleted_at IS NULL',
    p_table
  );
  EXECUTE v_query USING v_now, v_actor, p_row_id;

  PERFORM public.log_audit(
    v_club_id, 'soft_delete', p_table, p_row_id::text, '{}'::jsonb, 'success'
  );

  RETURN TRUE;
END;
$$;

COMMIT;
