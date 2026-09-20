-- ============================================
-- MIGRATION 087 : Module Ventes de soutien
-- ============================================
-- Opérations temporaires (fondue, vin, chocolat, etc.) où les membres
-- vendent à leur entourage. Distinct de la Boutique.
-- club_id = identifiant du club (owner historique / auth.users).
-- Aucune adresse acheteur. Minimisation des données (prénom uniquement).
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.support_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_path TEXT,
  image_url TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'CHF' CHECK (currency IN ('CHF')),
  available_quantity INTEGER CHECK (available_quantity IS NULL OR available_quantity > 0),
  start_date DATE,
  reservation_deadline DATE,
  distribution_info TEXT,
  member_scope TEXT NOT NULL DEFAULT 'all'
    CHECK (member_scope IN ('all', 'categories', 'members')),
  goal_per_member INTEGER CHECK (goal_per_member IS NULL OR goal_per_member > 0),
  sponsor_name TEXT,
  sponsor_logo_path TEXT,
  sponsor_logo_url TEXT,
  sponsor_text TEXT,
  collection_mode TEXT NOT NULL DEFAULT 'reservation'
    CHECK (collection_mode IN ('reservation', 'online')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'ended')),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT support_sales_dates_order CHECK (
    start_date IS NULL
    OR reservation_deadline IS NULL
    OR reservation_deadline >= start_date
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_sales_slug_unique
  ON public.support_sales (slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_sales_club_status
  ON public.support_sales (club_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_sales_club_created
  ON public.support_sales (club_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.support_sale_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.support_sales(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sale_id, category)
);

CREATE INDEX IF NOT EXISTS idx_support_sale_categories_club
  ON public.support_sale_categories (club_id, sale_id);

CREATE TABLE IF NOT EXISTS public.support_sale_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.support_sales(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sale_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_support_sale_members_club
  ON public.support_sale_members (club_id, sale_id);

CREATE INDEX IF NOT EXISTS idx_support_sale_members_client
  ON public.support_sale_members (client_id);

CREATE TABLE IF NOT EXISTS public.support_sale_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.support_sales(id) ON DELETE RESTRICT,
  member_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  member_name TEXT NOT NULL,
  member_category TEXT,
  buyer_first_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0),
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_sale_reservations_sale
  ON public.support_sale_reservations (club_id, sale_id, status);

CREATE INDEX IF NOT EXISTS idx_support_sale_reservations_member
  ON public.support_sale_reservations (sale_id, member_id);

CREATE INDEX IF NOT EXISTS idx_support_sale_reservations_created
  ON public.support_sale_reservations (club_id, created_at DESC);

DROP TRIGGER IF EXISTS update_support_sales_updated_at ON public.support_sales;
CREATE TRIGGER update_support_sales_updated_at
  BEFORE UPDATE ON public.support_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_sale_reservations_updated_at
  ON public.support_sale_reservations;
CREATE TRIGGER update_support_sale_reservations_updated_at
  BEFORE UPDATE ON public.support_sale_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.support_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sale_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sale_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sale_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_sales_select_member ON public.support_sales;
CREATE POLICY support_sales_select_member
  ON public.support_sales FOR SELECT
  USING (public.is_club_member(club_id) AND deleted_at IS NULL);

DROP POLICY IF EXISTS support_sales_insert_staff ON public.support_sales;
CREATE POLICY support_sales_insert_staff
  ON public.support_sales FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sales_update_staff ON public.support_sales;
CREATE POLICY support_sales_update_staff
  ON public.support_sales FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sale_categories_select_member ON public.support_sale_categories;
CREATE POLICY support_sale_categories_select_member
  ON public.support_sale_categories FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS support_sale_categories_insert_staff ON public.support_sale_categories;
CREATE POLICY support_sale_categories_insert_staff
  ON public.support_sale_categories FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sale_categories_update_staff ON public.support_sale_categories;
CREATE POLICY support_sale_categories_update_staff
  ON public.support_sale_categories FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sale_categories_delete_staff ON public.support_sale_categories;
CREATE POLICY support_sale_categories_delete_staff
  ON public.support_sale_categories FOR DELETE
  USING (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sale_members_select_member ON public.support_sale_members;
CREATE POLICY support_sale_members_select_member
  ON public.support_sale_members FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS support_sale_members_insert_staff ON public.support_sale_members;
CREATE POLICY support_sale_members_insert_staff
  ON public.support_sale_members FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sale_members_update_staff ON public.support_sale_members;
CREATE POLICY support_sale_members_update_staff
  ON public.support_sale_members FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sale_members_delete_staff ON public.support_sale_members;
CREATE POLICY support_sale_members_delete_staff
  ON public.support_sale_members FOR DELETE
  USING (public.is_club_staff(club_id));

-- Prénoms acheteurs : staff uniquement. Inserts publics via service role.
DROP POLICY IF EXISTS support_sale_reservations_select_staff ON public.support_sale_reservations;
CREATE POLICY support_sale_reservations_select_staff
  ON public.support_sale_reservations FOR SELECT
  USING (public.is_club_staff(club_id));

DROP POLICY IF EXISTS support_sale_reservations_update_staff ON public.support_sale_reservations;
CREATE POLICY support_sale_reservations_update_staff
  ON public.support_sale_reservations FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'support-sales',
    'support-sales',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  )
  ON CONFLICT (id) DO UPDATE
  SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
  RAISE NOTICE '✓ Bucket support-sales';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Créer le bucket support-sales manuellement (public, images, max 5 Mo)';
END $$;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "support_sales_select_public" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "support_sales_insert_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "support_sales_update_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "support_sales_delete_staff" ON storage.objects';

  EXECUTE $sql$
    CREATE POLICY "support_sales_select_public"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'support-sales')
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "support_sales_insert_staff"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'support-sales'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "support_sales_update_staff"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'support-sales'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
      WITH CHECK (
        bucket_id = 'support-sales'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "support_sales_delete_staff"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'support-sales'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Policies storage support-sales : à créer manuellement';
END $$;

SELECT 'Migration 087_create_support_sales_module terminée' AS status;
