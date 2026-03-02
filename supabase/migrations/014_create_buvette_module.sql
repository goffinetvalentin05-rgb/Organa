-- ============================================
-- MIGRATION : Module Réservation de buvette
-- ============================================
-- Cette migration crée :
-- 1) slug public de club (profiles.buvette_slug)
-- 2) disponibilités/indisponibilités buvette
-- 3) demandes externes de réservation
-- 4) index et policies RLS
-- ============================================

-- 1) Slug public sur profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'buvette_slug'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN buvette_slug TEXT;
    RAISE NOTICE '✓ Colonne profiles.buvette_slug ajoutée';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_buvette_slug_unique
  ON public.profiles (buvette_slug)
  WHERE buvette_slug IS NOT NULL;

-- 2) Table des indisponibilités (blocages internes + réservations validées)
CREATE TABLE IF NOT EXISTS public.buvette_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('blocked', 'reserved', 'pending')),
  source TEXT NOT NULL CHECK (source IN ('admin', 'external')),
  reason TEXT,
  request_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_buvette_slots_user_date_unique
  ON public.buvette_slots(user_id, slot_date);

CREATE INDEX IF NOT EXISTS idx_buvette_slots_user_date
  ON public.buvette_slots(user_id, slot_date);

-- 3) Table des demandes publiques
CREATE TABLE IF NOT EXISTS public.buvette_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event_type TEXT NOT NULL,
  message TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buvette_requests_user_date
  ON public.buvette_requests(user_id, reservation_date);

CREATE INDEX IF NOT EXISTS idx_buvette_requests_user_status
  ON public.buvette_requests(user_id, status);

-- FK logique request -> slot (ajoutée uniquement si absente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'buvette_slots'
      AND constraint_name = 'buvette_slots_request_id_fkey'
  ) THEN
    ALTER TABLE public.buvette_slots
      ADD CONSTRAINT buvette_slots_request_id_fkey
      FOREIGN KEY (request_id) REFERENCES public.buvette_requests(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Trigger updated_at partagé
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_buvette_slots_updated_at ON public.buvette_slots;
CREATE TRIGGER update_buvette_slots_updated_at
  BEFORE UPDATE ON public.buvette_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_buvette_requests_updated_at ON public.buvette_requests;
CREATE TRIGGER update_buvette_requests_updated_at
  BEFORE UPDATE ON public.buvette_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5) RLS
ALTER TABLE public.buvette_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buvette_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own buvette slots" ON public.buvette_slots;
CREATE POLICY "Users can view their own buvette slots"
  ON public.buvette_slots FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own buvette slots" ON public.buvette_slots;
CREATE POLICY "Users can insert their own buvette slots"
  ON public.buvette_slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own buvette slots" ON public.buvette_slots;
CREATE POLICY "Users can update their own buvette slots"
  ON public.buvette_slots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own buvette slots" ON public.buvette_slots;
CREATE POLICY "Users can delete their own buvette slots"
  ON public.buvette_slots FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own buvette requests" ON public.buvette_requests;
CREATE POLICY "Users can view their own buvette requests"
  ON public.buvette_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own buvette requests" ON public.buvette_requests;
CREATE POLICY "Users can insert their own buvette requests"
  ON public.buvette_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own buvette requests" ON public.buvette_requests;
CREATE POLICY "Users can update their own buvette requests"
  ON public.buvette_requests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own buvette requests" ON public.buvette_requests;
CREATE POLICY "Users can delete their own buvette requests"
  ON public.buvette_requests FOR DELETE
  USING (auth.uid() = user_id);

SELECT 'Migration 014_create_buvette_module terminée avec succès' AS status;
