-- ============================================
-- MIGRATION : Système de Planning & Affectations
-- ============================================
-- 
-- Cette migration crée :
-- 1. Table plannings : plannings (liés ou non à un événement)
-- 2. Table planning_slots : créneaux horaires avec lieu/rôle
-- 3. Table planning_assignments : affectations des membres aux créneaux
-- 4. Politiques RLS pour la sécurité
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ÉTAPE 1 : Table des plannings
-- ============================================
-- Un planning peut être lié à un événement ou être standalone
CREATE TABLE IF NOT EXISTS public.plannings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plannings_user_id ON public.plannings(user_id);
CREATE INDEX IF NOT EXISTS idx_plannings_event_id ON public.plannings(event_id);
CREATE INDEX IF NOT EXISTS idx_plannings_date ON public.plannings(date);
CREATE INDEX IF NOT EXISTS idx_plannings_status ON public.plannings(status);

-- ============================================
-- ÉTAPE 2 : Table des créneaux horaires
-- ============================================
-- Chaque créneau a un lieu/rôle, des horaires et un nombre de personnes requises
CREATE TABLE IF NOT EXISTS public.planning_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planning_id UUID NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  location TEXT NOT NULL, -- Ex: "Bar", "Entrée", "Cuisine"
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  required_people INTEGER NOT NULL DEFAULT 1 CHECK (required_people >= 1),
  notes TEXT,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_planning_slots_planning_id ON public.planning_slots(planning_id);
CREATE INDEX IF NOT EXISTS idx_planning_slots_start_time ON public.planning_slots(start_time);

-- ============================================
-- ÉTAPE 3 : Table des affectations
-- ============================================
-- Lie un membre (client) à un créneau
CREATE TABLE IF NOT EXISTS public.planning_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES public.planning_slots(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ, -- Date d'envoi de la notification email
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slot_id, client_id) -- Un membre ne peut être assigné qu'une fois par créneau
);

CREATE INDEX IF NOT EXISTS idx_planning_assignments_slot_id ON public.planning_assignments(slot_id);
CREATE INDEX IF NOT EXISTS idx_planning_assignments_client_id ON public.planning_assignments(client_id);

-- ============================================
-- ÉTAPE 4 : Triggers pour updated_at
-- ============================================
-- Réutilise la fonction update_updated_at_column créée dans migration 011

DROP TRIGGER IF EXISTS update_plannings_updated_at ON public.plannings;
CREATE TRIGGER update_plannings_updated_at
  BEFORE UPDATE ON public.plannings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_planning_slots_updated_at ON public.planning_slots;
CREATE TRIGGER update_planning_slots_updated_at
  BEFORE UPDATE ON public.planning_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 5 : Activer RLS
-- ============================================
ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6 : Politiques RLS pour plannings
-- ============================================
DROP POLICY IF EXISTS "Users can view their own plannings" ON public.plannings;
CREATE POLICY "Users can view their own plannings"
  ON public.plannings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own plannings" ON public.plannings;
CREATE POLICY "Users can insert their own plannings"
  ON public.plannings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own plannings" ON public.plannings;
CREATE POLICY "Users can update their own plannings"
  ON public.plannings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own plannings" ON public.plannings;
CREATE POLICY "Users can delete their own plannings"
  ON public.plannings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ÉTAPE 7 : Politiques RLS pour planning_slots
-- ============================================
DROP POLICY IF EXISTS "Users can view slots from their plannings" ON public.planning_slots;
CREATE POLICY "Users can view slots from their plannings"
  ON public.planning_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plannings
      WHERE plannings.id = planning_slots.planning_id
      AND plannings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert slots in their plannings" ON public.planning_slots;
CREATE POLICY "Users can insert slots in their plannings"
  ON public.planning_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plannings
      WHERE plannings.id = planning_slots.planning_id
      AND plannings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update slots in their plannings" ON public.planning_slots;
CREATE POLICY "Users can update slots in their plannings"
  ON public.planning_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.plannings
      WHERE plannings.id = planning_slots.planning_id
      AND plannings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete slots in their plannings" ON public.planning_slots;
CREATE POLICY "Users can delete slots in their plannings"
  ON public.planning_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.plannings
      WHERE plannings.id = planning_slots.planning_id
      AND plannings.user_id = auth.uid()
    )
  );

-- ============================================
-- ÉTAPE 8 : Politiques RLS pour planning_assignments
-- ============================================
DROP POLICY IF EXISTS "Users can view assignments from their plannings" ON public.planning_assignments;
CREATE POLICY "Users can view assignments from their plannings"
  ON public.planning_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.planning_slots
      JOIN public.plannings ON plannings.id = planning_slots.planning_id
      WHERE planning_slots.id = planning_assignments.slot_id
      AND plannings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert assignments in their plannings" ON public.planning_assignments;
CREATE POLICY "Users can insert assignments in their plannings"
  ON public.planning_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.planning_slots
      JOIN public.plannings ON plannings.id = planning_slots.planning_id
      WHERE planning_slots.id = planning_assignments.slot_id
      AND plannings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update assignments in their plannings" ON public.planning_assignments;
CREATE POLICY "Users can update assignments in their plannings"
  ON public.planning_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.planning_slots
      JOIN public.plannings ON plannings.id = planning_slots.planning_id
      WHERE planning_slots.id = planning_assignments.slot_id
      AND plannings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete assignments in their plannings" ON public.planning_assignments;
CREATE POLICY "Users can delete assignments in their plannings"
  ON public.planning_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.planning_slots
      JOIN public.plannings ON plannings.id = planning_slots.planning_id
      WHERE planning_slots.id = planning_assignments.slot_id
      AND plannings.user_id = auth.uid()
    )
  );

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT 'Migration 012_create_planning_tables terminée avec succès' AS status;
