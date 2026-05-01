-- ============================================
-- MIGRATION 024 : Verrouillage des tables legacy non utilisées par le code
-- ============================================
-- Le fichier supabase/schema.sql historique a créé des tables qui ne sont
-- PAS utilisées par le code Next.js actuel :
--   - organizations
--   - devis, devis_lignes
--   - factures, factures_lignes
--   - evenements_calendrier
--
-- Le code actuel utilise plutôt :
--   - profiles (à la place de organizations)
--   - documents (à la place de devis/factures)
--   - events (à la place de evenements_calendrier)
--
-- On ne peut pas DROP ces tables sans risque (données potentielles), donc
-- on applique une politique RLS "deny all" sur la base : seul le service_role
-- peut y accéder pour migration éventuelle. Les RLS existantes basées sur
-- "organizations.user_id = auth.uid()" qui datent du schema.sql sont
-- supprimées d'abord.
--
-- IDEMPOTENT.
-- ============================================

DO $$
DECLARE
  t TEXT;
  legacy_tables TEXT[] := ARRAY[
    'organizations',
    'devis',
    'devis_lignes',
    'factures',
    'factures_lignes',
    'evenements_calendrier'
  ];
BEGIN
  FOREACH t IN ARRAY legacy_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE '⊘ Legacy table % absente, skip', t;
      CONTINUE;
    END IF;

    -- Activer RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Supprimer toutes les anciennes policies (boucle DO sur pg_policies)
    DECLARE
      pol RECORD;
    BEGIN
      FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
      END LOOP;
    END;

    -- Policy "deny all" : aucune row visible/insérable/modifiable/supprimable
    -- depuis le rôle authenticated. Seul service_role bypasse.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (false)',
      'legacy_lock_select_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (false)',
      'legacy_lock_insert_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (false) WITH CHECK (false)',
      'legacy_lock_update_' || t, t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (false)',
      'legacy_lock_delete_' || t, t
    );

    EXECUTE format(
      'COMMENT ON TABLE public.%I IS ''⚠ LEGACY (schema.sql historique) - non utilisée par le code applicatif. RLS deny-all activée. À supprimer après vérification qu''''aucune donnée critique n''''y réside.''',
      t
    );

    RAISE NOTICE '✓ Legacy table % verrouillée (RLS deny-all)', t;
  END LOOP;
END $$;

DO $$ BEGIN RAISE NOTICE '✓ Migration 024 OK — legacy tables verrouillées'; END $$;
