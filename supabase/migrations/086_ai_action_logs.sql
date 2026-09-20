-- ============================================
-- MIGRATION 086 : journal des actions IA + confirmations
-- ============================================
-- ai_action_logs : trace de chaque appel Obillz Tool (IA ou UI).
-- ai_tool_confirmations : jetons de confirmation pour actions sensibles.
--
-- L'IA n'accède jamais à ces tables. Écriture service_role uniquement
-- après authorizeToolAction côté application.
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1) ai_action_logs
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  status TEXT NOT NULL CHECK (
    status IN ('completed', 'needs_confirmation', 'denied', 'error')
  ),
  source TEXT NOT NULL CHECK (
    source IN ('chatgpt', 'claude', 'gemini', 'obillz', 'api')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_club_created
  ON public.ai_action_logs (club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_user_created
  ON public.ai_action_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_tool
  ON public.ai_action_logs (tool_name);

COMMENT ON TABLE public.ai_action_logs IS
  'Journal des actions Obillz Tools (IA externe ou app). Append-only côté JWT.';

ALTER TABLE public.ai_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_action_logs_select_admin ON public.ai_action_logs;
CREATE POLICY ai_action_logs_select_admin
  ON public.ai_action_logs
  FOR SELECT
  USING (public.is_club_admin(club_id));

REVOKE ALL ON TABLE public.ai_action_logs FROM PUBLIC;
REVOKE ALL ON TABLE public.ai_action_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.ai_action_logs FROM authenticated;
GRANT SELECT ON TABLE public.ai_action_logs TO authenticated;
GRANT ALL ON TABLE public.ai_action_logs TO service_role;

-- ============================================
-- 2) ai_tool_confirmations
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_tool_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  params_hash TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tool_confirmations_actor
  ON public.ai_tool_confirmations (club_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tool_confirmations_expires
  ON public.ai_tool_confirmations (expires_at);

COMMENT ON TABLE public.ai_tool_confirmations IS
  'Jetons de confirmation à usage unique pour les tools sensibles.';

ALTER TABLE public.ai_tool_confirmations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_tool_confirmations FROM PUBLIC;
REVOKE ALL ON TABLE public.ai_tool_confirmations FROM anon;
REVOKE ALL ON TABLE public.ai_tool_confirmations FROM authenticated;
GRANT ALL ON TABLE public.ai_tool_confirmations TO service_role;

-- ============================================
-- 3) Purge : logs IA 12 mois, confirmations expirées 7 jours
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
  v_ai_logs INT := 0;
  v_ai_conf INT := 0;
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

  IF to_regclass('public.ai_action_logs') IS NOT NULL THEN
    DELETE FROM public.ai_action_logs
    WHERE created_at < (NOW() - INTERVAL '12 months');
    GET DIAGNOSTICS v_ai_logs = ROW_COUNT;
  END IF;

  IF to_regclass('public.ai_tool_confirmations') IS NOT NULL THEN
    DELETE FROM public.ai_tool_confirmations
    WHERE expires_at < (NOW() - INTERVAL '7 days');
    GET DIAGNOSTICS v_ai_conf = ROW_COUNT;
  END IF;

  v_result := jsonb_build_object(
    'invitations_expired_deleted', v_inv_expired,
    'invitations_cancelled_deleted', v_inv_cancelled,
    'idempotency_keys_deleted', v_idem,
    'audit_logs_deleted', v_audit,
    'email_history_purged', v_email,
    'planning_links_deactivated', v_links_off,
    'planning_links_deleted_after_event', v_links_old,
    'planning_links_soft_deleted_purged', v_links_soft,
    'ai_action_logs_deleted', v_ai_logs,
    'ai_tool_confirmations_deleted', v_ai_conf
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
  'Purge opérationnelle idempotente (invitations, idempotency, audit, logs IA, tokens planning). Jamais documents/factures/membres/commandes. Appel service_role uniquement.';

REVOKE ALL ON FUNCTION public.purge_operational_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_operational_data() FROM anon;
REVOKE ALL ON FUNCTION public.purge_operational_data() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_operational_data() TO service_role;
