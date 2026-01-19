-- ============================================
-- RLS policies for expenses
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'a_payer' CHECK (status IN ('a_payer', 'paye')),
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their expenses" ON public.expenses;
CREATE POLICY "Users can read their expenses"
  ON public.expenses
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their expenses" ON public.expenses;
CREATE POLICY "Users can insert their expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their expenses" ON public.expenses;
CREATE POLICY "Users can update their expenses"
  ON public.expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their expenses" ON public.expenses;
CREATE POLICY "Users can delete their expenses"
  ON public.expenses
  FOR DELETE
  USING (auth.uid() = user_id);

