-- Mode email avancé (clé + domaine club) : désactivé par défaut.
-- L'ancienne config (resend_api_key) reste en base mais n'est pas utilisée tant que email_custom_enabled = false.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_custom_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.email_custom_enabled IS
  'Si true et expéditeur + clé valides, envoi via le compte Resend du club ; sinon compte Resend Obillz (env).';
