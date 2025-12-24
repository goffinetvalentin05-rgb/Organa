-- Migration complète pour garantir toutes les colonnes nécessaires dans profiles
-- Cette migration est idempotente et peut être exécutée plusieurs fois sans erreur
-- Date: 2025-01-XX

-- ============================================
-- ÉTAPE 1 : Vérifier et créer la table profiles si elle n'existe pas
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÉTAPE 2 : Ajouter toutes les colonnes nécessaires avec valeurs par défaut
-- ============================================

-- Colonne plan (pour les abonnements)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'plan'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
        RAISE NOTICE '✓ Colonne plan ajoutée';
    END IF;
END $$;

-- Colonnes entreprise
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
        RAISE NOTICE '✓ Colonne company_name ajoutée';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_email TEXT;
        RAISE NOTICE '✓ Colonne company_email ajoutée';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_phone TEXT;
        RAISE NOTICE '✓ Colonne company_phone ajoutée';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_address TEXT;
        RAISE NOTICE '✓ Colonne company_address ajoutée';
    END IF;
END $$;

-- Colonnes logo
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'logo_path'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN logo_path TEXT;
        RAISE NOTICE '✓ Colonne logo_path ajoutée';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN logo_url TEXT;
        RAISE NOTICE '✓ Colonne logo_url ajoutée';
    END IF;
END $$;

-- Colonnes marque (couleur et devise)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'primary_color'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN primary_color TEXT DEFAULT '#6D5EF8';
        -- Mettre à jour les lignes existantes avec la valeur par défaut
        UPDATE public.profiles SET primary_color = '#6D5EF8' WHERE primary_color IS NULL;
        RAISE NOTICE '✓ Colonne primary_color ajoutée';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN currency TEXT DEFAULT 'CHF';
        -- Mettre à jour les lignes existantes avec la valeur par défaut
        UPDATE public.profiles SET currency = 'CHF' WHERE currency IS NULL;
        RAISE NOTICE '✓ Colonne currency ajoutée';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'currency_symbol'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN currency_symbol TEXT;
        -- Mettre à jour les lignes existantes avec le symbole basé sur currency
        UPDATE public.profiles 
        SET currency_symbol = CASE 
            WHEN currency = 'CHF' THEN 'CHF'
            WHEN currency = 'EUR' THEN '€'
            WHEN currency = 'USD' THEN '$'
            WHEN currency = 'GBP' THEN '£'
            WHEN currency = 'CAD' THEN 'C$'
            WHEN currency = 'AUD' THEN 'A$'
            WHEN currency = 'JPY' THEN '¥'
            ELSE 'CHF'
        END
        WHERE currency_symbol IS NULL;
        RAISE NOTICE '✓ Colonne currency_symbol ajoutée';
    END IF;
END $$;

-- Colonne updated_at si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE '✓ Colonne updated_at ajoutée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : Créer ou mettre à jour le trigger pour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON public.profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- ÉTAPE 4 : Ajouter les commentaires pour documentation
-- ============================================
COMMENT ON TABLE public.profiles IS 'Table des profils utilisateurs avec paramètres entreprise';
COMMENT ON COLUMN public.profiles.user_id IS 'ID de l''utilisateur (clé primaire, référence auth.users)';
COMMENT ON COLUMN public.profiles.plan IS 'Plan d''abonnement (free, pro)';
COMMENT ON COLUMN public.profiles.company_name IS 'Nom de l''entreprise';
COMMENT ON COLUMN public.profiles.company_email IS 'Email de l''entreprise';
COMMENT ON COLUMN public.profiles.company_phone IS 'Téléphone de l''entreprise';
COMMENT ON COLUMN public.profiles.company_address IS 'Adresse de l''entreprise';
COMMENT ON COLUMN public.profiles.logo_path IS 'Chemin du logo dans Supabase Storage (bucket: Logos)';
COMMENT ON COLUMN public.profiles.logo_url IS 'URL publique du logo (générée depuis logo_path ou stockée directement)';
COMMENT ON COLUMN public.profiles.primary_color IS 'Couleur principale de l''entreprise (format hex, ex: #6D5EF8) utilisée sur les factures et documents';
COMMENT ON COLUMN public.profiles.currency IS 'Devise de facturation par défaut (ex: CHF, EUR, USD) utilisée sur les devis et factures';
COMMENT ON COLUMN public.profiles.currency_symbol IS 'Symbole de la devise (ex: CHF, €, $). Généré automatiquement depuis currency mais peut être personnalisé.';
COMMENT ON COLUMN public.profiles.created_at IS 'Date de création du profil';
COMMENT ON COLUMN public.profiles.updated_at IS 'Date de dernière mise à jour (mise à jour automatique via trigger)';

-- ============================================
-- ÉTAPE 5 : S'assurer que les valeurs par défaut sont appliquées aux lignes existantes
-- ============================================
-- Mettre à jour les lignes existantes qui ont des valeurs NULL pour primary_color
UPDATE public.profiles 
SET primary_color = '#6D5EF8' 
WHERE primary_color IS NULL;

-- Mettre à jour les lignes existantes qui ont des valeurs NULL pour currency
UPDATE public.profiles 
SET currency = 'CHF' 
WHERE currency IS NULL;

-- Mettre à jour les lignes existantes qui ont des valeurs NULL pour plan
UPDATE public.profiles 
SET plan = 'free' 
WHERE plan IS NULL;

-- Mettre à jour currency_symbol pour les lignes existantes si nécessaire
UPDATE public.profiles 
SET currency_symbol = CASE 
    WHEN currency = 'CHF' THEN 'CHF'
    WHEN currency = 'EUR' THEN '€'
    WHEN currency = 'USD' THEN '$'
    WHEN currency = 'GBP' THEN '£'
    WHEN currency = 'CAD' THEN 'C$'
    WHEN currency = 'AUD' THEN 'A$'
    WHEN currency = 'JPY' THEN '¥'
    ELSE 'CHF'
END
WHERE currency_symbol IS NULL AND currency IS NOT NULL;

DO $$ 
BEGIN
    RAISE NOTICE '✓ Migration complète terminée avec succès';
END $$;

