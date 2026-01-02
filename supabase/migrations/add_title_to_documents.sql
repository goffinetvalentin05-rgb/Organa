-- Migration: Ajouter le champ title (nom personnalisé) à la table documents
-- Ce champ permet aux utilisateurs de définir un nom personnalisé pour leurs factures et devis
-- Le champ est optionnel (nullable) - si non renseigné, le numéro automatique sera utilisé

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS title TEXT;

-- Commentaire pour documenter le champ
COMMENT ON COLUMN public.documents.title IS 'Nom personnalisé du document (optionnel). Si non renseigné, le numéro automatique sera utilisé pour l''affichage.';

