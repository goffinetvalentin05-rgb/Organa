-- ============================================
-- MIGRATION 023 : RLS strictes basées sur club_memberships + rôles
-- ============================================
-- Cette migration RÉÉCRIT TOUTES les RLS des tables métier pour passer du
-- modèle "auth.uid() = user_id" (mono-utilisateur) au modèle multi-rôles
-- via club_memberships (introduit en migration 020).
--
-- Convention : dans toutes les tables existantes, la colonne `user_id`
-- (ou `club_id` pour quelques tables marketing/buvette) porte en réalité
-- l'identifiant du CLUB. Les RLS appellent les helpers
-- public.is_club_member/admin/staff/owner pour vérifier l'appartenance.
--
-- Matrice par défaut :
--   SELECT  : tout membre actif du club
--   INSERT  : staff (owner/admin/committee)
--   UPDATE  : staff
--   DELETE  : owner uniquement (préférer soft delete)
--
-- IDEMPOTENT et DÉFENSIVE :
--   - Skip silencieux si une table n'existe pas dans la base courante.
--   - Skip silencieux si la colonne deleted_at n'a pas été ajoutée.
--   - Drop AUTOMATIQUE de toutes les anciennes policies sur la table
--     avant de poser les nouvelles (évite tout conflit de noms historiques).
-- ============================================

-- ============================================
-- HELPERS TEMPORAIRES (déclarés dans pg_temp, jetables en fin de session)
-- ============================================

-- Drop toutes les policies existantes sur une table pour repartir d'une base propre
CREATE OR REPLACE FUNCTION pg_temp.drop_all_policies(p_table TEXT)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, p_table);
  END LOOP;
END;
$fn$;

-- Vérifie qu'une table existe dans le schéma public
CREATE OR REPLACE FUNCTION pg_temp.table_exists(p_table TEXT)
RETURNS boolean
LANGUAGE sql
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  );
$fn$;

-- Vérifie qu'une colonne existe sur une table publique
CREATE OR REPLACE FUNCTION pg_temp.column_exists(p_table TEXT, p_column TEXT)
RETURNS boolean
LANGUAGE sql
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  );
$fn$;

-- Applique les 4 policies standard pour une table racine (avec scope_col = user_id ou club_id)
CREATE OR REPLACE FUNCTION pg_temp.apply_root_rls(
  p_table TEXT,
  p_scope_col TEXT,             -- 'user_id' ou 'club_id'
  p_select_min_role TEXT DEFAULT 'member',  -- 'member' ou 'admin' ou 'staff'
  p_delete_role TEXT DEFAULT 'owner'        -- 'owner' ou 'staff'
)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_select_clause TEXT;
  v_delete_clause TEXT;
  v_has_deleted_at BOOLEAN;
BEGIN
  IF NOT pg_temp.table_exists(p_table) THEN
    RAISE NOTICE '⊘ Table public.% absente, skip RLS', p_table;
    RETURN;
  END IF;

  -- Vérifier que la colonne de scope existe sur la table
  IF NOT pg_temp.column_exists(p_table, p_scope_col) THEN
    RAISE NOTICE '⊘ Table public.% sans colonne %, skip RLS (à traiter manuellement)',
      p_table, p_scope_col;
    RETURN;
  END IF;

  -- Drop tout ce qui existe (anciens noms historiques + nouveaux noms idempotents)
  PERFORM pg_temp.drop_all_policies(p_table);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

  v_has_deleted_at := pg_temp.column_exists(p_table, 'deleted_at');

  -- SELECT
  v_select_clause := CASE p_select_min_role
    WHEN 'admin' THEN format('public.is_club_admin(%I)', p_scope_col)
    WHEN 'staff' THEN format('public.is_club_staff(%I)', p_scope_col)
    ELSE format('public.is_club_member(%I)', p_scope_col)
  END;

  IF v_has_deleted_at THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (%s AND deleted_at IS NULL)',
      p_table || '_select', p_table, v_select_clause
    );
  ELSE
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (%s)',
      p_table || '_select', p_table, v_select_clause
    );
  END IF;

  -- INSERT : staff
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_club_staff(%I))',
    p_table || '_insert_staff', p_table, p_scope_col
  );

  -- UPDATE : staff
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_club_staff(%I)) WITH CHECK (public.is_club_staff(%I))',
    p_table || '_update_staff', p_table, p_scope_col, p_scope_col
  );

  -- DELETE
  v_delete_clause := CASE p_delete_role
    WHEN 'staff' THEN format('public.is_club_staff(%I)', p_scope_col)
    ELSE format('public.is_club_owner(%I)', p_scope_col)
  END;

  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR DELETE USING (%s)',
    p_table || '_delete', p_table, v_delete_clause
  );

  RAISE NOTICE '✓ RLS appliquées sur %', p_table;
END;
$fn$;

