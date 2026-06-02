-- Personnalisation page publique buvette (textes, couleurs, bannière)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS buvette_public_title TEXT,
  ADD COLUMN IF NOT EXISTS buvette_public_description TEXT,
  ADD COLUMN IF NOT EXISTS buvette_public_primary_color TEXT,
  ADD COLUMN IF NOT EXISTS buvette_public_accent_color TEXT,
  ADD COLUMN IF NOT EXISTS buvette_public_banner_url TEXT;

COMMENT ON COLUMN profiles.buvette_public_title IS 'Titre affiché sur la page publique de réservation buvette';
COMMENT ON COLUMN profiles.buvette_public_description IS 'Description sous le titre sur la page publique buvette';
COMMENT ON COLUMN profiles.buvette_public_primary_color IS 'Couleur principale override page buvette (#RRGGBB)';
COMMENT ON COLUMN profiles.buvette_public_accent_color IS 'Couleur accent override page buvette (#RRGGBB)';
COMMENT ON COLUMN profiles.buvette_public_banner_url IS 'URL image bannière optionnelle page buvette';
