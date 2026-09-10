-- ============================================
-- MIGRATION 067 : profiles — SELECT staff, vue publique pour les members
-- ============================================
-- Un member actif pouvait SELECT * sur public.profiles (policy 023
-- profiles_select_member) et lire resend_api_key, iban, ids Stripe, QR.
--
-- Correction :
--   1) SELECT sur la table profiles = is_club_staff uniquement
--      (owner / admin / committee). Les members n'ont plus la ligne.
--   2) Vue profiles_public SECURITY DEFINER, filtrée par is_club_member,
--      colonnes UI uniquement (pas de secrets).
--
-- Aucune donnée / colonne supprimée. IDEMPOTENT.
-- ============================================

DROP POLICY IF EXISTS "profiles_select_member" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_staff"
  ON public.profiles
  FOR SELECT
  USING (
    public.is_club_staff(user_id)
    AND deleted_at IS NULL
  );

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = false)
AS
SELECT
  p.user_id,
  p.company_name,
  p.logo_url,
  p.logo_path,
  p.product_type,
  p.primary_color
FROM public.profiles AS p
WHERE p.deleted_at IS NULL
  AND public.is_club_member(p.user_id);

COMMENT ON VIEW public.profiles_public IS
  'Champs club non sensibles pour les membres actifs (SECURITY DEFINER + is_club_member). '
  'Sans resend_api_key, iban, QR bancaire, stripe_customer_id, stripe_subscription_id.';

REVOKE ALL ON TABLE public.profiles_public FROM PUBLIC;
REVOKE ALL ON TABLE public.profiles_public FROM anon;
GRANT SELECT ON TABLE public.profiles_public TO authenticated;

DO $$ BEGIN
  RAISE NOTICE 'Migration 067 OK — profiles SELECT staff + profiles_public member-safe';
END $$;
