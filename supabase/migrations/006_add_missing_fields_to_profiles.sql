-- Migration: Ajouter les champs manquants à la table profiles
-- Date: 2025-01-XX
-- Objectif: Ajouter iban, bank_name, conditions_paiement, email_expediteur, nom_expediteur, resend_api_key

-- ============================================
-- ÉTAPE 1 : Ajouter les colonnes bancaires
-- ============================================

-- Colonne iban
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'iban'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN iban TEXT;
        RAISE NOTICE '✓ Colonne iban ajoutée';
    END IF;
END $$;

-- Colonne bank_name
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN bank_name TEXT;
        RAISE NOTICE '✓ Colonne bank_name ajoutée';
    END IF;
END $$;

-- Colonne conditions_paiement
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'conditions_paiement'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN conditions_paiement TEXT;
        RAISE NOTICE '✓ Colonne conditions_paiement ajoutée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 2 : Ajouter les colonnes email
-- ============================================

-- Colonne email_expediteur
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email_expediteur'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email_expediteur TEXT;
        RAISE NOTICE '✓ Colonne email_expediteur ajoutée';
    END IF;
END $$;

-- Colonne nom_expediteur
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'nom_expediteur'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN nom_expediteur TEXT;
        RAISE NOTICE '✓ Colonne nom_expediteur ajoutée';
    END IF;
END $$;

-- Colonne resend_api_key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'resend_api_key'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN resend_api_key TEXT;
        RAISE NOTICE '✓ Colonne resend_api_key ajoutée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : Ajouter les commentaires pour documentation
-- ============================================
COMMENT ON COLUMN public.profiles.iban IS 'IBAN bancaire de l''entreprise';
COMMENT ON COLUMN public.profiles.bank_name IS 'Nom de la banque';
COMMENT ON COLUMN public.profiles.conditions_paiement IS 'Conditions de paiement affichées sur les factures';
COMMENT ON COLUMN public.profiles.email_expediteur IS 'Email de l''expéditeur pour les emails (Resend)';
COMMENT ON COLUMN public.profiles.nom_expediteur IS 'Nom de l''expéditeur pour les emails';
COMMENT ON COLUMN public.profiles.resend_api_key IS 'Clé API Resend pour l''envoi d''emails';

