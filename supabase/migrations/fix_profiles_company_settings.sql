-- Migration: Fix profiles table - Ajouter toutes les colonnes nécessaires pour les paramètres entreprise
-- Cette migration garantit que toutes les colonnes existent avant que l'API ne tente de les utiliser

-- Vérifier et ajouter company_name si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_name TEXT;
    END IF;
END $$;

-- Vérifier et ajouter company_email si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_email TEXT;
    END IF;
END $$;

-- Vérifier et ajouter company_phone si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_phone TEXT;
    END IF;
END $$;

-- Vérifier et ajouter company_address si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'company_address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN company_address TEXT;
    END IF;
END $$;

-- Vérifier et ajouter primary_color si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'primary_color'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN primary_color TEXT DEFAULT '#6D5EF8';
    END IF;
END $$;

-- Vérifier et ajouter currency si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN currency TEXT DEFAULT 'CHF';
    END IF;
END $$;

-- Vérifier et ajouter currency_symbol si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'currency_symbol'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN currency_symbol TEXT;
    END IF;
END $$;

-- Ajouter les commentaires pour documentation
COMMENT ON COLUMN public.profiles.company_name IS 'Nom de l''entreprise';
COMMENT ON COLUMN public.profiles.company_email IS 'Email de l''entreprise';
COMMENT ON COLUMN public.profiles.company_phone IS 'Téléphone de l''entreprise';
COMMENT ON COLUMN public.profiles.company_address IS 'Adresse de l''entreprise';
COMMENT ON COLUMN public.profiles.primary_color IS 'Couleur principale de l''entreprise (format hex, ex: #6D5EF8) utilisée sur les factures et documents';
COMMENT ON COLUMN public.profiles.currency IS 'Devise de facturation par défaut (ex: CHF, EUR, USD) utilisée sur les devis et factures';
COMMENT ON COLUMN public.profiles.currency_symbol IS 'Symbole de la devise (ex: CHF, €, $). Généré automatiquement depuis currency mais peut être personnalisé.';
























