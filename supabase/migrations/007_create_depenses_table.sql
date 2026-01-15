-- ============================================
-- MIGRATION : Création de la table depenses
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.depenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fournisseur TEXT NOT NULL,
  montant NUMERIC(10, 2) NOT NULL DEFAULT 0,
  date_echeance DATE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'a_payer' CHECK (statut IN ('a_payer', 'paye')),
  note TEXT,
  piece_jointe JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_depenses_user_id ON public.depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date_echeance ON public.depenses(date_echeance);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_depenses_updated_at ON public.depenses;
CREATE TRIGGER update_depenses_updated_at
  BEFORE UPDATE ON public.depenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own depenses" ON public.depenses;
CREATE POLICY "Users can view their own depenses"
  ON public.depenses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own depenses" ON public.depenses;
CREATE POLICY "Users can insert their own depenses"
  ON public.depenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own depenses" ON public.depenses;
CREATE POLICY "Users can update their own depenses"
  ON public.depenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own depenses" ON public.depenses;
CREATE POLICY "Users can delete their own depenses"
  ON public.depenses FOR DELETE
  USING (auth.uid() = user_id);