-- ============================================
-- 1) profiles — règle particulière : INSERT par soi-même (pas par staff)
-- ============================================
DO $$
BEGIN
  IF NOT pg_temp.table_exists('profiles') THEN
    RAISE NOTICE '⊘ Table profiles absente, skip';
    RETURN;
  END IF;

  PERFORM pg_temp.drop_all_policies('profiles');
  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

  IF pg_temp.column_exists('profiles', 'deleted_at') THEN
    EXECUTE $sql$
      CREATE POLICY "profiles_select_member"
        ON public.profiles FOR SELECT
        USING (public.is_club_member(user_id) AND deleted_at IS NULL)
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY "profiles_select_member"
        ON public.profiles FOR SELECT
        USING (public.is_club_member(user_id))
    $sql$;
  END IF;

  -- INSERT : la première création de profile se fait par l'utilisateur lui-même
  EXECUTE $sql$
    CREATE POLICY "profiles_insert_self"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id)
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "profiles_update_admin"
      ON public.profiles FOR UPDATE
      USING (public.is_club_admin(user_id))
      WITH CHECK (public.is_club_admin(user_id))
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "profiles_delete_owner"
      ON public.profiles FOR DELETE
      USING (public.is_club_owner(user_id))
  $sql$;

  RAISE NOTICE '✓ RLS profiles OK';
END $$;

-- ============================================
-- 2) Tables racines simples (scope = user_id, modèle standard)
-- ============================================
DO $$
DECLARE
  rec TEXT[];
  -- Liste des tables racines avec colonne `user_id` à scope.
  -- (table, select_min_role, delete_role)
  tables_root_user TEXT[] := ARRAY[
    'clients|member|owner',
    'documents|member|owner',
    'event_types|member|owner',
    'events|member|owner',
    'plannings|member|owner',
    'depenses|member|owner',
    'expenses|member|owner',
    'email_history|admin|owner',
    'qrcodes|member|owner',
    'buvette_slots|member|staff',
    'buvette_requests|member|owner',
    'club_revenues|member|owner'
  ];
  v_entry TEXT;
BEGIN
  FOREACH v_entry IN ARRAY tables_root_user LOOP
    rec := string_to_array(v_entry, '|');
    PERFORM pg_temp.apply_root_rls(rec[1], 'user_id', rec[2], rec[3]);
  END LOOP;
END $$;

-- ============================================
-- 3) Tables racines marketing (scope = club_id)
-- ============================================
DO $$
DECLARE
  rec TEXT[];
  tables_root_club TEXT[] := ARRAY[
    'marketing_contacts|member|owner',
    'marketing_campaigns|member|owner',
    'public_planning_links|member|staff'
    -- marketing_campaign_recipients est traitée séparément (table semi-enfant
    -- avec club_id direct mais aussi liée à une campagne)
  ];
  v_entry TEXT;
BEGIN
  FOREACH v_entry IN ARRAY tables_root_club LOOP
    rec := string_to_array(v_entry, '|');
    PERFORM pg_temp.apply_root_rls(rec[1], 'club_id', rec[2], rec[3]);
  END LOOP;
END $$;

-- ============================================
-- 4) marketing_campaign_recipients (club_id direct)
-- ============================================
DO $$
BEGIN
  IF NOT pg_temp.table_exists('marketing_campaign_recipients') THEN
    RAISE NOTICE '⊘ Table marketing_campaign_recipients absente, skip';
    RETURN;
  END IF;
  PERFORM pg_temp.apply_root_rls('marketing_campaign_recipients', 'club_id', 'member', 'owner');
END $$;

-- ============================================
-- 5) planning_slots (enfant de plannings)
-- ============================================
DO $$
DECLARE
  v_has_deleted_at BOOLEAN;
