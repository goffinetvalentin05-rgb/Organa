-- Migration: Ajouter les champs entreprise à profiles
-- Ajoute les colonnes pour stocker les informations de l'entreprise et le logo

-- Ajouter les colonnes de paramètres entreprise si elles n'existent pas déjà
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name TEXT NULL,
ADD COLUMN IF NOT EXISTS company_email TEXT NULL,
ADD COLUMN IF NOT EXISTS company_phone TEXT NULL,
ADD COLUMN IF NOT EXISTS company_address TEXT NULL,
ADD COLUMN IF NOT EXISTS logo_path TEXT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.company_name IS 'Nom de l''entreprise';
COMMENT ON COLUMN profiles.company_email IS 'Email de l''entreprise';
COMMENT ON COLUMN profiles.company_phone IS 'Téléphone de l''entreprise';
COMMENT ON COLUMN profiles.company_address IS 'Adresse de l''entreprise';
COMMENT ON COLUMN profiles.logo_path IS 'Chemin du logo dans Supabase Storage (bucket: logos)';





























