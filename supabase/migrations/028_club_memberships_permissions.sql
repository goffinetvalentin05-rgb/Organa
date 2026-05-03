-- ============================================
-- MIGRATION 028 : Permissions personnalisables par membership
-- ============================================
-- Objectif :
--   Permettre au président (owner) d'un club d'attribuer des permissions
--   granulaires à chaque utilisateur invité, sans rôle "rigide".
--
--   On garde le rôle existant pour la sécurité forte (owner / admin /
--   committee / member) qui pilote toujours les RLS, MAIS on ajoute une
--   couche de permissions "métier" (JSONB) que l'application contrôle :
--     - manage_members, view_members, delete_members
--     - manage_expenses, view_expenses, delete_expenses
--     - manage_invoices, view_invoices, delete_invoices
--     - manage_documents, view_documents, delete_documents
--     - view_plannings, manage_plannings
--     - access_settings, manage_users
--
--   Convention :
--     - L'owner historique (= créateur du club) reçoit TOUTES les permissions.
--     - Les owners existants au moment de la migration sont rétro-actifs avec
--       le set complet.
--     - Le code côté API interroge la fonction `has_club_permission(...)`
--       qui retourne TRUE si owner OU si permissions->>perm = 'true' et
--       status='active'.
--
-- IDEMPOTENT et NON-DESTRUCTIVE.
-- ============================================

-- ============================================
-- 1) Ajout des colonnes à club_memberships
-- ============================================
DO $$
BEGIN
  -- Identité affichée (utile aussi pour les invitations futures sans user_id)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'club_memberships' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.club_memberships ADD COLUMN name TEXT;
    RAISE NOTICE '✓ club_memberships.name ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'club_memberships' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.club_memberships ADD COLUMN email TEXT;
    RAISE NOTICE '✓ club_memberships.email ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'club_memberships' AND column_name = 'function_title'
  ) THEN
    ALTER TABLE public.club_memberships ADD COLUMN function_title TEXT;
    RAISE NOTICE '✓ club_memberships.function_title ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'club_memberships' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE public.club_memberships
      ADD COLUMN permissions JSONB NOT NULL DEFAULT '{}'::jsonb;
    RAISE NOTICE '✓ club_memberships.permissions ajoutée';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'club_memberships' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.club_memberships
      ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    RAISE NOTICE '✓ club_memberships.status ajoutée';
  END IF;

  -- created_by : à ne pas confondre avec invited_by historique. On ajoute
  -- created_by pour rester homogène avec le reste des tables métier.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'club_memberships' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.club_memberships
      ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✓ club_memberships.created_by ajoutée';
  END IF;
END $$;

