BEGIN;

-- RLS : member actif = ligne de SON club (user_id = club_id).
-- deleted_at reste ici uniquement (pas de GRANT colonne, pas dans la vue).
DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_member" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_active_member" ON public.profiles;

CREATE POLICY "profiles_select_active_member"
  ON public.profiles
  FOR SELECT
  USING (
    public.is_club_member(user_id)
    AND deleted_at IS NULL
  );

-- Plus de SELECT table JWT. Six colonnes publiques seulement.
REVOKE SELECT ON TABLE public.profiles FROM PUBLIC;
REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.profiles FROM authenticated;

GRANT SELECT (
  user_id,
  company_name,
  logo_url,
  logo_path,
  product_type,
  primary_color
) ON TABLE public.profiles TO authenticated;

-- Vue invoker : pas de deleted_at (sinon permission denied sans GRANT colonne).
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.company_name,
  p.logo_url,
  p.logo_path,
  p.product_type,
  p.primary_color
FROM public.profiles AS p
WHERE public.is_club_member(p.user_id);

COMMENT ON VIEW public.profiles_public IS
  'Champs club non sensibles pour les membres actifs (security_invoker + RLS + GRANT colonnes). '
  'Sans resend_api_key, iban, QR bancaire, Stripe, abonnement. Soft-delete via RLS uniquement.';

REVOKE ALL ON TABLE public.profiles_public FROM PUBLIC;
REVOKE ALL ON TABLE public.profiles_public FROM anon;
GRANT SELECT ON TABLE public.profiles_public TO authenticated;

COMMIT;
