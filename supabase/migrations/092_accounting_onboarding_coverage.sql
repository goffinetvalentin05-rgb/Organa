-- ============================================
-- MIGRATION 092 : démarrage comptable
-- ============================================
-- Sépare l'exercice (accounting_periods) de la date
-- à partir de laquelle Obillz tient les comptes (start_date).
-- Les clubs déjà onboardés ne sont pas réinitialisés.
-- IDEMPOTENT.
-- ============================================

ALTER TABLE public.accounting_settings
  ADD COLUMN IF NOT EXISTS coverage_type TEXT NOT NULL DEFAULT 'full_period',
  ADD COLUMN IF NOT EXISTS start_mode TEXT,
  ADD COLUMN IF NOT EXISTS history_import_status TEXT NOT NULL DEFAULT 'not_requested';

DO $$ BEGIN
  ALTER TABLE public.accounting_settings
    ADD CONSTRAINT accounting_settings_coverage_type
    CHECK (coverage_type IN ('full_period', 'partial_period'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.accounting_settings
    ADD CONSTRAINT accounting_settings_start_mode
    CHECK (start_mode IS NULL OR start_mode IN ('next_period', 'resume_current', 'from_today'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.accounting_settings
    ADD CONSTRAINT accounting_settings_history_import
    CHECK (history_import_status IN ('not_requested', 'planned', 'manual'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.accounting_settings.start_date IS
  'Date à partir de laquelle Obillz comptabilise. Distincte du début d’exercice.';
COMMENT ON COLUMN public.accounting_settings.coverage_type IS
  'full_period : Obillz couvre tout l’exercice. partial_period : démarrage en cours d’exercice.';

-- Intention d’import futur. Aucun fichier n’est interprété ici.
CREATE TABLE IF NOT EXISTS public.accounting_history_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.accounting_periods(id) ON DELETE SET NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'excel', 'balance', 'journal')),
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'uploaded', 'applied', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.accounting_history_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounting_history_imports_select ON public.accounting_history_imports;
CREATE POLICY accounting_history_imports_select ON public.accounting_history_imports
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));
