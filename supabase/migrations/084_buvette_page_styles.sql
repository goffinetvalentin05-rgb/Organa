-- Styles de page publique Buvette : même grammaire que Supporters / Boutique
-- colors | banner | fullscreen + cadrage + intensité + label + couleur secondaire

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS buvette_public_page_style TEXT DEFAULT 'colors',
  ADD COLUMN IF NOT EXISTS buvette_public_image_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS buvette_public_overlay_intensity TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS buvette_public_label TEXT,
  ADD COLUMN IF NOT EXISTS buvette_public_secondary_color TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buvette_public_page_style_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT buvette_public_page_style_check
      CHECK (
        buvette_public_page_style IS NULL
        OR buvette_public_page_style IN ('colors', 'banner', 'fullscreen')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buvette_public_image_position_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT buvette_public_image_position_check
      CHECK (
        buvette_public_image_position IS NULL
        OR buvette_public_image_position IN ('top', 'center', 'bottom')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buvette_public_overlay_intensity_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT buvette_public_overlay_intensity_check
      CHECK (
        buvette_public_overlay_intensity IS NULL
        OR buvette_public_overlay_intensity IN ('light', 'normal', 'dark')
      );
  END IF;
END $$;

UPDATE profiles
SET buvette_public_page_style = 'banner'
WHERE buvette_public_banner_url IS NOT NULL
  AND (buvette_public_page_style IS NULL OR buvette_public_page_style = 'colors');

COMMENT ON COLUMN profiles.buvette_public_page_style IS 'Style page Buvette : colors | banner | fullscreen';
COMMENT ON COLUMN profiles.buvette_public_image_position IS 'Cadrage image : top | center | bottom';
COMMENT ON COLUMN profiles.buvette_public_overlay_intensity IS 'Intensité overlay : light | normal | dark';
COMMENT ON COLUMN profiles.buvette_public_label IS 'Petit label hero (ex. BUVETTE)';
COMMENT ON COLUMN profiles.buvette_public_secondary_color IS 'Couleur secondaire override page Buvette (#RRGGBB)';
