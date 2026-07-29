-- Migration 054 : Swiss QR Bill
-- Ajoute les champs structurés créancier QR Bill dans profiles
-- et le champ qr_reference dans documents

-- =====================================================================
-- PROFILES : champs créancier Swiss QR Bill
-- =====================================================================

-- Adresse structurée créancier (obligatoire pour QR Bill)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS qr_creditor_name        TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qr_creditor_street       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qr_creditor_building_num TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qr_creditor_zip          TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qr_creditor_city         TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS qr_creditor_country      TEXT DEFAULT 'CH';

-- =====================================================================
-- DOCUMENTS : référence QR Bill persistante
-- =====================================================================

-- Référence unique QR Bill (NON/SCOR), générée une fois et jamais changée
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS qr_reference TEXT DEFAULT NULL;

-- Index pour éviter les doublons de référence par club
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_qr_reference
  ON public.documents (user_id, qr_reference)
  WHERE qr_reference IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN public.profiles.qr_creditor_name        IS 'Swiss QR Bill : nom du bénéficiaire (créancier)';
COMMENT ON COLUMN public.profiles.qr_creditor_street       IS 'Swiss QR Bill : rue du bénéficiaire';
COMMENT ON COLUMN public.profiles.qr_creditor_building_num IS 'Swiss QR Bill : numéro de bâtiment du bénéficiaire';
COMMENT ON COLUMN public.profiles.qr_creditor_zip          IS 'Swiss QR Bill : NPA du bénéficiaire';
COMMENT ON COLUMN public.profiles.qr_creditor_city         IS 'Swiss QR Bill : ville du bénéficiaire';
COMMENT ON COLUMN public.profiles.qr_creditor_country      IS 'Swiss QR Bill : pays du bénéficiaire (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN public.documents.qr_reference            IS 'Swiss QR Bill : référence de paiement unique (NON ou SCOR)';
