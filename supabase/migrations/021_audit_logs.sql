-- ============================================
-- MIGRATION 021 : Audit logs
-- ============================================
-- Table append-only pour tracer toutes les actions sensibles :
--   - login / login_failed / logout
--   - create / update / soft_delete / hard_delete / restore
--   - export
--   - permission_change (changement de rôle d'un membre)
--   - mfa_enroll / mfa_disable
--   - invite_member / accept_invitation / remove_member
--
-- Règles :
--   - INSERT : tout authentifié peut insérer un log POUR un club dont il est
--     membre actif (l'application reste responsable de la cohérence du contenu).
--   - SELECT : seuls owner/admin du club peuvent lire les audit logs.
--   - UPDATE / DELETE : INTERDIT à tout le monde (même owner). Seul le
--     service_role en backoffice peut purger via une procédure dédiée.
--
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1) Table audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role public.club_role,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure', 'denied')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_club_created
  ON public.audit_logs(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
  ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON public.audit_logs(resource_type, resource_id);

COMMENT ON TABLE public.audit_logs IS
  'Journal d''audit append-only. UPDATE/DELETE interdits via RLS. Conservation conseillée >= 12 mois (LPD/RGPD).';

-- ============================================
-- 2) RLS
-- ============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT : owner ou admin du club concerné
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs
  FOR SELECT
  USING (
    club_id IS NOT NULL
    AND public.is_club_admin(club_id)
  );

-- INSERT : tout membre actif du club peut écrire (car les actions de
-- consultation par exemple "member" doivent aussi pouvoir être tracées).
-- L'app applicative est responsable du contenu fidèle.
-- club_id NULL est autorisé pour les évènements pré-auth (ex: login_failed)
-- mais uniquement quand actor_id correspond à auth.uid() (ou est NULL).
DROP POLICY IF EXISTS "audit_logs_insert_member_or_self" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_member_or_self"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    (club_id IS NULL AND (actor_id = auth.uid() OR actor_id IS NULL))
    OR (club_id IS NOT NULL AND public.is_club_member(club_id))
  );

-- UPDATE : INTERDIT
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.audit_logs;
CREATE POLICY "audit_logs_no_update"
  ON public.audit_logs
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- DELETE : INTERDIT
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.audit_logs;
CREATE POLICY "audit_logs_no_delete"
  ON public.audit_logs
  FOR DELETE
  USING (false);

-- ============================================
-- 3) Helper de logging côté serveur
-- ============================================
-- Fonction utilitaire pour insérer un audit log depuis du code SQL/PLPGSQL.
-- Pour le code applicatif (Node), passer plutôt par lib/auth/audit.ts.
CREATE OR REPLACE FUNCTION public.log_audit(
  p_club_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_outcome TEXT DEFAULT 'success'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_actor UUID := auth.uid();
  v_actor_role public.club_role;
BEGIN
  IF p_club_id IS NOT NULL AND v_actor IS NOT NULL THEN
    v_actor_role := public.current_user_role_in(p_club_id);
  END IF;

  INSERT INTO public.audit_logs(
    club_id, actor_id, actor_role, action, resource_type, resource_id,
    metadata, outcome
  ) VALUES (
    p_club_id, v_actor, v_actor_role, p_action, p_resource_type, p_resource_id,
    COALESCE(p_metadata, '{}'::jsonb), COALESCE(p_outcome, 'success')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit(UUID, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated;

DO $$ BEGIN RAISE NOTICE '✓ Migration 021 OK — audit_logs en place'; END $$;
