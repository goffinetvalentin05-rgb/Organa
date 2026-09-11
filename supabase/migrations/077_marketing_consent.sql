-- ============================================
-- MIGRATION 077 : Preuve d’opt-in marketing
-- ============================================
-- consented_at NULL = pas d’opt-in (y compris anciens contacts
-- evenement / buvette créés automatiquement).
-- Les campagnes ne doivent envoyer qu’aux lignes avec
-- unsubscribed = false AND consented_at IS NOT NULL.
-- IDEMPOTENT. Ne pas exécuter depuis l’app (application manuelle).

ALTER TABLE public.marketing_contacts
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;

ALTER TABLE public.marketing_contacts
  ADD COLUMN IF NOT EXISTS consent_source TEXT;

ALTER TABLE public.marketing_contacts
  ADD COLUMN IF NOT EXISTS consent_text_version TEXT;

ALTER TABLE public.marketing_contacts
  DROP CONSTRAINT IF EXISTS marketing_contacts_consent_source_check;

ALTER TABLE public.marketing_contacts
  ADD CONSTRAINT marketing_contacts_consent_source_check
  CHECK (
    consent_source IS NULL
    OR consent_source IN ('event_form', 'buvette_form', 'staff_declared')
  );

COMMENT ON COLUMN public.marketing_contacts.consented_at IS
  'Horodatage de l’opt-in. NULL = pas de consentement marketing (défaut, y compris héritage evenement/buvette).';
COMMENT ON COLUMN public.marketing_contacts.consent_source IS
  'event_form | buvette_form | staff_declared';
COMMENT ON COLUMN public.marketing_contacts.consent_text_version IS
  'Version du texte d’opt-in affiché (ex. marketing_optin_v1).';

-- Aucun backfill : les contacts existants (evenement/buvette auto) restent
-- sans consented_at et ne reçoivent pas de campagnes.

CREATE INDEX IF NOT EXISTS idx_marketing_contacts_club_consented
  ON public.marketing_contacts (club_id)
  WHERE consented_at IS NOT NULL AND unsubscribed = FALSE;
