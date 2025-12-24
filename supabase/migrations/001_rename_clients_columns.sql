-- ============================================
-- MIGRATION : Alignement des colonnes clients
-- ============================================
-- 
-- Objectif : Renommer les colonnes anglaises en français
-- De : name, phone, address
-- Vers : nom, telephone, adresse
-- 
-- IMPORTANT : 
-- 1. Exécuter ce script dans l'éditeur SQL de Supabase
-- 2. URL : https://supabase.com/dashboard/project/_/sql
-- 3. Vérifier le résultat avant de continuer
-- ============================================

DO $$
BEGIN
  -- ============================================
  -- ÉTAPE 1 : Renommer 'name' en 'nom'
  -- ============================================
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'clients' 
    AND column_name = 'name'
  ) THEN
    -- Vérifier si 'nom' existe déjà
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'clients' 
      AND column_name = 'nom'
    ) THEN
      ALTER TABLE public.clients RENAME COLUMN name TO nom;
      RAISE NOTICE '✓ Colonne name renommée en nom';
    ELSE
      RAISE NOTICE '⚠ Colonne nom existe déjà, migration de name vers nom ignorée';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ Colonne name n''existe pas, aucune action nécessaire';
  END IF;

  -- ============================================
  -- ÉTAPE 2 : Renommer 'phone' en 'telephone'
  -- ============================================
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'clients' 
    AND column_name = 'phone'
  ) THEN
    -- Vérifier si 'telephone' existe déjà
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'clients' 
      AND column_name = 'telephone'
    ) THEN
      ALTER TABLE public.clients RENAME COLUMN phone TO telephone;
      RAISE NOTICE '✓ Colonne phone renommée en telephone';
    ELSE
      RAISE NOTICE '⚠ Colonne telephone existe déjà, migration de phone vers telephone ignorée';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ Colonne phone n''existe pas, aucune action nécessaire';
  END IF;

  -- ============================================
  -- ÉTAPE 3 : Renommer 'address' en 'adresse'
  -- ============================================
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'clients' 
    AND column_name = 'address'
  ) THEN
    -- Vérifier si 'adresse' existe déjà
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'clients' 
      AND column_name = 'adresse'
    ) THEN
      ALTER TABLE public.clients RENAME COLUMN address TO adresse;
      RAISE NOTICE '✓ Colonne address renommée en adresse';
    ELSE
      RAISE NOTICE '⚠ Colonne adresse existe déjà, migration de address vers adresse ignorée';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ Colonne address n''existe pas, aucune action nécessaire';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VÉRIFICATION : Afficher le schéma final
-- ============================================
SELECT 
  column_name AS "Colonne",
  data_type AS "Type",
  is_nullable AS "Nullable",
  column_default AS "Valeur par défaut"
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- ============================================
-- RÉSULTAT ATTENDU :
-- ============================================
-- Colonnes attendues :
-- - id (uuid)
-- - nom (text/varchar) ← doit exister
-- - email (text/varchar)
-- - telephone (text/varchar) ← doit exister
-- - adresse (text/varchar) ← doit exister
-- - user_id (uuid)
-- - created_at (timestamp)
-- - updated_at (timestamp)
-- ============================================
