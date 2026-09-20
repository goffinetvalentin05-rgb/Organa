-- ============================================
-- MIGRATION 088 : Apparence ventes de soutien
-- + lien finance idempotent
-- ============================================
-- IDEMPOTENT. N’altère pas Boutique / Supporters / documents.
-- ============================================

ALTER TABLE public.support_sales
  ADD COLUMN IF NOT EXISTS public_label TEXT,
  ADD COLUMN IF NOT EXISTS public_title TEXT,
  ADD COLUMN IF NOT EXISTS public_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS public_primary_color TEXT,
  ADD COLUMN IF NOT EXISTS public_secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS public_page_style TEXT DEFAULT 'colors',
  ADD COLUMN IF NOT EXISTS public_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS public_banner_path TEXT,
  ADD COLUMN IF NOT EXISTS public_image_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS public_overlay_intensity TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS sponsor_url TEXT,
  ADD COLUMN IF NOT EXISTS club_revenue_id UUID REFERENCES public.club_revenues(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_sales_public_page_style_check'
  ) THEN
    ALTER TABLE public.support_sales
      ADD CONSTRAINT support_sales_public_page_style_check
      CHECK (public_page_style IS NULL OR public_page_style IN ('colors', 'banner', 'fullscreen'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_sales_public_image_position_check'
  ) THEN
    ALTER TABLE public.support_sales
      ADD CONSTRAINT support_sales_public_image_position_check
      CHECK (public_image_position IS NULL OR public_image_position IN ('top', 'center', 'bottom'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_sales_public_overlay_check'
  ) THEN
    ALTER TABLE public.support_sales
      ADD CONSTRAINT support_sales_public_overlay_check
      CHECK (public_overlay_intensity IS NULL OR public_overlay_intensity IN ('light', 'normal', 'dark'));
  END IF;
END $$;

ALTER TABLE public.club_revenues
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_club_revenues_source_unique
  ON public.club_revenues (user_id, source_type, source_id)
  WHERE source_type IS NOT NULL
    AND source_id IS NOT NULL
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_sales_club_revenue
  ON public.support_sales (club_id, club_revenue_id)
  WHERE club_revenue_id IS NOT NULL;

SELECT 'Migration 088_support_sales_appearance_and_finance terminée' AS status;
