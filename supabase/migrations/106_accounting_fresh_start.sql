-- ============================================
-- MIGRATION 106 : démarrage sans historique
-- ============================================
-- Ajoute le mode fresh au contrôle déjà posé par la migration 105.
-- N'écrit aucune ligne de comptabilité.
-- IDEMPOTENT.
-- ============================================

ALTER TABLE public.accounting_settings
  DROP CONSTRAINT IF EXISTS accounting_settings_start_mode;

ALTER TABLE public.accounting_settings
  ADD CONSTRAINT accounting_settings_start_mode
  CHECK (start_mode IS NULL OR start_mode IN (
    'next_period', 'resume_current', 'from_today', 'full_period', 'from_date', 'fresh'
  ));
