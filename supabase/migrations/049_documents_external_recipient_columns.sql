-- ============================================
-- MIGRATION 049 : Colonnes explicites destinataire externe (factures)
-- ============================================
-- Complète la migration 048. Permet client_id NULL pour les factures externes.

-- client_id doit être nullable (certaines bases legacy peuvent l'avoir en NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'documents'
      AND column_name = 'client_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.documents ALTER COLUMN client_id DROP NOT NULL;
    RAISE NOTICE '✓ documents.client_id rendu nullable';
  END IF;
END $$;

-- Colonnes destinataire externe (noms alignés API / PDF)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_name TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_contact_name TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_address TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_zip TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_city TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_country TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_email TEXT;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS external_recipient_phone TEXT;

-- Copier recipient_data JSONB vers colonnes si présent (048 déjà appliquée)
UPDATE public.documents
SET
  external_recipient_name = COALESCE(external_recipient_name, recipient_data->>'name'),
  external_recipient_contact_name = COALESCE(
    external_recipient_contact_name,
    recipient_data->>'contactName',
    recipient_data->>'contact_name'
  ),
  external_recipient_address = COALESCE(external_recipient_address, recipient_data->>'address'),
  external_recipient_zip = COALESCE(
    external_recipient_zip,
    recipient_data->>'postalCode',
    recipient_data->>'postal_code'
  ),
  external_recipient_city = COALESCE(external_recipient_city, recipient_data->>'city'),
  external_recipient_country = COALESCE(external_recipient_country, recipient_data->>'country'),
  external_recipient_email = COALESCE(external_recipient_email, recipient_data->>'email'),
  external_recipient_phone = COALESCE(
    external_recipient_phone,
    recipient_data->>'phone',
    recipient_data->>'telephone'
  ),
  recipient_type = COALESCE(recipient_type, 'external')
WHERE recipient_type = 'external'
   OR (recipient_type IS NULL AND client_id IS NULL AND recipient_data IS NOT NULL);

SELECT 'Migration 049_documents_external_recipient_columns terminée' AS status;
