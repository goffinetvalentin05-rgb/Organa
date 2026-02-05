-- ============================================
-- MIGRATION : Gestion des événements avec aperçu financier
-- ============================================
-- 
-- Cette migration crée :
-- 1. Table event_types : types d'événements personnalisables
-- 2. Table events : événements du club
-- 3. Colonne event_id dans documents et expenses
-- 4. Politiques RLS pour la sécurité
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ÉTAPE 1 : Table des types d'événements
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_types_user_id ON public.event_types(user_id);

-- ============================================
-- ÉTAPE 2 : Table des événements
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON public.events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- ============================================
-- ÉTAPE 3 : Trigger pour updated_at sur events
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 4 : Ajouter event_id aux documents
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_documents_event_id ON public.documents(event_id);
    RAISE NOTICE '✓ Colonne event_id ajoutée à documents';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : Ajouter event_id aux expenses
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses' 
    AND column_name = 'event_id'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON public.expenses(event_id);
    RAISE NOTICE '✓ Colonne event_id ajoutée à expenses';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 6 : Activer RLS
-- ============================================
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 7 : Politiques RLS pour event_types
-- ============================================
DROP POLICY IF EXISTS "Users can view their own event_types" ON public.event_types;
CREATE POLICY "Users can view their own event_types"
  ON public.event_types FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own event_types" ON public.event_types;
CREATE POLICY "Users can insert their own event_types"
  ON public.event_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own event_types" ON public.event_types;
CREATE POLICY "Users can update their own event_types"
  ON public.event_types FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own event_types" ON public.event_types;
CREATE POLICY "Users can delete their own event_types"
  ON public.event_types FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 8 : Politiques RLS pour events
-- ============================================
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
CREATE POLICY "Users can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
CREATE POLICY "Users can insert their own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT 'Migration 011_create_events_tables terminée avec succès' AS status;
