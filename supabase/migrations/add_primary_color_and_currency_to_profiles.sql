-- Migration: Ajouter primary_color et currency à profiles
-- Ajoute les colonnes pour stocker la couleur principale de l'entreprise et la devise de facturation

-- Ajouter la colonne primary_color si elle n'existe pas déjà
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6D5EF8';

-- Ajouter la colonne currency si elle n'existe pas déjà
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CHF';

-- Commentaires pour documentation
COMMENT ON COLUMN public.profiles.primary_color IS 'Couleur principale de l''entreprise (format hex, ex: #6D5EF8) utilisée sur les factures et documents';
COMMENT ON COLUMN public.profiles.currency IS 'Devise de facturation par défaut (ex: CHF, EUR, USD) utilisée sur les devis et factures';

-- Validation: vérifier que primary_color est un code hex valide (optionnel, pour production)
-- On laisse le check simple car le format hex peut varier (#RGB, #RRGGBB, etc.)










