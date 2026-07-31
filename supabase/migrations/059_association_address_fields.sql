-- Adresse structurée sur public.profiles (additif, nullable).
-- Ne touche pas qr_creditor_*, ni RLS, ni colonnes existantes.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_address_line2 text,
  ADD COLUMN IF NOT EXISTS company_postal_code text,
  ADD COLUMN IF NOT EXISTS company_city text,
  ADD COLUMN IF NOT EXISTS company_region text,
  ADD COLUMN IF NOT EXISTS company_country text;

COMMENT ON COLUMN public.profiles.company_address_line2 IS 'Complément d’adresse';
COMMENT ON COLUMN public.profiles.company_postal_code IS 'NPA / code postal';
COMMENT ON COLUMN public.profiles.company_city IS 'Localité';
COMMENT ON COLUMN public.profiles.company_region IS 'Canton / région';
COMMENT ON COLUMN public.profiles.company_country IS 'Pays';
