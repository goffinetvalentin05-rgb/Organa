-- Personnalisation visuelle de la boutique publique
-- Colonnes sur shop_settings (1:1 club), même logique que Supporters.

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS public_label TEXT,
  ADD COLUMN IF NOT EXISTS public_title TEXT,
  ADD COLUMN IF NOT EXISTS public_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS public_primary_color TEXT,
  ADD COLUMN IF NOT EXISTS public_secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS public_accent_color TEXT,
  ADD COLUMN IF NOT EXISTS public_page_style TEXT DEFAULT 'colors',
  ADD COLUMN IF NOT EXISTS public_banner_url TEXT,
  ADD COLUMN IF NOT EXISTS public_banner_path TEXT,
  ADD COLUMN IF NOT EXISTS public_image_position TEXT DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS public_overlay_intensity TEXT DEFAULT 'normal';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_settings_public_page_style_check'
  ) THEN
    ALTER TABLE public.shop_settings
      ADD CONSTRAINT shop_settings_public_page_style_check
      CHECK (
        public_page_style IS NULL
        OR public_page_style IN ('colors', 'banner', 'fullscreen')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_settings_public_image_position_check'
  ) THEN
    ALTER TABLE public.shop_settings
      ADD CONSTRAINT shop_settings_public_image_position_check
      CHECK (
        public_image_position IS NULL
        OR public_image_position IN ('top', 'center', 'bottom')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shop_settings_public_overlay_intensity_check'
  ) THEN
    ALTER TABLE public.shop_settings
      ADD CONSTRAINT shop_settings_public_overlay_intensity_check
      CHECK (
        public_overlay_intensity IS NULL
        OR public_overlay_intensity IN ('light', 'normal', 'dark')
      );
  END IF;
END $$;

COMMENT ON COLUMN public.shop_settings.public_label IS 'Petit label hero boutique (ex. BOUTIQUE)';
COMMENT ON COLUMN public.shop_settings.public_title IS 'Titre public hero boutique';
COMMENT ON COLUMN public.shop_settings.public_subtitle IS 'Sous-titre public hero boutique';
COMMENT ON COLUMN public.shop_settings.public_primary_color IS 'Couleur principale override boutique (#RRGGBB)';
COMMENT ON COLUMN public.shop_settings.public_secondary_color IS 'Couleur secondaire override boutique (#RRGGBB)';
COMMENT ON COLUMN public.shop_settings.public_accent_color IS 'Couleur d’accent override boutique (#RRGGBB)';
COMMENT ON COLUMN public.shop_settings.public_page_style IS 'Style page boutique : colors | banner | fullscreen';
COMMENT ON COLUMN public.shop_settings.public_banner_url IS 'URL image hero / fond boutique';
COMMENT ON COLUMN public.shop_settings.public_banner_path IS 'Chemin Storage image boutique';
COMMENT ON COLUMN public.shop_settings.public_image_position IS 'Cadrage image : top | center | bottom';
COMMENT ON COLUMN public.shop_settings.public_overlay_intensity IS 'Intensité overlay : light | normal | dark';