BEGIN
  IF NOT pg_temp.table_exists('planning_slots') THEN
    RAISE NOTICE '⊘ Table planning_slots absente, skip';
    RETURN;
  END IF;
  PERFORM pg_temp.drop_all_policies('planning_slots');
  EXECUTE 'ALTER TABLE public.planning_slots ENABLE ROW LEVEL SECURITY';
  v_has_deleted_at := pg_temp.column_exists('planning_slots', 'deleted_at');

  IF v_has_deleted_at THEN
    EXECUTE $sql$
      CREATE POLICY "planning_slots_select"
        ON public.planning_slots FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.plannings p
            WHERE p.id = planning_slots.planning_id
              AND public.is_club_member(p.user_id)
          )
          AND deleted_at IS NULL
        )
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY "planning_slots_select"
        ON public.planning_slots FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.plannings p
            WHERE p.id = planning_slots.planning_id
              AND public.is_club_member(p.user_id)
          )
        )
    $sql$;
  END IF;

  EXECUTE $sql$
    CREATE POLICY "planning_slots_insert_staff"
      ON public.planning_slots FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.plannings p
          WHERE p.id = planning_slots.planning_id
            AND public.is_club_staff(p.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "planning_slots_update_staff"
      ON public.planning_slots FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.plannings p
          WHERE p.id = planning_slots.planning_id
            AND public.is_club_staff(p.user_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.plannings p
          WHERE p.id = planning_slots.planning_id
            AND public.is_club_staff(p.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "planning_slots_delete_staff"
      ON public.planning_slots FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.plannings p
          WHERE p.id = planning_slots.planning_id
            AND public.is_club_staff(p.user_id)
        )
      )
  $sql$;

  RAISE NOTICE '✓ RLS planning_slots OK';
END $$;

-- ============================================
-- 6) planning_assignments (enfant de planning_slots)
-- ============================================
DO $$
BEGIN
  IF NOT pg_temp.table_exists('planning_assignments') THEN
    RAISE NOTICE '⊘ Table planning_assignments absente, skip';
    RETURN;
  END IF;

  PERFORM pg_temp.drop_all_policies('planning_assignments');
  EXECUTE 'ALTER TABLE public.planning_assignments ENABLE ROW LEVEL SECURITY';

  EXECUTE $sql$
    CREATE POLICY "planning_assignments_select"
      ON public.planning_assignments FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.planning_slots s
          JOIN public.plannings p ON p.id = s.planning_id
          WHERE s.id = planning_assignments.slot_id
            AND public.is_club_member(p.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "planning_assignments_insert_staff"
      ON public.planning_assignments FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.planning_slots s
          JOIN public.plannings p ON p.id = s.planning_id
          WHERE s.id = planning_assignments.slot_id
            AND public.is_club_staff(p.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "planning_assignments_update_staff"
      ON public.planning_assignments FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.planning_slots s
          JOIN public.plannings p ON p.id = s.planning_id
          WHERE s.id = planning_assignments.slot_id
            AND public.is_club_staff(p.user_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.planning_slots s
          JOIN public.plannings p ON p.id = s.planning_id
          WHERE s.id = planning_assignments.slot_id
            AND public.is_club_staff(p.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "planning_assignments_delete_staff"
      ON public.planning_assignments FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.planning_slots s
          JOIN public.plannings p ON p.id = s.planning_id
          WHERE s.id = planning_assignments.slot_id
            AND public.is_club_staff(p.user_id)
        )
      )
  $sql$;

  RAISE NOTICE '✓ RLS planning_assignments OK';
END $$;

-- ============================================
-- 7) registrations (enfant de qrcodes — pas d'INSERT public)
-- ============================================
-- L'INSERT public direct (USING true) est SUPPRIMÉ.
-- Désormais le POST passe obligatoirement par /api/registrations qui utilise
-- service_role + rate-limit + validation. Les staffs du club peuvent aussi
-- insérer manuellement.
DO $$
BEGIN
  IF NOT pg_temp.table_exists('registrations') THEN
    RAISE NOTICE '⊘ Table registrations absente, skip';
    RETURN;
  END IF;

  PERFORM pg_temp.drop_all_policies('registrations');
  EXECUTE 'ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY';

  EXECUTE $sql$
    CREATE POLICY "registrations_select_staff"
      ON public.registrations FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.qrcodes q
          WHERE q.id = registrations.qrcode_id
            AND public.is_club_member(q.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "registrations_insert_staff"
      ON public.registrations FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.qrcodes q
          WHERE q.id = registrations.qrcode_id
            AND public.is_club_staff(q.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "registrations_update_staff"
      ON public.registrations FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.qrcodes q
          WHERE q.id = registrations.qrcode_id
            AND public.is_club_staff(q.user_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.qrcodes q
          WHERE q.id = registrations.qrcode_id
            AND public.is_club_staff(q.user_id)
        )
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "registrations_delete_staff"
      ON public.registrations FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.qrcodes q
          WHERE q.id = registrations.qrcode_id
            AND public.is_club_staff(q.user_id)
        )
      )
  $sql$;

  RAISE NOTICE '✓ RLS registrations OK (INSERT public retiré)';
END $$;

-- ============================================
-- 8) Override : email_history n'autorise PAS UPDATE (audit trail)
-- ============================================
DO $$
BEGIN
  IF NOT pg_temp.table_exists('email_history') THEN
    RETURN;
  END IF;

  -- On supprime l'éventuelle policy update_staff posée plus haut
  EXECUTE 'DROP POLICY IF EXISTS "email_history_update_staff" ON public.email_history';

  EXECUTE $sql$
    CREATE POLICY "email_history_no_update"
      ON public.email_history FOR UPDATE
      USING (false) WITH CHECK (false)
  $sql$;

  RAISE NOTICE '✓ Override : email_history UPDATE bloqué';
END $$;

DO $$ BEGIN RAISE NOTICE '✓ Migration 023 OK — RLS strictes club-scoped'; END $$;
