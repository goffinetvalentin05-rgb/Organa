-- Migration: Ajouter les paramètres entreprise à user_profiles
-- Ajoute les colonnes pour stocker les informations de l'entreprise et le logo

-- Ajouter les colonnes de paramètres entreprise si elles n'existent pas déjà
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS nom_entreprise TEXT NULL,
ADD COLUMN IF NOT EXISTS adresse TEXT NULL,
ADD COLUMN IF NOT EXISTS email TEXT NULL,
ADD COLUMN IF NOT EXISTS telephone TEXT NULL,
ADD COLUMN IF NOT EXISTS logo_path TEXT NULL,
ADD COLUMN IF NOT EXISTS style_en_tete TEXT DEFAULT 'moderne' CHECK (style_en_tete IN ('simple', 'moderne', 'classique')),
ADD COLUMN IF NOT EXISTS email_expediteur TEXT NULL,
ADD COLUMN IF NOT EXISTS nom_expediteur TEXT NULL,
ADD COLUMN IF NOT EXISTS resend_api_key TEXT NULL,
ADD COLUMN IF NOT EXISTS iban TEXT NULL,
ADD COLUMN IF NOT EXISTS bank_name TEXT NULL,
ADD COLUMN IF NOT EXISTS conditions_paiement TEXT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN user_profiles.logo_path IS 'Chemin du logo dans Supabase Storage (bucket: logos)';
COMMENT ON COLUMN user_profiles.style_en_tete IS 'Style utilisé pour les en-têtes des documents (devis, factures)';




























