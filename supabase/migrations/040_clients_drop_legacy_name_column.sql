-- ============================================
-- MIGRATION 040 : clients — colonne legacy « name »
-- ============================================
-- Si la migration 001 a trouvé à la fois `name` et `nom`, elle n’a pas
-- renommé (voir branche « nom existe déjà »). On se retrouve alors avec
-- deux colonnes : `nom` alimenté par l’app, et `name` NOT NULL jamais
-- rempli → erreur 23502 sur « name » à l’INSERT.
--
-- 1) Si name + nom : recopier dans nom si besoin, aligner name, puis DROP name.
-- 2) Si seulement name (pas nom) : renommer name → nom (équivalent 001).
-- IDEMPOTENT.
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'nom'
  ) THEN
    UPDATE public.clients
    SET nom = COALESCE(NULLIF(btrim(COALESCE(nom, '')), ''), btrim(COALESCE(name, '')))
    WHERE btrim(COALESCE(nom, '')) = '' AND btrim(COALESCE(name, '')) <> '';

    UPDATE public.clients
    SET name = nom
    WHERE name IS DISTINCT FROM nom OR name IS NULL;

    ALTER TABLE public.clients DROP COLUMN name;
    RAISE NOTICE '040 OK — clients.name supprimée (doublon avec nom)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'nom'
  ) THEN
    ALTER TABLE public.clients RENAME COLUMN name TO nom;
    RAISE NOTICE '040 OK — clients.name renommée en nom';
  ELSE
    RAISE NOTICE '040 skip — pas de colonne name legacy sur clients';
  END IF;
END $$;

-- Même schéma doublon possible pour phone / telephone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'phone'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'telephone'
  ) THEN
    UPDATE public.clients
    SET telephone = COALESCE(NULLIF(btrim(COALESCE(telephone, '')), ''), btrim(COALESCE(phone, '')))
    WHERE btrim(COALESCE(telephone, '')) = '' AND btrim(COALESCE(phone, '')) <> '';
    UPDATE public.clients SET phone = telephone WHERE phone IS DISTINCT FROM telephone OR phone IS NULL;
    ALTER TABLE public.clients DROP COLUMN phone;
    RAISE NOTICE '040 OK — clients.phone supprimée (doublon avec telephone)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE public.clients RENAME COLUMN phone TO telephone;
    RAISE NOTICE '040 OK — clients.phone renommée en telephone';
  END IF;
END $$;

-- address / adresse
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'address'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'adresse'
  ) THEN
    UPDATE public.clients
    SET adresse = COALESCE(NULLIF(btrim(COALESCE(adresse, '')), ''), btrim(COALESCE(address, '')))
    WHERE btrim(COALESCE(adresse, '')) = '' AND btrim(COALESCE(address, '')) <> '';
    UPDATE public.clients SET address = adresse WHERE address IS DISTINCT FROM adresse OR address IS NULL;
    ALTER TABLE public.clients DROP COLUMN address;
    RAISE NOTICE '040 OK — clients.address supprimée (doublon avec adresse)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'address'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'adresse'
  ) THEN
    ALTER TABLE public.clients RENAME COLUMN address TO adresse;
    RAISE NOTICE '040 OK — clients.address renommée en adresse';
  END IF;
END $$;
