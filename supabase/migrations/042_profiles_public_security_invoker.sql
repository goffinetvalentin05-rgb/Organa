-- ============================================
-- MIGRATION 042 : profiles_public en security_invoker
-- ============================================
-- Aligne le repo avec la correction déjà appliquée en production.
-- Recrée uniquement la vue (aucune table, aucune donnée).
-- IDEMPOTENT.
-- ============================================

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.plan,
  p.company_name,
  p.company_email,
  p.company_phone,
  p.company_address,
  p.logo_path,
  p.logo_url,
  p.primary_color,
  p.currency,
  p.currency_symbol,
  p.subscription_status,
  p.trial_started_at,
  p.billing_cycle,
  p.subscription_started_at,
  p.subscription_ends_at,
  p.buvette_slug,
  p.email_custom_enabled,
  p.email_sender_name,
  p.email_sender_email,
  p.created_at,
  p.updated_at
FROM public.profiles AS p
WHERE p.deleted_at IS NULL;

COMMENT ON VIEW public.profiles_public IS
  'Sous-ensemble non sensible de profiles (sans resend_api_key, iban, stripe…). '
  'security_invoker=true : les RLS de public.profiles s''appliquent à l''utilisateur courant.';

GRANT SELECT ON public.profiles_public TO authenticated;

DO $$ BEGIN RAISE NOTICE '✓ Migration 042 OK — profiles_public security_invoker'; END $$;
