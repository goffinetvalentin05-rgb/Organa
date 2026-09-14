-- ============================================
-- MIGRATION 083 : purge_operational_data sans table email_history
-- ============================================
-- 078 DELETE FROM public.email_history inconditionnellement.
-- La table n’existe pas en production (008_create_email_history.sql
-- jamais appliquée ; aucun code applicatif n’écrit dans cette table).
--
-- Ne crée PAS la table : fonctionnalité d’historique d’e-mails absente.
-- Si la relation existe un jour, la purge soft-deleted reste active.
--
-- IDEMPOTENT. service_role uniquement.
-- ============================================

CREATE OR REPLACE FUNCTION public.purge_operational_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_inv_expired INT := 0;
  v_inv_cancelled INT := 0;
  v_idem INT := 0;
  v_audit INT := 0;
  v_email INT := 0;
  v_links_off INT := 0;
  v_links_old INT := 0;
  v_links_soft INT := 0;
  v_result jsonb;
BEGIN
  PERFORM public.expire_old_invitations();

  DELETE FROM public.club_invitations
  WHERE status = 'expired'
    AND expires_at < (NOW() - INTERVAL '90 days');
  GET DIAGNOSTICS v_inv_expired = ROW_COUNT;

  DELETE FROM public.club_invitations
  WHERE status = 'cancelled'
    AND COALESCE(cancelled_at, updated_at) < (NOW() - INTERVAL '90 days');
  GET DIAGNOSTICS v_inv_cancelled = ROW_COUNT;

  DELETE FROM public.idempotency_keys
  WHERE created_at < (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS v_idem = ROW_COUNT;

  DELETE FROM public.audit_logs
  WHERE created_at < (NOW() - INTERVAL '12 months');
  GET DIAGNOSTICS v_audit = ROW_COUNT;

  IF to_regclass('public.email_history') IS NOT NULL THEN
    DELETE FROM public.email_history
    WHERE deleted_at IS NOT NULL
      AND deleted_at < (NOW() - INTERVAL '30 days');
    GET DIAGNOSTICS v_email = ROW_COUNT;
  END IF;

  UPDATE public.public_planning_links AS ppl
  SET active = FALSE
  FROM public.plannings AS p
  WHERE ppl.planning_id = p.id
    AND ppl.active IS TRUE
    AND p.date < CURRENT_DATE;
  GET DIAGNOSTICS v_links_off = ROW_COUNT;

  DELETE FROM public.public_planning_links AS ppl
  USING public.plannings AS p
  WHERE ppl.planning_id = p.id
    AND p.date < (CURRENT_DATE - 90);
  GET DIAGNOSTICS v_links_old = ROW_COUNT;

  DELETE FROM public.public_planning_links
  WHERE deleted_at IS NOT NULL
    AND deleted_at < (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS v_links_soft = ROW_COUNT;

  v_result := jsonb_build_object(
    'invitations_expired_deleted', v_inv_expired,
    'invitations_cancelled_deleted', v_inv_cancelled,
    'idempotency_keys_deleted', v_idem,
    'audit_logs_deleted', v_audit,
    'email_history_purged', v_email,
    'planning_links_deactivated', v_links_off,
    'planning_links_deleted_after_event', v_links_old,
    'planning_links_soft_deleted_purged', v_links_soft
  );

  INSERT INTO public.retention_purge_runs (result) VALUES (v_result);

  INSERT INTO public.audit_logs (
    club_id, action, resource_type, outcome, metadata
  ) VALUES (
    NULL,
    'retention_purge',
    'retention',
    'success',
    v_result
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.purge_operational_data() IS
  'Purge opérationnelle idempotente (invitations, idempotency, audit, email_history soft-deleted si la table existe, tokens planning). Jamais documents/factures/membres/commandes. Appel service_role uniquement.';

REVOKE ALL ON FUNCTION public.purge_operational_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_operational_data() FROM anon;
REVOKE ALL ON FUNCTION public.purge_operational_data() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_operational_data() TO service_role;
