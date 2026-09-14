-- Personnalisation visuelle de la page publique Supporters
-- Même pattern que la buvette (colonnes profiles, 1:1 club).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS supporters_public_title TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_message TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_primary_color TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_background_mode TEXT DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS supporters_public_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_banner_path TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_bg_image_url TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_bg_image_path TEXT,
  ADD COLUMN IF NOT EXISTS supporters_public_show_stats BOOLEAN DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'supporters_public_background_mode_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT supporters_public_background_mode_check
      CHECK (
        supporters_public_background_mode IS NULL
        OR supporters_public_background_mode IN ('solid', 'gradient', 'image')
      );
  END IF;
END $$;

COMMENT ON COLUMN profiles.supporters_public_title IS 'Titre hero page publique Supporters';
COMMENT ON COLUMN profiles.supporters_public_subtitle IS 'Sous-titre hero page publique Supporters';
COMMENT ON COLUMN profiles.supporters_public_message IS 'Message de soutien optionnel page publique Supporters';
COMMENT ON COLUMN profiles.supporters_public_primary_color IS 'Couleur principale override page Supporters (#RRGGBB)';
COMMENT ON COLUMN profiles.supporters_public_secondary_color IS 'Couleur secondaire override page Supporters (#RRGGBB)';
COMMENT ON COLUMN profiles.supporters_public_background_mode IS 'Fond hero : solid | gradient | image';
COMMENT ON COLUMN profiles.supporters_public_banner_url IS 'URL bannière / couverture page Supporters';
COMMENT ON COLUMN profiles.supporters_public_banner_path IS 'Chemin Storage bannière Supporters';
COMMENT ON COLUMN profiles.supporters_public_bg_image_url IS 'URL image d’ambiance page Supporters';
COMMENT ON COLUMN profiles.supporters_public_bg_image_path IS 'Chemin Storage image d’ambiance Supporters';
COMMENT ON COLUMN profiles.supporters_public_show_stats IS 'Afficher les statistiques sur la page publique Supporters';
