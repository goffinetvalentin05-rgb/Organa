-- ============================================
-- MIGRATION 079 : Module Supporters
-- ============================================
-- Source de revenus clubs : offres, adhésions payées via Stripe Connect
-- (direct charges), carte digitale web + QR de vérification.
-- club_id = identifiant du club (owner historique / auth.users).
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Compteur de numéros supporters (unique par club, assigné à l'activation)
CREATE TABLE IF NOT EXISTS public.supporter_number_counters (
  club_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0)
);

-- Offres
CREATE TABLE IF NOT EXISTS public.supporter_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'CHF' CHECK (currency IN ('CHF')),
  duration_type TEXT NOT NULL DEFAULT 'season'
    CHECK (duration_type IN ('season', 'year', 'custom')),
  start_date DATE,
  end_date DATE,
  max_supporters INTEGER CHECK (max_supporters IS NULL OR max_supporters > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  show_supporter_count BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT supporter_offers_dates_order CHECK (
    start_date IS NULL OR end_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT supporter_offers_dates_required CHECK (
    duration_type = 'year'
    OR (start_date IS NOT NULL AND end_date IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_supporter_offers_club_active
  ON public.supporter_offers (club_id, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supporter_offers_club_created
  ON public.supporter_offers (club_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Avantages (texte libre, pas de moteur automatique)
CREATE TABLE IF NOT EXISTS public.supporter_offer_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supporter_offer_id UUID NOT NULL REFERENCES public.supporter_offers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supporter_offer_benefits_offer
  ON public.supporter_offer_benefits (supporter_offer_id, position);

CREATE INDEX IF NOT EXISTS idx_supporter_offer_benefits_club
  ON public.supporter_offer_benefits (club_id);

-- Adhésions (un paiement = une ligne ; renouvellements futurs = nouvelles lignes)
CREATE TABLE IF NOT EXISTS public.supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supporter_offer_id UUID NOT NULL REFERENCES public.supporter_offers(id) ON DELETE RESTRICT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  public_name_enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  start_date DATE,
  end_date DATE,
  amount_paid_cents INTEGER CHECK (amount_paid_cents IS NULL OR amount_paid_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'CHF' CHECK (currency IN ('CHF')),
  supporter_number INTEGER CHECK (supporter_number IS NULL OR supporter_number > 0),
  card_token TEXT,
  qr_token TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  stripe_connected_account_id TEXT,
  emails_sent_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_supporters_club_number
  ON public.supporters (club_id, supporter_number)
  WHERE supporter_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supporters_card_token
  ON public.supporters (card_token)
  WHERE card_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supporters_qr_token
  ON public.supporters (qr_token)
  WHERE qr_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supporters_stripe_session
  ON public.supporters (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_supporters_stripe_pi
  ON public.supporters (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supporters_club_status
  ON public.supporters (club_id, status);

CREATE INDEX IF NOT EXISTS idx_supporters_club_created
  ON public.supporters (club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supporters_club_offer
  ON public.supporters (club_id, supporter_offer_id);

CREATE INDEX IF NOT EXISTS idx_supporters_club_email
  ON public.supporters (club_id, email);

CREATE INDEX IF NOT EXISTS idx_supporters_wall
  ON public.supporters (club_id, status, public_name_enabled)
  WHERE public_name_enabled = true;

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_supporter_offers_updated_at ON public.supporter_offers;
CREATE TRIGGER update_supporter_offers_updated_at
  BEFORE UPDATE ON public.supporter_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_supporter_offer_benefits_updated_at ON public.supporter_offer_benefits;
CREATE TRIGGER update_supporter_offer_benefits_updated_at
  BEFORE UPDATE ON public.supporter_offer_benefits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_supporters_updated_at ON public.supporters;
CREATE TRIGGER update_supporters_updated_at
  BEFORE UPDATE ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Numéro séquentiel par club (service role uniquement)
CREATE OR REPLACE FUNCTION public.next_supporter_number(p_club_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF p_club_id IS NULL THEN
    RAISE EXCEPTION 'club_id requis';
  END IF;

  INSERT INTO public.supporter_number_counters (club_id, last_number)
  VALUES (p_club_id, 1)
  ON CONFLICT (club_id)
  DO UPDATE SET last_number = public.supporter_number_counters.last_number + 1
  RETURNING last_number INTO n;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.next_supporter_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_supporter_number(uuid) TO service_role;

-- RLS
ALTER TABLE public.supporter_number_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporter_offer_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supporter_number_counters_deny_all ON public.supporter_number_counters;
CREATE POLICY supporter_number_counters_deny_all
  ON public.supporter_number_counters FOR ALL
  USING (false)
  WITH CHECK (false);

-- Offres : lecture membres, écriture staff
DROP POLICY IF EXISTS supporter_offers_select_member ON public.supporter_offers;
CREATE POLICY supporter_offers_select_member
  ON public.supporter_offers FOR SELECT
  USING (public.is_club_member(club_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS supporter_offers_insert_staff ON public.supporter_offers;
CREATE POLICY supporter_offers_insert_staff
  ON public.supporter_offers FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS supporter_offers_update_staff ON public.supporter_offers;
CREATE POLICY supporter_offers_update_staff
  ON public.supporter_offers FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

-- Avantages
DROP POLICY IF EXISTS supporter_offer_benefits_select_member ON public.supporter_offer_benefits;
CREATE POLICY supporter_offer_benefits_select_member
  ON public.supporter_offer_benefits FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS supporter_offer_benefits_insert_staff ON public.supporter_offer_benefits;
CREATE POLICY supporter_offer_benefits_insert_staff
  ON public.supporter_offer_benefits FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS supporter_offer_benefits_update_staff ON public.supporter_offer_benefits;
CREATE POLICY supporter_offer_benefits_update_staff
  ON public.supporter_offer_benefits FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS supporter_offer_benefits_delete_staff ON public.supporter_offer_benefits;
CREATE POLICY supporter_offer_benefits_delete_staff
  ON public.supporter_offer_benefits FOR DELETE
  USING (public.is_club_staff(club_id));

-- Supporters : PII (email, téléphone) — staff seulement.
-- Inserts checkout / activation via service role uniquement.
DROP POLICY IF EXISTS supporters_select_staff ON public.supporters;
CREATE POLICY supporters_select_staff
  ON public.supporters FOR SELECT
  USING (public.is_club_staff(club_id));

DROP POLICY IF EXISTS supporters_update_staff ON public.supporters;
CREATE POLICY supporters_update_staff
  ON public.supporters FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

SELECT 'Migration 079_create_supporters_module terminée' AS status;
