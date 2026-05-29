-- ============================================
-- MIGRATION 044 : Page publique du club
-- ============================================
-- Colonnes de configuration sur profiles + suivi des annonces vues.
-- IDEMPOTENT.
-- ============================================

-- Colonnes page publique sur profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_enabled'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_enabled BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '✓ profiles.public_page_enabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_slug'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_slug TEXT;
    RAISE NOTICE '✓ profiles.public_page_slug';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_title'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_title TEXT;
    RAISE NOTICE '✓ profiles.public_page_title';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_description'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_description TEXT;
    RAISE NOTICE '✓ profiles.public_page_description';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_primary_color'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_primary_color TEXT;
    RAISE NOTICE '✓ profiles.public_page_primary_color';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_instagram_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_instagram_url TEXT;
    RAISE NOTICE '✓ profiles.public_page_instagram_url';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_facebook_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_facebook_url TEXT;
    RAISE NOTICE '✓ profiles.public_page_facebook_url';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_website_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_website_url TEXT;
    RAISE NOTICE '✓ profiles.public_page_website_url';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_contact_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_contact_url TEXT;
    RAISE NOTICE '✓ profiles.public_page_contact_url';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_show_buvette'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_show_buvette BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE '✓ profiles.public_page_show_buvette';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_show_matches'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_show_matches BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE '✓ profiles.public_page_show_matches';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_show_contact'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_show_contact BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE '✓ profiles.public_page_show_contact';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_page_slug_unique
  ON public.profiles (public_page_slug)
  WHERE public_page_slug IS NOT NULL;

-- Table suivi annonces fonctionnalités vues (par utilisateur + club)
CREATE TABLE IF NOT EXISTS public.feature_announcements_seen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_key TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feature_announcements_seen_unique UNIQUE (user_id, club_id, announcement_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_announcements_seen_user_club
  ON public.feature_announcements_seen (user_id, club_id);

ALTER TABLE public.feature_announcements_seen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_announcements_seen_select_own ON public.feature_announcements_seen;
CREATE POLICY feature_announcements_seen_select_own
  ON public.feature_announcements_seen
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS feature_announcements_seen_insert_own ON public.feature_announcements_seen;
CREATE POLICY feature_announcements_seen_insert_own
  ON public.feature_announcements_seen
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.feature_announcements_seen IS
  'Annonces produit vues par utilisateur et club (évite réaffichage).';

DO $$ BEGIN RAISE NOTICE '✓ Migration 044 OK — page publique club'; END $$;
