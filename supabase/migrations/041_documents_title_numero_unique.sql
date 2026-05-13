-- ============================================
-- Documents : titre explicite + unicité du numéro par club et type
-- ============================================
-- Idempotent. Le titre sert d'intitulé métier (ex. « Facture sponsoring »).
-- Le numéro (référence) reste dans `numero`, normalisé sans espaces superflus.
-- ============================================

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS title TEXT;

-- Renseigner les titres manquants à partir de la première ligne ou d'un défaut
UPDATE public.documents d
SET title = COALESCE(
  NULLIF(TRIM(COALESCE(d.items->0->>'designation', '')), ''),
  CASE WHEN d.type = 'invoice' THEN 'Facture' ELSE 'Cotisation' END
)
WHERE d.title IS NULL OR TRIM(COALESCE(d.title, '')) = '';

-- Normaliser les numéros existants (cohérent avec l'unicité sur btrim)
UPDATE public.documents
SET numero = btrim(numero)
WHERE numero IS NOT NULL AND numero <> btrim(numero);

-- Index unique : même club, même type de document, même référence (hors soft-delete)
DROP INDEX IF EXISTS idx_documents_numero_unique_club_type;
CREATE UNIQUE INDEX idx_documents_numero_unique_club_type
  ON public.documents (user_id, type, (btrim(numero)))
  WHERE deleted_at IS NULL
    AND numero IS NOT NULL
    AND btrim(numero) <> '';

COMMENT ON COLUMN public.documents.title IS 'Intitulé affiché (facture / cotisation), distinct du type de document et des lignes.';
