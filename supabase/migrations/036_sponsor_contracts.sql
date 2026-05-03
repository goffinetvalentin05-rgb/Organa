-- ============================================
-- MIGRATION 036 : Contrats de sponsoring par club
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.sponsor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12, 2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('active', 'expired', 'pending')),
  sponsor_type TEXT
    CHECK (sponsor_type IS NULL OR sponsor_type IN ('gold', 'silver', 'bronze')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sponsor_contracts_dates_chk CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_contracts_club_end
  ON public.sponsor_contracts (club_id, end_date);

CREATE INDEX IF NOT EXISTS idx_sponsor_contracts_club_created
  ON public.sponsor_contracts (club_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.sponsor_contracts_sync_status()
RETURNS TRIGGER AS $$
DECLARE
  d date := CURRENT_DATE;
BEGIN
  IF d < NEW.start_date THEN
    NEW.status := 'pending';
  ELSIF NEW.start_date <= d AND d <= NEW.end_date THEN
    NEW.status := 'active';
  ELSE
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sponsor_contracts_sync_status_trg ON public.sponsor_contracts;
CREATE TRIGGER sponsor_contracts_sync_status_trg
  BEFORE INSERT OR UPDATE ON public.sponsor_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.sponsor_contracts_sync_status();

DROP TRIGGER IF EXISTS update_sponsor_contracts_updated_at ON public.sponsor_contracts;
CREATE TRIGGER update_sponsor_contracts_updated_at
  BEFORE UPDATE ON public.sponsor_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sponsor_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sponsor_contracts_select_member ON public.sponsor_contracts;
CREATE POLICY sponsor_contracts_select_member
  ON public.sponsor_contracts FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS sponsor_contracts_insert_staff ON public.sponsor_contracts;
CREATE POLICY sponsor_contracts_insert_staff
  ON public.sponsor_contracts FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS sponsor_contracts_update_staff ON public.sponsor_contracts;
CREATE POLICY sponsor_contracts_update_staff
  ON public.sponsor_contracts FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS sponsor_contracts_delete_owner ON public.sponsor_contracts;
DROP POLICY IF EXISTS sponsor_contracts_delete_staff ON public.sponsor_contracts;
CREATE POLICY sponsor_contracts_delete_staff
  ON public.sponsor_contracts FOR DELETE
  USING (public.is_club_staff(club_id));

SELECT 'Migration 036_sponsor_contracts terminée' AS status;
