-- ============================================
-- MIGRATION 029 : Traçabilité created_by / updated_by sur les tables métier
-- ============================================
-- Objectif :
--   Pouvoir afficher discrètement "Créé par X" / "Modifié par Y" sur les
--   éléments importants (factures, dépenses, documents, plannings, membres,
--   événements).
--
--   - Ajoute les colonnes `created_by` et `updated_by` (UUID -> auth.users).
--   - Backfill des lignes existantes : created_by = user_id (= owner du club
--     dans le modèle historique mono-utilisateur).
--   - Trigger générique : si updated_by n'est pas explicitement fourni à
--     l'UPDATE, on le remplit avec auth.uid().
--   - Trigger sur INSERT pour stamper created_by si l'app oublie.
--
-- IDEMPOTENT.
-- ============================================

-- ============================================
-- 1) Ajout des colonnes sur toutes les tables métier
-- ============================================
DO $$
DECLARE
  t TEXT;
  tables_audit TEXT[] := ARRAY[
    'clients',
    'documents',
    'events',
    'event_types',
    'plannings',
    'planning_slots',
    'planning_assignments',
    'depenses',
    'expenses',
    'qrcodes',
    'club_revenues',
    'buvette_slots',
    'buvette_requests',
    'marketing_contacts',
    'marketing_campaigns',
    'public_planning_links'
  ];
BEGIN
  FOREACH t IN ARRAY tables_audit LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE '⊘ Table public.% absente, skip', t;
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'created_by'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL',
        t
      );
      RAISE NOTICE '✓ %.created_by ajoutée', t;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_by'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL',
        t
      );
      RAISE NOTICE '✓ %.updated_by ajoutée', t;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 2) Backfill : created_by = user_id si présent
-- ============================================
DO $$
DECLARE
  t TEXT;
  tables_user_id TEXT[] := ARRAY[
    'clients','documents','events','event_types','plannings',
    'depenses','expenses','qrcodes','club_revenues',
    'buvette_slots','buvette_requests'
  ];
BEGIN
  FOREACH t IN ARRAY tables_user_id LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'UPDATE public.%I SET created_by = user_id WHERE created_by IS NULL',
      t
    );
  END LOOP;
END $$;

-- ============================================
-- 3) Trigger générique de stamping
-- ============================================
-- Pose updated_by = auth.uid() à chaque UPDATE, et created_by = auth.uid()
-- au INSERT si non fourni.
CREATE OR REPLACE FUNCTION public.stamp_actor_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN
      NEW.created_by := v_uid;
    END IF;
    NEW.updated_by := COALESCE(NEW.updated_by, v_uid);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := COALESCE(v_uid, NEW.updated_by, OLD.updated_by);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

-- Pose le trigger sur chaque table cible (idempotent)
DO $$
DECLARE
  t TEXT;
  tables_audit TEXT[] := ARRAY[
    'clients','documents','events','event_types','plannings',
    'planning_slots','planning_assignments',
    'depenses','expenses','qrcodes','club_revenues',
    'buvette_slots','buvette_requests',
    'marketing_contacts','marketing_campaigns','public_planning_links'
  ];
BEGIN
  FOREACH t IN ARRAY tables_audit LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      CONTINUE;
    END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS trg_stamp_actor_%I ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_stamp_actor_%I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.stamp_actor_columns()',
      t, t
    );
  END LOOP;
END $$;

-- ============================================
-- 4) Vue : nom affiché d'un user (par club)
-- ============================================
-- Sert à résoudre côté API "Créé par <nom>" sans devoir connaître
-- profiles : on prend en priorité club_memberships.name puis l'email.
CREATE OR REPLACE FUNCTION public.user_display_name(
  p_club_id UUID,
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(cm.name, ''),
    NULLIF(SPLIT_PART(cm.email, '@', 1), ''),
    NULLIF(SPLIT_PART(u.email, '@', 1), ''),
    u.email,
    'Utilisateur'
  )
  FROM auth.users u
  LEFT JOIN public.club_memberships cm
    ON cm.club_id = p_club_id
   AND cm.user_id = p_user_id
   AND cm.deleted_at IS NULL
  WHERE u.id = p_user_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_display_name(UUID, UUID) TO authenticated;

DO $$ BEGIN RAISE NOTICE '✓ Migration 029 OK — created_by/updated_by + triggers'; END $$;
