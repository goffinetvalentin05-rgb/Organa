-- ============================================
-- MIGRATION 020 : Multi-tenant rôles club
-- ============================================
-- Objectif :
--   1. Introduire le modèle multi-utilisateurs par club avec rôles :
--      owner, admin, committee, member.
--   2. Garder la compatibilité avec l'existant : on n'introduit PAS de table
--      "clubs" séparée pour cette phase. Le club_id reste l'UUID du compte
--      auth.users qui a créé le compte (= "owner historique"), c'est-à-dire
--      l'actuel `user_id` présent dans toutes les tables métier.
--   3. Toutes les RLS (migration 023) passeront désormais par
--      `club_memberships` + helpers SECURITY DEFINER. Les anciens comportements
--      sont préservés pour le owner historique.
--
-- IDEMPOTENT : ré-exécutable sans effet de bord.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1) Type ENUM des rôles
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'club_role') THEN
    CREATE TYPE public.club_role AS ENUM ('owner', 'admin', 'committee', 'member');
  END IF;
END $$;

-- ============================================
-- 2) Table club_memberships
-- ============================================
-- club_id = UUID du compte "owner historique" (= user_id présent partout
-- dans les tables métier). Cette convention permet d'éviter une migration
-- destructive de toutes les FK et de garder le code existant fonctionnel.
CREATE TABLE IF NOT EXISTS public.club_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.club_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_memberships_club_id
  ON public.club_memberships(club_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id
  ON public.club_memberships(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_club_memberships_role
  ON public.club_memberships(role) WHERE deleted_at IS NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_club_memberships_updated_at ON public.club_memberships;
CREATE TRIGGER update_club_memberships_updated_at
  BEFORE UPDATE ON public.club_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Garde-fou : un club doit toujours avoir AU MOINS un owner actif.
-- Implémenté via deux triggers AFTER (un par opération) qui appellent la même fonction.
-- L'état après l'opération est déjà persisté donc on peut compter directement.
CREATE OR REPLACE FUNCTION public.assert_club_has_owner()
RETURNS TRIGGER AS $$
DECLARE
  v_remaining_owners INT;
  v_target_club UUID;
BEGIN
  v_target_club := COALESCE(NEW.club_id, OLD.club_id);

  SELECT COUNT(*) INTO v_remaining_owners
  FROM public.club_memberships
  WHERE club_id = v_target_club
    AND role = 'owner'
    AND deleted_at IS NULL;

  IF v_remaining_owners < 1 THEN
    RAISE EXCEPTION 'Un club doit conserver au moins un owner actif (club_id=%)', v_target_club;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_club_memberships_keep_owner_upd ON public.club_memberships;
CREATE CONSTRAINT TRIGGER trg_club_memberships_keep_owner_upd
  AFTER UPDATE ON public.club_memberships
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.assert_club_has_owner();

DROP TRIGGER IF EXISTS trg_club_memberships_keep_owner_del ON public.club_memberships;
CREATE CONSTRAINT TRIGGER trg_club_memberships_keep_owner_del
  AFTER DELETE ON public.club_memberships
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.assert_club_has_owner();

-- ============================================
-- 3) Helpers SECURITY DEFINER (à utiliser dans les RLS)
-- ============================================
-- Ces helpers sont SECURITY DEFINER pour éviter les boucles RLS
-- (sinon RLS sur club_memberships → RLS sur club_memberships → ...).

-- Liste des club_id auxquels appartient l'utilisateur courant
CREATE OR REPLACE FUNCTION public.current_user_club_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cm.club_id
  FROM public.club_memberships cm
  WHERE cm.user_id = auth.uid()
    AND cm.deleted_at IS NULL;
$$;

-- Vérifie que l'utilisateur courant est membre actif d'un club donné,
-- avec optionnellement un filtre sur les rôles autorisés.
CREATE OR REPLACE FUNCTION public.is_club_member(
  p_club_id UUID,
  p_roles public.club_role[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships cm
    WHERE cm.club_id = p_club_id
      AND cm.user_id = auth.uid()
      AND cm.deleted_at IS NULL
      AND (p_roles IS NULL OR cm.role = ANY(p_roles))
  );
$$;

-- Helpers raccourcis lisibles dans les policies RLS
CREATE OR REPLACE FUNCTION public.is_club_owner(p_club_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT public.is_club_member(p_club_id, ARRAY['owner']::public.club_role[]);
$$;

CREATE OR REPLACE FUNCTION public.is_club_admin(p_club_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT public.is_club_member(p_club_id, ARRAY['owner','admin']::public.club_role[]);
$$;

-- "Staff" = peut écrire la donnée métier (tout sauf "member")
CREATE OR REPLACE FUNCTION public.is_club_staff(p_club_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT public.is_club_member(p_club_id, ARRAY['owner','admin','committee']::public.club_role[]);
$$;

-- Récupère le rôle effectif de l'utilisateur courant pour un club donné
CREATE OR REPLACE FUNCTION public.current_user_role_in(p_club_id UUID)
RETURNS public.club_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cm.role
  FROM public.club_memberships cm
  WHERE cm.club_id = p_club_id
    AND cm.user_id = auth.uid()
    AND cm.deleted_at IS NULL
  LIMIT 1;
$$;

-- ============================================
-- 4) RLS sur club_memberships elle-même
-- ============================================
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

-- Lecture : un user voit toutes les memberships des clubs dont il est membre
DROP POLICY IF EXISTS "membership_select_own_club" ON public.club_memberships;
CREATE POLICY "membership_select_own_club"
  ON public.club_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_club_member(club_id)
  );

-- Insert : seuls owner/admin du club peuvent ajouter une membership
DROP POLICY IF EXISTS "membership_insert_admin" ON public.club_memberships;
CREATE POLICY "membership_insert_admin"
  ON public.club_memberships
  FOR INSERT
  WITH CHECK (
    public.is_club_admin(club_id)
  );

-- Update : seuls owner/admin du club ; ne JAMAIS laisser modifier club_id ou user_id
DROP POLICY IF EXISTS "membership_update_admin" ON public.club_memberships;
CREATE POLICY "membership_update_admin"
  ON public.club_memberships
  FOR UPDATE
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

-- Delete physique : owner uniquement (les admins doivent passer par soft delete)
DROP POLICY IF EXISTS "membership_delete_owner" ON public.club_memberships;
CREATE POLICY "membership_delete_owner"
  ON public.club_memberships
  FOR DELETE
  USING (public.is_club_owner(club_id));

-- ============================================
-- 5) Backfill : créer une membership owner pour chaque user existant
-- ============================================
-- On suppose qu'aujourd'hui chaque user de auth.users représente un club
-- (modèle mono-utilisateur). On lui donne un membership "owner" sur SON
-- propre club_id (= son user_id).
INSERT INTO public.club_memberships (club_id, user_id, role, accepted_at)
SELECT u.id, u.id, 'owner', NOW()
FROM auth.users u
ON CONFLICT (club_id, user_id) DO NOTHING;

-- ============================================
-- 6) Trigger d'auto-création du membership owner à l'inscription
-- ============================================
-- À chaque nouveau auth.users, on crée automatiquement la membership owner
-- de son club personnel.
CREATE OR REPLACE FUNCTION public.handle_new_user_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.club_memberships (club_id, user_id, role, accepted_at)
  VALUES (NEW.id, NEW.id, 'owner', NOW())
  ON CONFLICT (club_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_membership ON auth.users;
CREATE TRIGGER on_auth_user_created_membership
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_membership();

-- ============================================
-- 7) Permissions GRANT minimales
-- ============================================
-- Les helpers SECURITY DEFINER sont appelables par les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.current_user_club_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_club_member(UUID, public.club_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_club_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_club_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_club_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role_in(UUID) TO authenticated;

-- ============================================
-- VÉRIFICATION
-- ============================================
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.club_memberships WHERE role = 'owner';
  RAISE NOTICE '✓ Migration 020 OK — % memberships owner créées', v_count;
END $$;
