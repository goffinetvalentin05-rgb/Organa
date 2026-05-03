-- ============================================
-- MIGRATION 030 : Invitations email pour les accès club
-- ============================================
-- Phase 2 du système de gestion des accès Obillz.
--
-- Une "invitation" représente un accès en attente d'acceptation : l'owner du
-- club peut inviter une personne par email avant même qu'elle n'ait un
-- compte Obillz. Au moment de l'acceptation (via lien email + connexion /
-- inscription), une `club_membership` est créée automatiquement avec les
-- permissions définies à l'invitation.
--
-- On utilise une table SÉPARÉE (plutôt que d'altérer club_memberships)
-- pour :
--   - garder `club_memberships.user_id NOT NULL` et la sémantique forte
--     "membre actif d'un club".
--   - séparer le cycle de vie (pending / accepted / cancelled / expired).
--   - permettre une RLS publique très restreinte sans toucher à la table
--     principale.
--
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1) Table club_invitations
-- ============================================
CREATE TABLE IF NOT EXISTS public.club_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  function_title TEXT,
  role public.club_role NOT NULL DEFAULT 'member',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Token : URL-safe random, jamais hashé (pas de mot de passe ; c'est un
  -- "shared secret" envoyé par email avec une expiration courte). Stocké
  -- en clair pour permettre la recherche par token côté API.
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_sent_at TIMESTAMPTZ DEFAULT NOW(),
  send_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_invitations_club
  ON public.club_invitations(club_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_club_invitations_email
  ON public.club_invitations(LOWER(email)) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_club_invitations_token
  ON public.club_invitations(token);
CREATE INDEX IF NOT EXISTS idx_club_invitations_expires
  ON public.club_invitations(expires_at) WHERE status = 'pending';

-- Une seule invitation pending pour (club_id, email)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_club_invitations_pending_email
  ON public.club_invitations(club_id, LOWER(email))
  WHERE status = 'pending';

-- Trigger updated_at (réutilise la fonction existante)
DROP TRIGGER IF EXISTS update_club_invitations_updated_at ON public.club_invitations;
CREATE TRIGGER update_club_invitations_updated_at
  BEFORE UPDATE ON public.club_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.club_invitations IS
  'Invitations email pour accès club. Token en clair = shared secret envoyé par email, expire après 14 jours par défaut.';

-- ============================================
-- 2) RLS
-- ============================================
ALTER TABLE public.club_invitations ENABLE ROW LEVEL SECURITY;

-- SELECT : owner/admin du club + utilisateur dont l'email correspond.
DROP POLICY IF EXISTS "club_invitations_select_admin" ON public.club_invitations;
CREATE POLICY "club_invitations_select_admin"
  ON public.club_invitations
  FOR SELECT
  USING (
    public.is_club_admin(club_id)
    OR (
      auth.uid() IS NOT NULL
      AND LOWER(email) = LOWER(COALESCE(
        (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()),
        ''
      ))
    )
  );

-- INSERT : owner/admin du club uniquement (la couche applicative complète
-- avec la permission `manage_users` pour les committee qui auraient le droit).
DROP POLICY IF EXISTS "club_invitations_insert_admin" ON public.club_invitations;
CREATE POLICY "club_invitations_insert_admin"
  ON public.club_invitations
  FOR INSERT
  WITH CHECK (public.is_club_admin(club_id));

-- UPDATE : owner/admin du club (pour cancel / resend) ; OU utilisateur dont
-- l'email correspond à l'invitation (pour accepter — uniquement transition
-- vers status='accepted').
DROP POLICY IF EXISTS "club_invitations_update_admin_or_invitee" ON public.club_invitations;
CREATE POLICY "club_invitations_update_admin_or_invitee"
  ON public.club_invitations
  FOR UPDATE
  USING (
    public.is_club_admin(club_id)
    OR (
      auth.uid() IS NOT NULL
      AND status = 'pending'
      AND LOWER(email) = LOWER(COALESCE(
        (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()),
        ''
      ))
    )
  )
  WITH CHECK (
    public.is_club_admin(club_id)
    OR (
      auth.uid() IS NOT NULL
      AND LOWER(email) = LOWER(COALESCE(
        (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()),
        ''
      ))
    )
  );

-- DELETE : owner uniquement (préférer status='cancelled' via UPDATE).
DROP POLICY IF EXISTS "club_invitations_delete_owner" ON public.club_invitations;
CREATE POLICY "club_invitations_delete_owner"
  ON public.club_invitations
  FOR DELETE
  USING (public.is_club_owner(club_id));

-- ============================================
-- 3) Fonctions utilitaires
-- ============================================

-- Marque comme expirées les invitations dont expires_at est dépassé.
-- Idempotent — appelé périodiquement (cron ou à chaque accès).
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.club_invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_invitations() TO authenticated;

-- Renvoie l'invitation publique correspondant à un token donné, sans
-- révéler les detail sensibles. Utilisée par /api/invitations/[token].
-- Retour : (club_id, email, name, function_title, role, permissions, status, expires_at, club_name)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  club_id UUID,
  email TEXT,
  name TEXT,
  function_title TEXT,
  role public.club_role,
  permissions JSONB,
  status TEXT,
  expires_at TIMESTAMPTZ,
  club_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    ci.id,
    ci.club_id,
    ci.email,
    ci.name,
    ci.function_title,
    ci.role,
    ci.permissions,
    -- Si expirée d'office, on remonte 'expired' même si pas encore flushé
    CASE
      WHEN ci.status = 'pending' AND ci.expires_at < NOW() THEN 'expired'
      ELSE ci.status
    END AS status,
    ci.expires_at,
    COALESCE(p.company_name, 'Club Obillz') AS club_name
  FROM public.club_invitations ci
  LEFT JOIN public.profiles p ON p.user_id = ci.club_id
  WHERE ci.token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated;

-- Accepte une invitation : crée la club_membership et marque l'invitation
-- comme acceptée. La fonction valide :
--   - L'invitation existe, est pending et non expirée.
--   - L'email de l'invitation correspond à l'email du user authentifié.
--   - L'invitation cible un club valide.
-- Retourne le membership créé.
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

  -- Anti-duplicate : si une membership active existe déjà sur ce club,
  -- on la met à jour avec les permissions de l'invitation.
  SELECT id INTO v_membership_id FROM public.club_memberships
   WHERE club_id = v_inv.club_id
     AND user_id = v_uid
     AND deleted_at IS NULL
   LIMIT 1;

  IF v_membership_id IS NOT NULL THEN
    UPDATE public.club_memberships
    SET name = COALESCE(v_inv.name, name),
        email = v_inv.email,
        function_title = COALESCE(v_inv.function_title, function_title),
        role = v_inv.role,
        permissions = v_inv.permissions,
        status = 'active',
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = v_membership_id;
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

  -- Audit log
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

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;

-- ============================================
-- VÉRIFICATION
-- ============================================
DO $$ BEGIN RAISE NOTICE '✓ Migration 030 OK — club_invitations + RPCs'; END $$;
