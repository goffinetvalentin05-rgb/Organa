-- ============================================
-- RLS policies for expenses
-- ============================================

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

