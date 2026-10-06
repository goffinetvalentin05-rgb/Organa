-- Comptabilité : EXECUTE des fonctions service, et pièces du préfixe accounting/.
-- Sans contrôle de session dans le corps. Les appels légitimes viennent du rôle service
-- ou d'un déclencheur SECURITY DEFINER, sans session utilisateur.
-- Ne déplace et ne supprime aucun fichier.
--
-- Contrôle en lecture seule, après application, avec un rôle qui voit pg_proc
-- (postgres ou service_role via SQL, pas via un JWT utilisateur) :
--
-- SELECT p.proname AS fonction,
--        pg_get_function_identity_arguments(p.oid) AS arguments,
--        has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
--        has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
--        p.prorettype = 'pg_catalog.trigger'::regtype AS est_declencheur
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname LIKE 'accounting\_%' ESCAPE '\'
-- ORDER BY p.proname, 2;
--
-- has_function_privilege tient compte du droit hérité via PUBLIC.
-- Pour les six fonctions ci-dessous : anon_execute et authenticated_execute
-- doivent être faux, service_role_execute vrai.
-- Les autres fonctions accounting_ appelables (retour autre que trigger)
-- doivent suivre la même règle. Un déclencheur peut encore montrer
-- authenticated_execute vrai : il n'est pas un RPC.
--
-- Policies storage :
-- SELECT policyname, cmd, roles::text, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
--   AND (qual ILIKE '%expenses%' OR with_check ILIKE '%expenses%'
--        OR policyname ILIKE '%expenses%')
-- ORDER BY policyname;
--
-- expenses_select_member ne doit plus couvrir le second segment accounting.
-- expenses_accounting_select exige view_accounting.
-- expenses_accounting_insert exige manage_accounting.

-- Fonctions déjà révoquées pour anon et authenticated dans les migrations
-- 091 à 107 : accounting_post_entry, accounting_finalize_onboarding,
-- accounting_update_advanced_entry, accounting_update_pending_entry,
-- accounting_void_journal_entry, accounting_record_document_receipt
-- (les deux signatures), accounting_record_finance_payment,
-- accounting_close_period, accounting_record_stripe_payout,
-- accounting_finish_support_sale, accounting_open_following_period,
-- accounting_record_transitory_receipt, accounting_void_receipt_bridge,
-- accounting_resolve_account, accounting_finalize_takeover,
-- accounting_apply_history_import, accounting_settle_open_item.
-- Aucune autre fonction accounting_ callable créée depuis n'a été oubliée.

REVOKE ALL ON FUNCTION public.accounting_enqueue(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_enqueue(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_enqueue(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_enqueue(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.accounting_place_entry_number(UUID, TEXT, INTEGER, UUID, BOOLEAN, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_place_entry_number(UUID, TEXT, INTEGER, UUID, BOOLEAN, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_place_entry_number(UUID, TEXT, INTEGER, UUID, BOOLEAN, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_place_entry_number(UUID, TEXT, INTEGER, UUID, BOOLEAN, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.accounting_compact_entry_numbers(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_compact_entry_numbers(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_compact_entry_numbers(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_compact_entry_numbers(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.accounting_seed_period_numbers(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_seed_period_numbers(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_seed_period_numbers(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_seed_period_numbers(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.accounting_resolve_payout_bank(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_resolve_payout_bank(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_resolve_payout_bank(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_resolve_payout_bank(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.accounting_post_pending_payouts(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_post_pending_payouts(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_post_pending_payouts(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_post_pending_payouts(UUID, UUID) TO service_role;

-- Surcharges éventuelles des mêmes noms, au-delà des signatures ci-dessus.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'accounting_enqueue',
        'accounting_place_entry_number',
        'accounting_compact_entry_numbers',
        'accounting_seed_period_numbers',
        'accounting_resolve_payout_bank',
        'accounting_post_pending_payouts'
      )
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      fn.schema_name, fn.function_name, fn.arguments
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',
      fn.schema_name, fn.function_name, fn.arguments
    );
  END LOOP;
END $$;

-- Le second segment du chemin est accounting : {club}/accounting/{écriture}/fichier.
-- Les policies historiques du bucket expenses sont permissives et se cumulent
-- en OU. Elles doivent exclure ce préfixe, sinon un membre ou un staff
-- continue de lire ou d'ajouter ces fichiers.
DO $policies$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "expenses_select_member" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_insert_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_update_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_delete_staff" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_accounting_select" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_accounting_insert" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_accounting_update" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "expenses_accounting_delete" ON storage.objects';

  EXECUTE $sql$
    CREATE POLICY "expenses_select_member"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) IS DISTINCT FROM 'accounting'
        AND public.is_club_member(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_insert_staff"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) IS DISTINCT FROM 'accounting'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_update_staff"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) IS DISTINCT FROM 'accounting'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
      WITH CHECK (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) IS DISTINCT FROM 'accounting'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_delete_staff"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) IS DISTINCT FROM 'accounting'
        AND public.is_club_staff(public.storage_path_club_id(name))
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_accounting_select"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) = 'accounting'
        AND public.has_club_permission(public.storage_path_club_id(name), 'view_accounting')
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_accounting_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) = 'accounting'
        AND public.has_club_permission(public.storage_path_club_id(name), 'manage_accounting')
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_accounting_update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) = 'accounting'
        AND public.has_club_permission(public.storage_path_club_id(name), 'manage_accounting')
      )
      WITH CHECK (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) = 'accounting'
        AND public.has_club_permission(public.storage_path_club_id(name), 'manage_accounting')
      )
  $sql$;

  EXECUTE $sql$
    CREATE POLICY "expenses_accounting_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'expenses'
        AND public.storage_path_club_id(name) IS NOT NULL
        AND lower(split_part(name, '/', 2)) = 'accounting'
        AND public.has_club_permission(public.storage_path_club_id(name), 'manage_accounting')
      )
  $sql$;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING '108 : policies storage expenses non écrites (privilège). Les appliquer dans le dashboard, sinon le préfixe accounting/ reste couvert par les anciennes policies.';
END
$policies$;
