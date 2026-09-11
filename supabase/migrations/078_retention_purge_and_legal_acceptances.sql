-- ============================================
-- MIGRATION 078 : Purge opérationnelle + acceptation CGU/DPA
-- ============================================
-- 1) RPC purge_operational_data() — catégories autorisées uniquement
-- 2) Table legal_acceptances — preuve d’acceptation des NOUVEAUX clubs
--
-- AUCUN backfill d’acceptation : les clubs existants restent hors du flow.
-- Ne pas exécuter depuis l’app (application manuelle).
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- A) Preuve d’acceptation CGU + DPA (nouveaux clubs)
-- ============================================

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  dpa_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, user_id, terms_version, dpa_version)
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_club
  ON public.legal_acceptances (club_id);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user
  ON public.legal_acceptances (user_id);

COMMENT ON TABLE public.legal_acceptances IS
  'Acceptation électronique CGU + DPA à la création d’un nouveau club. Pas de backfill des clubs existants.';

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_acceptances_select_own ON public.legal_acceptances;
CREATE POLICY legal_acceptances_select_own
  ON public.legal_acceptances
  FOR SELECT
  USING (auth.uid() = club_id OR auth.uid() = user_id);

-- INSERT / UPDATE / DELETE : aucun policy JWT (service_role uniquement).

REVOKE ALL ON TABLE public.legal_acceptances FROM PUBLIC;
REVOKE ALL ON TABLE public.legal_acceptances FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.legal_acceptances FROM authenticated;
GRANT SELECT ON TABLE public.legal_acceptances TO authenticated;
GRANT ALL ON TABLE public.legal_acceptances TO service_role;

-- ============================================
-- B) Journal des runs de purge (compteurs, pas de données métier)
-- ============================================

CREATE TABLE IF NOT EXISTS public.retention_purge_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.retention_purge_runs IS
  'Journal des exécutions de purge_operational_data (compteurs uniquement).';

ALTER TABLE public.retention_purge_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.retention_purge_runs FROM PUBLIC;
REVOKE ALL ON TABLE public.retention_purge_runs FROM anon;
REVOKE ALL ON TABLE public.retention_purge_runs FROM authenticated;
GRANT ALL ON TABLE public.retention_purge_runs TO service_role;

-- ============================================
-- C) Purge opérationnelle
-- ============================================
-- Autorisé :
--   - invitations expirées / annulées : 90 jours après expiration ou annulation
--   - idempotency_keys : 30 jours après created_at
--   - audit_logs : 12 mois après created_at
--   - email_history soft-deleted : 30 jours après deleted_at
--   - public_planning_links : désactivation après la date du planning ;
--     suppression 90 jours après ; soft-deleted 30 jours
-- Interdit (ne pas ajouter) :
--   documents, clients, shop_*, expenses/depenses, club_revenues,
--   profiles, registrations, marketing_*, paiements Stripe, membres.

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

  DELETE FROM public.email_history
  WHERE deleted_at IS NOT NULL
    AND deleted_at < (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS v_email = ROW_COUNT;

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
  'Purge opérationnelle idempotente (invitations, idempotency, audit, email_history soft-deleted, tokens planning). Jamais documents/factures/membres/commandes. Appel service_role uniquement.';

REVOKE ALL ON FUNCTION public.purge_operational_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_operational_data() FROM anon;
REVOKE ALL ON FUNCTION public.purge_operational_data() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_operational_data() TO service_role;
