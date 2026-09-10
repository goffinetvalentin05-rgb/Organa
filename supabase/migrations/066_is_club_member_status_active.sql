-- ============================================
-- MIGRATION 066 : is_club_member exige status = 'active'
-- ============================================
-- Contexte : is_club_member (020) ne filtrait que deleted_at IS NULL.
-- Une membership disabled ou invited conservait donc les accès RLS
-- (SELECT member, WRITE staff/admin via les wrappers).
-- has_club_permission (028) filtrait déjà status = 'active'.
--
-- Correction minimale : une seule condition dans is_club_member.
-- is_club_staff / is_club_admin / is_club_owner délèguent déjà, donc
-- aucune policy individuelle n'est touchée.
--
-- Alignement des helpers voisins (même sémantique « actif ») :
--   current_user_club_ids, current_user_role_in, current_user_permissions.
--
-- IDEMPOTENT. Aucune donnée touchée. has_club_permission inchangé.
-- ============================================

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
    AND cm.deleted_at IS NULL
    AND cm.status = 'active';
$$;

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
      AND cm.status = 'active'
      AND (p_roles IS NULL OR cm.role = ANY(p_roles))
  );
$$;

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
    AND cm.status = 'active'
  LIMIT 1;
$$;

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
      ELSE COALESCE(cm.permissions, '{}'::jsonb)
    END
  FROM public.club_memberships cm
  WHERE cm.club_id = p_club_id
    AND cm.user_id = auth.uid()
    AND cm.deleted_at IS NULL
    AND cm.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_club_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_club_member(UUID, public.club_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role_in(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_permissions(UUID) TO authenticated;

DO $$ BEGIN
  RAISE NOTICE 'Migration 066 OK — is_club_member + helpers exigent status = active';
END $$;
