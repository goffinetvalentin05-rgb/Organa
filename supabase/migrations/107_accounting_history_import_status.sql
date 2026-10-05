-- ============================================
-- MIGRATION 107 : statut d'import appliqué
-- ============================================
-- La contrainte posée par la première version de la migration 092
-- n'autorisait pas « applied ». Une modification ultérieure du fichier
-- 092 ne change pas une contrainte déjà créée.
-- N'écrit aucune ligne de comptabilité.
-- IDEMPOTENT.
-- ============================================

ALTER TABLE public.accounting_settings
  DROP CONSTRAINT IF EXISTS accounting_settings_history_import;

ALTER TABLE public.accounting_settings
  ADD CONSTRAINT accounting_settings_history_import
  CHECK (history_import_status IN ('not_requested', 'planned', 'manual', 'applied'));