-- Contrainte de validité du status (ajoutée hors DO pour permettre IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'club_memberships_status_check'
  ) THEN
    ALTER TABLE public.club_memberships
      ADD CONSTRAINT club_memberships_status_check
      CHECK (status IN ('invited', 'active', 'disabled'));
    RAISE NOTICE '✓ Contrainte status appliquée';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_club_memberships_status
  ON public.club_memberships(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_memberships_email
  ON public.club_memberships(LOWER(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;

-- ============================================
-- 2) Liste canonique des permissions
-- ============================================
-- (juste pour la documentation et la fonction d'audit)
COMMENT ON COLUMN public.club_memberships.permissions IS
  'Objet JSON {permission_key: true}. Clés autorisées : view_members, manage_members, delete_members, view_expenses, manage_expenses, delete_expenses, view_invoices, manage_invoices, delete_invoices, view_documents, manage_documents, delete_documents, view_plannings, manage_plannings, access_settings, manage_users.';

-- ============================================
-- 3) Backfill : owners existants → toutes permissions, status active
-- ============================================
UPDATE public.club_memberships
SET permissions = jsonb_build_object(
      'view_members', true,
      'manage_members', true,
      'delete_members', true,
      'view_expenses', true,
      'manage_expenses', true,
      'delete_expenses', true,
      'view_invoices', true,
      'manage_invoices', true,
      'delete_invoices', true,
      'view_documents', true,
      'manage_documents', true,
      'delete_documents', true,
      'view_plannings', true,
      'manage_plannings', true,
      'access_settings', true,
      'manage_users', true
    ),
    status = COALESCE(status, 'active')
WHERE role = 'owner'
  AND (permissions IS NULL OR permissions = '{}'::jsonb OR jsonb_typeof(permissions) <> 'object');

-- Pour les memberships non-owner sans permissions (cas extrême), on laisse
-- l'objet vide : ils n'ont rien tant que le owner n'a pas explicitement
-- coché des cases. L'app gère ça côté UI.

-- ============================================
-- 4) Helpers SQL : has_club_permission / current_user_permissions
-- ============================================
-- Renvoie TRUE si l'utilisateur courant peut effectuer p_perm sur p_club_id.
-- - Owner / admin (rôle fort) : tout autorisé.
-- - Sinon : nécessite permissions->>p_perm = 'true' ET status = 'active'.
CREATE OR REPLACE FUNCTION public.has_club_permission(
  p_club_id UUID,
  p_perm TEXT
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
      AND cm.status = 'active'
      AND (
        cm.role IN ('owner', 'admin')
        OR (cm.permissions ->> p_perm)::text = 'true'
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_club_permission(UUID, TEXT) TO authenticated;

-- Renvoie le set de permissions effectives pour un user dans un club
-- (un objet JSON {perm: true/false}).
CREATE OR REPLACE FUNCTION public.current_user_permissions(p_club_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN cm.role IN ('owner', 'admin') THEN jsonb_build_object(
        'view_members', true,
        'manage_members', true,
        'delete_members', true,
        'view_expenses', true,
        'manage_expenses', true,
        'delete_expenses', true,
        'view_invoices', true,
        'manage_invoices', true,
        'delete_invoices', true,
        'view_documents', true,
        'manage_documents', true,
        'delete_documents', true,
        'view_plannings', true,
        'manage_plannings', true,
        'access_settings', true,
        'manage_users', true
      )
      WHEN cm.status = 'active' THEN COALESCE(cm.permissions, '{}'::jsonb)
      ELSE '{}'::jsonb
    END
  FROM public.club_memberships cm
  WHERE cm.club_id = p_club_id
    AND cm.user_id = auth.uid()
    AND cm.deleted_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_permissions(UUID) TO authenticated;

-- ============================================
-- 5) Trigger d'inscription : enrichir les nouveaux owners auto-créés
-- ============================================
-- handle_new_user_membership() existe déjà (migration 020). On la remplace
-- pour également stamper la permissions full + status active + name.
CREATE OR REPLACE FUNCTION public.handle_new_user_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.club_memberships (
    club_id, user_id, role, accepted_at, status, email,
    permissions, created_by
  )
  VALUES (
    NEW.id, NEW.id, 'owner', NOW(), 'active', NEW.email,
    jsonb_build_object(
      'view_members', true,
      'manage_members', true,
      'delete_members', true,
      'view_expenses', true,
      'manage_expenses', true,
      'delete_expenses', true,
      'view_invoices', true,
      'manage_invoices', true,
      'delete_invoices', true,
      'view_documents', true,
      'manage_documents', true,
      'delete_documents', true,
      'view_plannings', true,
      'manage_plannings', true,
      'access_settings', true,
      'manage_users', true
    ),
    NEW.id
  )
  ON CONFLICT (club_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================
-- 6) Helper RPC : find_user_id_by_email
-- ============================================
-- Permet à un owner/admin du club d'inviter un user existant via son email.
-- SECURITY DEFINER pour accéder à auth.users mais on impose côté code que
-- l'appelant ait la permission manage_users.
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE LOWER(email) = LOWER(p_email) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) TO authenticated;

-- ============================================
-- VÉRIFICATION
-- ============================================
DO $$
DECLARE
  v_owners INT;
  v_with_perms INT;
BEGIN
  SELECT COUNT(*) INTO v_owners FROM public.club_memberships
   WHERE role = 'owner' AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_with_perms FROM public.club_memberships
   WHERE role = 'owner' AND (permissions ->> 'manage_users')::text = 'true';
  RAISE NOTICE '✓ Migration 028 OK — % owners, % avec permissions full',
    v_owners, v_with_perms;
END $$;
