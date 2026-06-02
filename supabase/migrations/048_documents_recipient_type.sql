-- ============================================
-- MIGRATION 048 : Type de destinataire sur les documents (factures)
-- ============================================
-- Permet de facturer un membre, un sponsor ou un destinataire externe
-- sans obliger la création d'une fiche membre.

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS recipient_type TEXT
    CHECK (recipient_type IS NULL OR recipient_type IN ('member', 'sponsor', 'external'));

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS sponsor_contract_id UUID
    REFERENCES public.sponsor_contracts(id) ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS recipient_data JSONB;

CREATE INDEX IF NOT EXISTS idx_documents_sponsor_contract_id
  ON public.documents (sponsor_contract_id)
  WHERE sponsor_contract_id IS NOT NULL;

-- Rétrocompatibilité : les factures existantes avec client_id restent des destinataires « membre »
UPDATE public.documents
SET recipient_type = 'member'
WHERE recipient_type IS NULL
  AND client_id IS NOT NULL
  AND type = 'invoice';

SELECT 'Migration 048_documents_recipient_type terminée' AS status;
