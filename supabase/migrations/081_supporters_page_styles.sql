-- Styles de page Supporters : colors | banner | fullscreen
-- + cadrage image + intensité overlay + label hero

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS supporters_public_page_style TEXT DEFAULT 'colors',
  ADD COLUMN IF NOT EXISTS supporters_public_image_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS supporters_public_overlay_intensity TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS supporters_public_label TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supporters_public_page_style_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT supporters_public_page_style_check
      CHECK (
        supporters_public_page_style IS NULL
        OR supporters_public_page_style IN ('colors', 'banner', 'fullscreen')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supporters_public_image_position_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT supporters_public_image_position_check
      CHECK (
        supporters_public_image_position IS NULL
        OR supporters_public_image_position IN ('top', 'center', 'bottom')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supporters_public_overlay_intensity_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT supporters_public_overlay_intensity_check
      CHECK (
        supporters_public_overlay_intensity IS NULL
        OR supporters_public_overlay_intensity IN ('light', 'normal', 'dark')
      );
  END IF;
END $$;

UPDATE profiles
SET supporters_public_page_style = 'banner'
WHERE supporters_public_page_style IS NULL
   OR (
     supporters_public_page_style = 'colors'
     AND supporters_public_background_mode = 'image'
     AND supporters_public_banner_url IS NOT NULL
   );

COMMENT ON COLUMN profiles.supporters_public_page_style IS 'Style page Supporters : colors | banner | fullscreen';
COMMENT ON COLUMN profiles.supporters_public_image_position IS 'Cadrage image : top | center | bottom';
COMMENT ON COLUMN profiles.supporters_public_overlay_intensity IS 'Intensité overlay : light | normal | dark';
COMMENT ON COLUMN profiles.supporters_public_label IS 'Petit label hero (ex. SUPPORTERS)';
