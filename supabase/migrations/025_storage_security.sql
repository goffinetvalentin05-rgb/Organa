-- ============================================
-- MIGRATION 025 : Sécurité Storage (buckets privés + RLS strictes)
-- ============================================
-- Tous les buckets utilisés par l'application doivent être PRIVÉS et
-- accessibles uniquement via URL signée (createSignedUrl côté serveur)
-- ou via les policies RLS sur storage.objects.
--
-- Convention de nommage des fichiers :
--   <bucket>/<club_id>/<...>
--   Exemple : Logos/<user_id>/logo-1700000000.png
--             expenses/<user_id>/1700000000-facture.pdf
--
-- La première partie du chemin = club_id. RLS vérifie l'appartenance.
--
-- IDEMPOTENT et DÉFENSIVE :
--   - Wrappe les opérations sur storage.* dans des EXCEPTION handlers,
--     car certains projets Supabase restreignent l'écriture sur ces tables
--     (insufficient_privilege). Dans ce cas, fallback Dashboard décrit en fin.
-- ============================================

-- ============================================
-- 1) Helper : extraire le club_id depuis le chemin (1ère partie)
-- ============================================
-- (Créé en premier car utilisé par les policies plus bas.)
CREATE OR REPLACE FUNCTION public.storage_path_club_id(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_first TEXT;
BEGIN
  IF p_name IS NULL THEN RETURN NULL; END IF;
  v_first := split_part(p_name, '/', 1);
  IF v_first ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    RETURN v_first::uuid;
  END IF;
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.storage_path_club_id(TEXT) TO anon, authenticated, service_role;

-- ============================================
-- 2) Forcer les buckets en mode privé
-- ============================================
-- Si l'INSERT échoue (insufficient_privilege), il faut créer / basculer
-- les buckets en privé manuellement depuis le Dashboard Supabase :
--    Storage > <bucket> > Settings > Public bucket = OFF
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('Logos',    'Logos',    false, 5242880,  ARRAY['image/png','image/jpeg','image/jpg','image/svg+xml','image/webp']),
    ('expenses', 'expenses', false, 10485760, NULL)
  ON CONFLICT (id) DO UPDATE
  SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

  RAISE NOTICE '✓ Buckets Logos/expenses créés/forcés en privé';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Privilèges insuffisants pour modifier storage.buckets';
    RAISE NOTICE '⚠ ACTION MANUELLE : ouvrir le Dashboard Supabase >';
    RAISE NOTICE '⚠   Storage > "Logos"    > Settings : Public bucket = OFF';
    RAISE NOTICE '⚠   Storage > "expenses" > Settings : Public bucket = OFF';
END $$;

-- ============================================
-- 3) Policies RLS pour bucket "Logos"
-- ============================================
-- Note : RLS est déjà activé sur storage.objects par défaut chez Supabase.
-- Si la création de policies échoue (insufficient_privilege), il faut les
-- créer manuellement depuis le Dashboard : Storage > Policies.
DO $$
BEGIN
  -- Drop des éventuelles anciennes policies (recréation idempotente)
  EXECUTE 'DROP POLICY IF EXISTS "Logos_select_member" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Logos_insert_staff"  ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Logos_update_staff"  ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Logos_delete_staff"  ON storage.objects';
  -- Anciens noms historiques potentiels
  EXECUTE 'DROP POLICY IF EXISTS "Public Access"       ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Logos public read"   ON storage.objects';

  EXECUTE $sql$
    CREATE POLICY "Logos_select_member"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'Logos'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_member(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "Logos_insert_staff"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'Logos'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "Logos_update_staff"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'Logos'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
      WITH CHECK (
        bucket_id = 'Logos'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "Logos_delete_staff"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'Logos'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  RAISE NOTICE '✓ Policies storage Logos créées';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Privilèges insuffisants pour créer les policies sur storage.objects (Logos)';
    RAISE NOTICE '⚠ ACTION MANUELLE : créer les 4 policies via Dashboard > Storage > Policies > Logos';
END $$;

-- ============================================
-- 4) Policies RLS pour bucket "expenses"
-- ============================================
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "expenses_select_member" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_insert_staff"  ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_update_staff"  ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_delete_staff"  ON storage.objects';

  EXECUTE $sql$
    CREATE POLICY "expenses_select_member"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_member(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_insert_staff"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_update_staff"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
      WITH CHECK (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_delete_staff"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  RAISE NOTICE '✓ Policies storage expenses créées';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Privilèges insuffisants pour créer les policies sur storage.objects (expenses)';
    RAISE NOTICE '⚠ ACTION MANUELLE : créer les 4 policies via Dashboard > Storage > Policies > expenses';
END $$;

DO $$ BEGIN RAISE NOTICE '✓ Migration 025 OK — buckets Logos/expenses sécurisés (vérifier les NOTICE éventuels)'; END $$;
