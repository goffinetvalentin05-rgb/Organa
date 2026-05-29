-- ============================================
-- MIGRATION 045 : Programme des matchs + liens publics
-- ============================================
-- IDEMPOTENT.
-- ============================================

-- Programme des matchs (remplace la logique événements internes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_show_match_program'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_show_match_program BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '✓ profiles.public_page_show_match_program';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_match_program_type'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_match_program_type TEXT;
    RAISE NOTICE '✓ profiles.public_page_match_program_type';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_match_program_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_match_program_url TEXT;
    RAISE NOTICE '✓ profiles.public_page_match_program_url';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_match_program_pdf_path'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_match_program_pdf_path TEXT;
    RAISE NOTICE '✓ profiles.public_page_match_program_pdf_path';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_match_program_pdf_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_match_program_pdf_name TEXT;
    RAISE NOTICE '✓ profiles.public_page_match_program_pdf_name';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_page_show_public_links'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_page_show_public_links BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE '✓ profiles.public_page_show_public_links';
  END IF;
END $$;

-- Contrainte type programme (nullable si bloc désactivé)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_public_page_match_program_type_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_public_page_match_program_type_check
      CHECK (
        public_page_match_program_type IS NULL
        OR public_page_match_program_type IN ('external_url', 'pdf')
      );
  END IF;
END $$;

-- Liens publics configurables (QR codes, buvette, custom…)
CREATE TABLE IF NOT EXISTS public.public_page_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom'
    CHECK (type IN ('qr_code', 'event', 'buvette', 'custom')),
  qrcode_id UUID REFERENCES public.qrcodes(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_page_links_club_id
  ON public.public_page_links (club_id);

CREATE INDEX IF NOT EXISTS idx_public_page_links_club_sort
  ON public.public_page_links (club_id, sort_order);

ALTER TABLE public.public_page_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_page_links_select_member ON public.public_page_links;
CREATE POLICY public_page_links_select_member
  ON public.public_page_links
  FOR SELECT
  TO authenticated
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS public_page_links_insert_staff ON public.public_page_links;
CREATE POLICY public_page_links_insert_staff
  ON public.public_page_links
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS public_page_links_update_staff ON public.public_page_links;
CREATE POLICY public_page_links_update_staff
  ON public.public_page_links
  FOR UPDATE
  TO authenticated
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS public_page_links_delete_staff ON public.public_page_links;
CREATE POLICY public_page_links_delete_staff
  ON public.public_page_links
  FOR DELETE
  TO authenticated
  USING (public.is_club_staff(club_id));

COMMENT ON TABLE public.public_page_links IS
  'Liens affichés sur la page publique du club (sélection manuelle ou depuis QR codes).';

-- Bucket Storage dédié aux PDF publics de page club (lecture publique)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'club-public',
    'club-public',
    true,
    10485760,
    ARRAY['application/pdf']
  )
  ON CONFLICT (id) DO UPDATE
  SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
  RAISE NOTICE '✓ Bucket club-public (PDF page publique)';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Créer le bucket club-public manuellement (public, PDF uniquement, max 10 Mo)';
END $$;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "club_public_select_anon" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "club_public_insert_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "club_public_update_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "club_public_delete_staff" ON storage.objects';

  EXECUTE $sql$
    CREATE POLICY "club_public_select_anon"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'club-public')
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "club_public_insert_staff"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'club-public'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "club_public_update_staff"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'club-public'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "club_public_delete_staff"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'club-public'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  RAISE NOTICE '✓ Policies storage club-public';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Policies storage club-public à créer manuellement dans le Dashboard';
END $$;

DO $$ BEGIN RAISE NOTICE '✓ Migration 045 OK'; END $$;
