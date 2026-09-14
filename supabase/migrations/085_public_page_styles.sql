-- Styles de la page publique principale du club (/p/[slug])
-- Même grammaire que Supporters / Boutique / Buvette :
-- colors | banner | fullscreen + cadrage + intensité + label + couleurs

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_page_page_style TEXT DEFAULT 'colors',
  ADD COLUMN IF NOT EXISTS public_page_image_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS public_page_overlay_intensity TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS public_page_label TEXT,
  ADD COLUMN IF NOT EXISTS public_page_secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS public_page_accent_color TEXT,
  ADD COLUMN IF NOT EXISTS public_page_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS public_page_banner_path TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_page_page_style_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT public_page_page_style_check
      CHECK (
        public_page_page_style IS NULL
        OR public_page_page_style IN ('colors', 'banner', 'fullscreen')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_page_image_position_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT public_page_image_position_check
      CHECK (
        public_page_image_position IS NULL
        OR public_page_image_position IN ('top', 'center', 'bottom')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_page_overlay_intensity_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT public_page_overlay_intensity_check
      CHECK (
        public_page_overlay_intensity IS NULL
        OR public_page_overlay_intensity IN ('light', 'normal', 'dark')
      );
  END IF;
END $$;

COMMENT ON COLUMN profiles.public_page_page_style IS 'Style page publique club : colors | banner | fullscreen';
COMMENT ON COLUMN profiles.public_page_image_position IS 'Cadrage image : top | center | bottom';
COMMENT ON COLUMN profiles.public_page_overlay_intensity IS 'Intensité overlay : light | normal | dark';
COMMENT ON COLUMN profiles.public_page_label IS 'Petit label hero (ex. Club)';
COMMENT ON COLUMN profiles.public_page_secondary_color IS 'Couleur secondaire override page publique (#RRGGBB)';
COMMENT ON COLUMN profiles.public_page_accent_color IS 'Couleur d’accent override page publique (#RRGGBB)';
COMMENT ON COLUMN profiles.public_page_banner_url IS 'URL publique de l’image hero / fond';
COMMENT ON COLUMN profiles.public_page_banner_path IS 'Chemin storage Logos de l’image hero / fond';
