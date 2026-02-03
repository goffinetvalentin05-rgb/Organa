-- ============================================
-- MIGRATION : Création de la table documents
-- ============================================
-- 
-- Objectif : Créer la table public.documents avec toutes les colonnes nécessaires
-- pour les devis et factures.
-- 
-- IMPORTANT : Cette migration est IDEMPOTENTE
-- 1. Exécuter ce script dans l'éditeur SQL de Supabase
-- 2. URL : https://supabase.com/dashboard/project/_/sql
-- 3. Vérifier le résultat avant de continuer
-- ============================================

-- Extension pour générer des UUIDs (si pas déjà fait)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ÉTAPE 1 : Créer la table documents si elle n'existe pas
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quote', 'invoice')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  date_creation DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  date_paiement DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_ht NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_tva NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_ttc NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT,
  notes TEXT,
  numero TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 2 : Ajouter les colonnes manquantes si la table existe déjà
-- ============================================
DO $$
BEGIN
  -- Ajouter date_creation si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'date_creation'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN date_creation DATE NOT NULL DEFAULT CURRENT_DATE;
    RAISE NOTICE '✓ Colonne date_creation ajoutée';
  END IF;

  -- Ajouter date_echeance si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'date_echeance'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN date_echeance DATE;
    RAISE NOTICE '✓ Colonne date_echeance ajoutée';
  END IF;

  -- Ajouter date_paiement si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'date_paiement'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN date_paiement DATE;
    RAISE NOTICE '✓ Colonne date_paiement ajoutée';
  END IF;

  -- Ajouter items si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'items'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN items JSONB NOT NULL DEFAULT '[]'::jsonb;
    RAISE NOTICE '✓ Colonne items ajoutée';
  END IF;

  -- Ajouter total_ht si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'total_ht'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN total_ht NUMERIC(10, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE '✓ Colonne total_ht ajoutée';
  END IF;

  -- Ajouter total_tva si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'total_tva'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN total_tva NUMERIC(10, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE '✓ Colonne total_tva ajoutée';
  END IF;

  -- Ajouter total_ttc si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'total_ttc'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN total_ttc NUMERIC(10, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE '✓ Colonne total_ttc ajoutée';
  END IF;

  -- Ajouter status si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN status TEXT;
    RAISE NOTICE '✓ Colonne status ajoutée';
  END IF;

  -- Ajouter notes si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN notes TEXT;
    RAISE NOTICE '✓ Colonne notes ajoutée';
  END IF;

  -- Ajouter numero si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'numero'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN numero TEXT;
    RAISE NOTICE '✓ Colonne numero ajoutée';
  END IF;

  -- Ajouter updated_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✓ Colonne updated_at ajoutée';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : Créer les index pour améliorer les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

-- ============================================
-- ÉTAPE 4 : Créer le trigger pour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ÉTAPE 5 : Activer RLS (Row Level Security)
-- ============================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6 : Créer les policies RLS
-- ============================================

-- Policy pour SELECT : l'utilisateur peut voir ses propres documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

-- Policy pour INSERT : l'utilisateur peut créer ses propres documents
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy pour UPDATE : l'utilisateur peut modifier ses propres documents
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy pour DELETE : l'utilisateur peut supprimer ses propres documents
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

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
  AND table_name = 'documents'
ORDER BY ordinal_position;

-- ============================================
-- RÉSULTAT ATTENDU :
-- ============================================
-- Colonnes attendues :
-- - id (uuid) PRIMARY KEY
-- - user_id (uuid) NOT NULL → auth.users
-- - type (text) NOT NULL CHECK (type IN ('quote', 'invoice'))
-- - client_id (uuid) NULL → public.clients
-- - date_creation (date) NOT NULL DEFAULT CURRENT_DATE
-- - date_echeance (date) NULL
-- - date_paiement (date) NULL
-- - items (jsonb) NOT NULL DEFAULT '[]'
-- - total_ht (numeric) NOT NULL DEFAULT 0
-- - total_tva (numeric) NOT NULL DEFAULT 0
-- - total_ttc (numeric) NOT NULL DEFAULT 0
-- - status (text) NULL
-- - notes (text) NULL
-- - numero (text) NULL
-- - created_at (timestamptz) NOT NULL DEFAULT NOW()
-- - updated_at (timestamptz) NOT NULL DEFAULT NOW()
-- ============================================































