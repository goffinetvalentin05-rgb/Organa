-- ============================================
-- MIGRATION 033 : Champs membres configurables par club + AVS / date de naissance
-- ============================================
-- club_id = UUID du compte owner (convention existante, cf. migration 020).
-- Pas de ligne en base = l'appli applique les valeurs par défaut (code).
-- ============================================

-- 1) Colonnes membres (clients)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avs_number TEXT;

COMMENT ON COLUMN public.clients.date_of_birth IS 'Date de naissance du membre (optionnel)';
COMMENT ON COLUMN public.clients.avs_number IS 'Numéro AVS / AHV (donnée sensible, optionnel)';

-- 2) Table de configuration des champs affichés / saisis par club
CREATE TABLE IF NOT EXISTS public.club_member_field_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT club_member_field_settings_club_field UNIQUE (club_id, field_key),
  CONSTRAINT club_member_field_settings_key_check CHECK (
    field_key IN (
      'email',
      'phone',
      'address',
      'birth_date',
      'category',
      'role',
      'avs_number'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_club_member_field_settings_club
  ON public.club_member_field_settings(club_id);

DROP TRIGGER IF EXISTS update_club_member_field_settings_updated_at
  ON public.club_member_field_settings;
CREATE TRIGGER update_club_member_field_settings_updated_at
  BEFORE UPDATE ON public.club_member_field_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.club_member_field_settings IS
  'Champs membres activés par club (email, téléphone, adresse, etc.). Vide = défauts applicatifs.';

-- 3) RLS
ALTER TABLE public.club_member_field_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_member_field_settings_select_member
  ON public.club_member_field_settings;
CREATE POLICY club_member_field_settings_select_member
  ON public.club_member_field_settings FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS club_member_field_settings_insert_admin
  ON public.club_member_field_settings;
CREATE POLICY club_member_field_settings_insert_admin
  ON public.club_member_field_settings FOR INSERT
  WITH CHECK (public.is_club_admin(club_id));

DROP POLICY IF EXISTS club_member_field_settings_update_admin
  ON public.club_member_field_settings;
CREATE POLICY club_member_field_settings_update_admin
  ON public.club_member_field_settings FOR UPDATE
  USING (public.is_club_admin(club_id))
  WITH CHECK (public.is_club_admin(club_id));

DROP POLICY IF EXISTS club_member_field_settings_delete_admin
  ON public.club_member_field_settings;
CREATE POLICY club_member_field_settings_delete_admin
  ON public.club_member_field_settings FOR DELETE
  USING (public.is_club_admin(club_id));

DO $$ BEGIN RAISE NOTICE 'Migration 033 OK — club_member_field_settings + clients.date_of_birth / avs_number'; END $$;
