-- ============================================
-- MIGRATION 027 : Revert Logos en bucket PUBLIC
-- ============================================
-- Décision pragmatique : les logos d'associations sportives ne sont pas des
-- données sensibles. Ils apparaissent déjà sur :
--   - les factures et devis émis (PDF distribués aux tiers)
--   - le site public du club
--   - les emails sortants
-- Maintenir ce bucket en privé créait des liens morts (URLs signées 7j) dans
-- toutes les pages affichant le logo, sans bénéfice de sécurité réel.
--
-- Le bucket "expenses" reste, lui, strictement PRIVÉ (vraies données financières).
--
-- Cette migration :
--   1. Bascule "Logos" en public.
--   2. Supprime les policies RLS personnalisées (Logos_*) sur storage.objects
--      qui imposaient is_club_member (incompatible avec un bucket public).
--   3. Garde les contraintes physiques (file_size_limit, mime types).
--
-- IDEMPOTENT et DÉFENSIVE.
-- ============================================

-- ============================================
-- 1) Repasser le bucket "Logos" en public
-- ============================================
DO $$
BEGIN
  UPDATE storage.buckets
  SET public = true
  WHERE id = 'Logos';
  RAISE NOTICE '✓ Bucket Logos basculé en public';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Privilèges insuffisants pour modifier storage.buckets';
    RAISE NOTICE '⚠ ACTION MANUELLE : Dashboard > Storage > "Logos" > Settings : Public bucket = ON';
END $$;

-- ============================================
-- 2) Supprimer les policies RLS Logos_* posées par la 025
-- ============================================
-- Un bucket public expose ses objets en lecture sans passer par RLS, donc les
-- policies SELECT restrictives sont obsolètes. On nettoie tout.
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Logos_select_member" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Logos_insert_staff"  ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Logos_update_staff"  ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Logos_delete_staff"  ON storage.objects';

  -- Repose des policies INSERT/UPDATE/DELETE restreintes au staff du club
  -- (lecture publique mais écriture toujours scopée).
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

  RAISE NOTICE '✓ Policies Logos : SELECT publique, INSERT/UPDATE/DELETE staff';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Privilèges insuffisants pour modifier les policies storage.objects';
    RAISE NOTICE '⚠ ACTION MANUELLE : Dashboard > Storage > Policies > Logos';
    RAISE NOTICE '⚠   1. Supprimer "Logos_select_member"';
    RAISE NOTICE '⚠   2. Garder INSERT/UPDATE/DELETE restreints au staff';
END $$;

-- ============================================
-- 3) Nettoyage : la fonction storage_path_club_id reste utile pour expenses
-- ============================================
-- Pas de DROP, on la conserve.

DO $$ BEGIN RAISE NOTICE '✓ Migration 027 OK — Logos en public, expenses reste privé'; END $$;
