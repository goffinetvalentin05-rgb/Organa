-- Chemin storage pour la bannière buvette (suppression / remplacement)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS buvette_public_banner_path TEXT;

COMMENT ON COLUMN profiles.buvette_public_banner_path IS 'Chemin Supabase Storage de la bannière page publique buvette';
