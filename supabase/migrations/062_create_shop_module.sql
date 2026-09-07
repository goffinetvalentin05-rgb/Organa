-- ============================================
-- MIGRATION 062 : Module Boutique (shop)
-- ============================================
-- Tables liées au club (club_id = identifiant du club / owner historique).
-- RLS : lecture membre, écriture staff, pas d'accès anon (APIs publiques
-- via service role côté serveur).
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Compteur de n° de commande par club / année
CREATE TABLE IF NOT EXISTS public.shop_order_counters (
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (club_id, year)
);

-- Paramètres boutique (1 ligne par club)
CREATE TABLE IF NOT EXISTS public.shop_settings (
  club_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  intro_text TEXT,
  pickup_info TEXT,
  orders_email TEXT,
  track_stock_default BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'CHF'
    CHECK (currency IN ('CHF')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_settings_slug_unique
  ON public.shop_settings (slug)
  WHERE slug IS NOT NULL;

-- Comptes de paiement Connect (abstraction provider)
CREATE TABLE IF NOT EXISTS public.club_payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe'
    CHECK (provider IN ('stripe')),
  provider_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (status IN (
      'not_connected',
      'onboarding',
      'pending',
      'complete',
      'restricted',
      'disabled'
    )),
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  display_name TEXT,
  account_email TEXT,
  livemode BOOLEAN,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_club_payment_accounts_provider_id
  ON public.club_payment_accounts (provider, provider_account_id)
  WHERE provider_account_id IS NOT NULL;

-- Produits
CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  promotional_price_cents INTEGER CHECK (
    promotional_price_cents IS NULL OR promotional_price_cents >= 0
  ),
  currency TEXT NOT NULL DEFAULT 'CHF' CHECK (currency IN ('CHF')),
  track_stock BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  has_variants BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'hidden'
    CHECK (status IN ('active', 'hidden', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_shop_products_club_status
  ON public.shop_products (club_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shop_products_club_created
  ON public.shop_products (club_id, created_at DESC);

-- Images produit
CREATE TABLE IF NOT EXISTS public.shop_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_product_images_product
  ON public.shop_product_images (product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_shop_product_images_club
  ON public.shop_product_images (club_id);

-- Variantes (SKU) : stock éventuellement par variante
CREATE TABLE IF NOT EXISTS public.shop_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  sku TEXT,
  stock_quantity INTEGER CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_product_variants_product
  ON public.shop_product_variants (product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_shop_product_variants_club
  ON public.shop_product_variants (club_id);

-- Commandes
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  fulfillment_method TEXT NOT NULL DEFAULT 'pickup'
    CHECK (fulfillment_method IN ('pickup', 'shipping')),
  pickup_info TEXT,
  shipping_address JSONB,
  currency TEXT NOT NULL DEFAULT 'CHF' CHECK (currency IN ('CHF')),
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN (
      'pending',
      'paid',
      'failed',
      'cancelled',
      'expired',
      'refunded'
    )),
  fulfillment_status TEXT NOT NULL DEFAULT 'none'
    CHECK (fulfillment_status IN (
      'none',
      'to_prepare',
      'ready',
      'handed_over',
      'cancelled'
    )),
  payment_provider TEXT NOT NULL DEFAULT 'stripe',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_connected_account_id TEXT,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  emails_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_orders_club_number
  ON public.shop_orders (club_id, order_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_orders_stripe_session
  ON public.shop_orders (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shop_orders_club_created
  ON public.shop_orders (club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shop_orders_club_payment
  ON public.shop_orders (club_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_shop_orders_club_fulfillment
  ON public.shop_orders (club_id, fulfillment_status);

-- Lignes de commande (prix figés au moment du checkout serveur)
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.shop_product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order
  ON public.shop_order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_club
  ON public.shop_order_items (club_id);

-- Paiements (source de vérité Stripe)
CREATE TABLE IF NOT EXISTS public.shop_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_account_id TEXT,
  provider_session_id TEXT,
  provider_payment_intent_id TEXT,
  provider_charge_id TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'CHF',
  application_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (application_fee_cents >= 0),
  status TEXT NOT NULL
    CHECK (status IN (
      'pending',
      'succeeded',
      'failed',
      'cancelled',
      'expired',
      'refunded'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_payments_order
  ON public.shop_payments (order_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_payments_session
  ON public.shop_payments (provider, provider_session_id)
  WHERE provider_session_id IS NOT NULL;

-- Idempotence webhooks
CREATE TABLE IF NOT EXISTS public.shop_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_event_id)
);

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_shop_settings_updated_at ON public.shop_settings;
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON public.shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_club_payment_accounts_updated_at ON public.club_payment_accounts;
CREATE TRIGGER update_club_payment_accounts_updated_at
  BEFORE UPDATE ON public.club_payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_products_updated_at ON public.shop_products;
CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_product_variants_updated_at ON public.shop_product_variants;
CREATE TRIGGER update_shop_product_variants_updated_at
  BEFORE UPDATE ON public.shop_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_orders_updated_at ON public.shop_orders;
CREATE TRIGGER update_shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_payments_updated_at ON public.shop_payments;
CREATE TRIGGER update_shop_payments_updated_at
  BEFORE UPDATE ON public.shop_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.shop_order_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_webhook_events ENABLE ROW LEVEL SECURITY;

-- Compteurs : staff seulement (utilisé surtout via service role au checkout)
DROP POLICY IF EXISTS shop_order_counters_select_staff ON public.shop_order_counters;
CREATE POLICY shop_order_counters_select_staff
  ON public.shop_order_counters FOR SELECT
  USING (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_order_counters_write_staff ON public.shop_order_counters;
CREATE POLICY shop_order_counters_insert_staff
  ON public.shop_order_counters FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_order_counters_update_staff ON public.shop_order_counters;
CREATE POLICY shop_order_counters_update_staff
  ON public.shop_order_counters FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

-- Settings
DROP POLICY IF EXISTS shop_settings_select_member ON public.shop_settings;
CREATE POLICY shop_settings_select_member
  ON public.shop_settings FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS shop_settings_insert_staff ON public.shop_settings;
CREATE POLICY shop_settings_insert_staff
  ON public.shop_settings FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_settings_update_staff ON public.shop_settings;
CREATE POLICY shop_settings_update_staff
  ON public.shop_settings FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

-- Comptes paiement : staff (contient des IDs Connect, pas de secrets cartes)
DROP POLICY IF EXISTS club_payment_accounts_select_staff ON public.club_payment_accounts;
CREATE POLICY club_payment_accounts_select_staff
  ON public.club_payment_accounts FOR SELECT
  USING (public.is_club_staff(club_id));

DROP POLICY IF EXISTS club_payment_accounts_insert_staff ON public.club_payment_accounts;
CREATE POLICY club_payment_accounts_insert_staff
  ON public.club_payment_accounts FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS club_payment_accounts_update_staff ON public.club_payment_accounts;
CREATE POLICY club_payment_accounts_update_staff
  ON public.club_payment_accounts FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

-- Produits
DROP POLICY IF EXISTS shop_products_select_member ON public.shop_products;
CREATE POLICY shop_products_select_member
  ON public.shop_products FOR SELECT
  USING (public.is_club_member(club_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS shop_products_insert_staff ON public.shop_products;
CREATE POLICY shop_products_insert_staff
  ON public.shop_products FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_products_update_staff ON public.shop_products;
CREATE POLICY shop_products_update_staff
  ON public.shop_products FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_products_delete_owner ON public.shop_products;
CREATE POLICY shop_products_delete_owner
  ON public.shop_products FOR DELETE
  USING (public.is_club_owner(club_id));

-- Images
DROP POLICY IF EXISTS shop_product_images_select_member ON public.shop_product_images;
CREATE POLICY shop_product_images_select_member
  ON public.shop_product_images FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS shop_product_images_insert_staff ON public.shop_product_images;
CREATE POLICY shop_product_images_insert_staff
  ON public.shop_product_images FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_product_images_update_staff ON public.shop_product_images;
CREATE POLICY shop_product_images_update_staff
  ON public.shop_product_images FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_product_images_delete_staff ON public.shop_product_images;
CREATE POLICY shop_product_images_delete_staff
  ON public.shop_product_images FOR DELETE
  USING (public.is_club_staff(club_id));

-- Variantes
DROP POLICY IF EXISTS shop_product_variants_select_member ON public.shop_product_variants;
CREATE POLICY shop_product_variants_select_member
  ON public.shop_product_variants FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS shop_product_variants_insert_staff ON public.shop_product_variants;
CREATE POLICY shop_product_variants_insert_staff
  ON public.shop_product_variants FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_product_variants_update_staff ON public.shop_product_variants;
CREATE POLICY shop_product_variants_update_staff
  ON public.shop_product_variants FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_product_variants_delete_staff ON public.shop_product_variants;
CREATE POLICY shop_product_variants_delete_staff
  ON public.shop_product_variants FOR DELETE
  USING (public.is_club_staff(club_id));

-- Commandes
DROP POLICY IF EXISTS shop_orders_select_member ON public.shop_orders;
CREATE POLICY shop_orders_select_member
  ON public.shop_orders FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS shop_orders_insert_staff ON public.shop_orders;
CREATE POLICY shop_orders_insert_staff
  ON public.shop_orders FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_orders_update_staff ON public.shop_orders;
CREATE POLICY shop_orders_update_staff
  ON public.shop_orders FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

-- Lignes
DROP POLICY IF EXISTS shop_order_items_select_member ON public.shop_order_items;
CREATE POLICY shop_order_items_select_member
  ON public.shop_order_items FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS shop_order_items_insert_staff ON public.shop_order_items;
CREATE POLICY shop_order_items_insert_staff
  ON public.shop_order_items FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

-- Paiements : staff seulement
DROP POLICY IF EXISTS shop_payments_select_staff ON public.shop_payments;
CREATE POLICY shop_payments_select_staff
  ON public.shop_payments FOR SELECT
  USING (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_payments_insert_staff ON public.shop_payments;
CREATE POLICY shop_payments_insert_staff
  ON public.shop_payments FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS shop_payments_update_staff ON public.shop_payments;
CREATE POLICY shop_payments_update_staff
  ON public.shop_payments FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

-- Webhooks : aucun accès client (service role uniquement)
DROP POLICY IF EXISTS shop_webhook_events_deny_all ON public.shop_webhook_events;
CREATE POLICY shop_webhook_events_deny_all
  ON public.shop_webhook_events FOR ALL
  USING (false)
  WITH CHECK (false);

-- Bucket images produits (public lecture, staff écriture, path = club_id/...)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'shop-products',
    'shop-products',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  )
  ON CONFLICT (id) DO UPDATE
  SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
  RAISE NOTICE '✓ Bucket shop-products';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Créer le bucket shop-products manuellement (public, images, max 5 Mo)';
END $$;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "shop_products_select_public" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "shop_products_insert_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "shop_products_update_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "shop_products_delete_staff" ON storage.objects';

  EXECUTE $sql$
    CREATE POLICY "shop_products_select_public"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'shop-products')
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "shop_products_insert_staff"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'shop-products'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "shop_products_update_staff"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'shop-products'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
      WITH CHECK (
        bucket_id = 'shop-products'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "shop_products_delete_staff"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'shop-products'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Policies storage shop-products : à créer manuellement';
END $$;

SELECT 'Migration 062_create_shop_module terminée' AS status;
