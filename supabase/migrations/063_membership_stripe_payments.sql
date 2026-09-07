-- Préférence d'encaissement des cotisations (club) + méthode figée par document.
-- Les cotisations existantes restent des QR-factures (payment_method NULL = qr_invoice).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_payment_method text NOT NULL DEFAULT 'qr_invoice';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_membership_payment_method_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_membership_payment_method_check
  CHECK (membership_payment_method IN ('qr_invoice', 'stripe'));

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_payment_method_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('qr_invoice', 'stripe'));

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS payment_token text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS stripe_charge_id text;

CREATE UNIQUE INDEX IF NOT EXISTS documents_payment_token_uidx
  ON public.documents (payment_token)
  WHERE payment_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS documents_stripe_checkout_session_idx
  ON public.documents (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
