-- ============================================
-- MIGRATION : Création de la table email_history
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr',
  related_type TEXT NOT NULL DEFAULT 'dashboard' CHECK (related_type IN ('dashboard', 'client', 'facture', 'devis')),
  related_id UUID NULL,
  client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_history_user_id ON public.email_history(user_id);
CREATE INDEX IF NOT EXISTS idx_email_history_related ON public.email_history(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_email_history_client_id ON public.email_history(client_id);

ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own email history" ON public.email_history;
CREATE POLICY "Users can view their own email history"
  ON public.email_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own email history" ON public.email_history;
CREATE POLICY "Users can insert their own email history"
  ON public.email_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own email history" ON public.email_history;
CREATE POLICY "Users can delete their own email history"
  ON public.email_history FOR DELETE
  USING (auth.uid() = user_id);

