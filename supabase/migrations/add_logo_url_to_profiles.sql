-- Migration: Ajouter logo_url à profiles
-- Ajoute la colonne logo_url pour stocker l'URL publique du logo

-- Ajouter la colonne logo_url si elle n'existe pas déjà
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS logo_url text;

-- Commentaire pour documentation
COMMENT ON COLUMN public.profiles.logo_url IS 'URL publique du logo dans Supabase Storage (bucket: Logos). Générée automatiquement lors de l''upload.';
