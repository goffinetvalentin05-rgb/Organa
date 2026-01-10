-- Migration: Ajouter currency_symbol à profiles
-- Ajoute la colonne pour stocker le symbole de devise (calculé automatiquement depuis currency)

-- Ajouter la colonne currency_symbol si elle n'existe pas déjà
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency_symbol TEXT;

-- Commentaire pour documentation
COMMENT ON COLUMN public.profiles.currency_symbol IS 'Symbole de la devise (ex: CHF, €, $). Généré automatiquement depuis currency mais peut être personnalisé.';

-- Note: currency_symbol sera calculé dynamiquement depuis currency si non défini,
-- mais peut être stocké pour permettre une personnalisation










