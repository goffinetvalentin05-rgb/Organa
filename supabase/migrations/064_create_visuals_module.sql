-- ============================================
-- MIGRATION 064 : Module Visuels
-- ============================================
-- Designs enregistrés par club (templates fixes, data_json).
-- Images dans le bucket visual-assets (chemin = club_id/...).
-- RLS : lecture membre, écriture staff.
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.club_visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('match_poster', 'match_result', 'club_event')),
  format TEXT NOT NULL
    CHECK (format IN ('story', 'square')),
  title TEXT NOT NULL,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_club_visuals_club_updated
  ON public.club_visuals (club_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_visuals_club_type
  ON public.club_visuals (club_id, type);

ALTER TABLE public.club_visuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_visuals_select_member ON public.club_visuals;
CREATE POLICY club_visuals_select_member
  ON public.club_visuals FOR SELECT
  USING (public.is_club_member(club_id));

DROP POLICY IF EXISTS club_visuals_insert_staff ON public.club_visuals;
CREATE POLICY club_visuals_insert_staff
  ON public.club_visuals FOR INSERT
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS club_visuals_update_staff ON public.club_visuals;
CREATE POLICY club_visuals_update_staff
  ON public.club_visuals FOR UPDATE
  USING (public.is_club_staff(club_id))
  WITH CHECK (public.is_club_staff(club_id));

DROP POLICY IF EXISTS club_visuals_delete_staff ON public.club_visuals;
CREATE POLICY club_visuals_delete_staff
  ON public.club_visuals FOR DELETE
  USING (public.is_club_staff(club_id));

-- Bucket images de visuels (public lecture : export PNG + preview)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'visual-assets',
    'visual-assets',
    true,
    8388608,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  )
  ON CONFLICT (id) DO UPDATE
  SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
  RAISE NOTICE '✓ Bucket visual-assets';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Créer le bucket visual-assets manuellement (public, images, max 8 Mo)';
END $$;

DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "visual_assets_select_public" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "visual_assets_insert_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "visual_assets_update_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "visual_assets_delete_staff" ON storage.objects';

  EXECUTE $sql$
    CREATE POLICY "visual_assets_select_public"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'visual-assets')
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "visual_assets_insert_staff"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'visual-assets'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "visual_assets_update_staff"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'visual-assets'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
      WITH CHECK (
        bucket_id = 'visual-assets'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "visual_assets_delete_staff"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'visual-assets'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Policies storage visual-assets : à créer manuellement';
END $$;

SELECT 'Migration 064_create_visuals_module terminée' AS status;
