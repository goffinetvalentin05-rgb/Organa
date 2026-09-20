-- ============================================
-- MIGRATION 089 : Horodatage de publication
-- des ventes de soutien (notifications idempotentes)
-- ============================================

ALTER TABLE public.support_sales
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

SELECT 'Migration 089_support_sales_published_at terminée' AS status;
