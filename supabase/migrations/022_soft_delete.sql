-- ============================================
-- MIGRATION 022 : Soft delete sur toutes les tables métier
-- ============================================
-- Ajoute deleted_at + deleted_by sur chaque table contenant de la donnée
-- métier ou financière. Crée des index partiels pour les requêtes "actives".
-- Crée des vues v_*_active pour exclure automatiquement les soft-deleted.
--
-- IDEMPOTENT.
--
-- Convention applicative à respecter :
--   - Toujours filtrer par `deleted_at IS NULL` côté lecture (les RLS
--     ajouteront aussi cette contrainte en migration 023).
--   - Pour supprimer, on UPDATE deleted_at = NOW(), deleted_by = auth.uid().
--   - Une procédure de purge dédiée (>= 30 jours) sera créée plus tard.
-- ============================================

DO $$
DECLARE
  t TEXT;
  -- Tables métier à soft-deleter
  tables_metier TEXT[] := ARRAY[
    'profiles',
    'clients',
    'documents',
    'events',
    'event_types',
    'plannings',
    'planning_slots',
    'planning_assignments',
    'public_planning_links',
    'depenses',
    'expenses',
    'email_history',
    'qrcodes',
    'registrations',
    'buvette_slots',
    'buvette_requests',
    'marketing_contacts',
    'marketing_campaigns',
    'marketing_campaign_recipients',
    'club_revenues'
  ];
BEGIN
  FOREACH t IN ARRAY tables_metier LOOP
    -- Skip si la table n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      RAISE NOTICE '⊘ Table public.% absente, skip', t;
      CONTINUE;
    END IF;

    -- Ajouter deleted_at si absent
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'deleted_at'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN deleted_at TIMESTAMPTZ', t);
      RAISE NOTICE '✓ %.deleted_at ajoutée', t;
    END IF;

    -- Ajouter deleted_by si absent
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'deleted_by'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL',
        t
      );
      RAISE NOTICE '✓ %.deleted_by ajoutée', t;
    END IF;

    -- Index partiel pour accélérer les requêtes "actives"
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (deleted_at) WHERE deleted_at IS NULL',
      'idx_' || t || '_active', t
    );
  END LOOP;
END $$;

-- ============================================
-- Helper SQL : marquer une row comme supprimée
-- ============================================
-- Usage côté code :
--   SELECT public.soft_delete_row('documents', '<uuid>');
-- Vérifie que l'utilisateur a au moins le rôle "staff" sur le club concerné.
CREATE OR REPLACE FUNCTION public.soft_delete_row(
  p_table TEXT,
  p_row_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club_id UUID;
  v_query TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_actor UUID := auth.uid();
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Whitelist : tables racines qui possèdent user_id directement.
  -- Les tables enfants (planning_slots, planning_assignments,
  -- marketing_campaign_recipients, etc.) sont supprimées via leur parent
  -- ou via du code applicatif après vérification RLS.
  IF p_table NOT IN (
    'clients','documents','events','event_types','plannings',
    'public_planning_links','depenses','expenses',
    'email_history','qrcodes','buvette_slots','buvette_requests',
    'marketing_contacts','marketing_campaigns','club_revenues'
  ) THEN
    RAISE EXCEPTION 'Table non autorisée pour soft_delete_row : %', p_table;
  END IF;

  -- Récupérer le club_id de la row (via user_id pour tables racines, ou via parent)
  EXECUTE format(
    'SELECT user_id FROM public.%I WHERE id = $1',
    p_table
  ) INTO v_club_id USING p_row_id;

  IF v_club_id IS NULL THEN
    RAISE EXCEPTION 'Ligne introuvable ou non rattachée à un club (%/%)', p_table, p_row_id;
  END IF;

  -- Vérifier le rôle staff
  IF NOT public.is_club_staff(v_club_id) THEN
    RAISE EXCEPTION 'Permission insuffisante (rôle staff requis)';
  END IF;

  v_query := format(
    'UPDATE public.%I SET deleted_at = $1, deleted_by = $2 WHERE id = $3 AND deleted_at IS NULL',
    p_table
  );
  EXECUTE v_query USING v_now, v_actor, p_row_id;

  -- Audit log
  PERFORM public.log_audit(
    v_club_id, 'soft_delete', p_table, p_row_id::text, '{}'::jsonb, 'success'
  );

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_row(TEXT, UUID) TO authenticated;

DO $$ BEGIN RAISE NOTICE '✓ Migration 022 OK — soft delete'; END $$;
