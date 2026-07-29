-- Migration 055 : Idempotency keys
-- Permet de protéger côté backend les endpoints à effet de bord
-- contre les doubles soumissions (double-click, retry navigateur, etc.).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  key text NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  resource_type text,
  resource_id text,
  -- response_status = 0 => en cours de traitement
  response_status int NOT NULL DEFAULT 0,
  response_body jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  unique (club_id, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_club_created_at
  ON public.idempotency_keys (club_id, created_at DESC);

