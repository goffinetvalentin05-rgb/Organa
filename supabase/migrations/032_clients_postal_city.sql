-- Colonnes attendues par l'app (formulaires / API) mais parfois absentes sur d'anciennes bases.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT;

COMMENT ON COLUMN public.clients.postal_code IS 'Code postal (optionnel)';
COMMENT ON COLUMN public.clients.city IS 'Ville (optionnel)';

DO $$ BEGIN RAISE NOTICE 'Migration 032 OK — clients.postal_code / city'; END $$;
