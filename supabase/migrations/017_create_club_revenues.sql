-- ============================================
-- Revenus simples du club (buvette, entrées, etc.)
-- Liés optionnellement à un événement
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.club_revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  revenue_date DATE NOT NULL,
  description TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_revenues_user_id ON public.club_revenues(user_id);
CREATE INDEX IF NOT EXISTS idx_club_revenues_event_id ON public.club_revenues(event_id);
CREATE INDEX IF NOT EXISTS idx_club_revenues_revenue_date ON public.club_revenues(revenue_date DESC);

DROP TRIGGER IF EXISTS update_club_revenues_updated_at ON public.club_revenues;
CREATE TRIGGER update_club_revenues_updated_at
  BEFORE UPDATE ON public.club_revenues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.club_revenues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own club_revenues" ON public.club_revenues;
CREATE POLICY "Users can view their own club_revenues"
  ON public.club_revenues FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own club_revenues" ON public.club_revenues;
CREATE POLICY "Users can insert their own club_revenues"
  ON public.club_revenues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own club_revenues" ON public.club_revenues;
CREATE POLICY "Users can update their own club_revenues"
  ON public.club_revenues FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own club_revenues" ON public.club_revenues;
CREATE POLICY "Users can delete their own club_revenues"
  ON public.club_revenues FOR DELETE
  USING (auth.uid() = user_id);

SELECT 'Migration 017_create_club_revenues terminée' AS status;
