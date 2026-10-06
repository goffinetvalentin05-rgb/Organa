-- Lecture seule. À lancer après la migration 108, sur la base où elle a été appliquée.
-- Ne crée rien. Ne pas l'exécuter contre la production pour simuler une attaque.
-- has_function_privilege inclut le droit hérité par PUBLIC.

SELECT p.proname AS fonction,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
       p.prorettype = 'pg_catalog.trigger'::regtype AS est_declencheur
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname LIKE 'accounting\_%' ESCAPE '\'
ORDER BY p.proname, 2;

-- Attendu pour accounting_enqueue, accounting_place_entry_number,
-- accounting_compact_entry_numbers, accounting_seed_period_numbers,
-- accounting_resolve_payout_bank, accounting_post_pending_payouts :
-- anon_execute = false, authenticated_execute = false, service_role_execute = true.
-- Même attente pour toute autre fonction accounting_ dont est_declencheur est faux.

SELECT policyname, cmd, roles::text, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname ILIKE '%expenses%'
    OR COALESCE(qual, '') ILIKE '%expenses%'
    OR COALESCE(with_check, '') ILIKE '%expenses%'
  )
ORDER BY policyname;

-- Attendu : expenses_select_member exclut le segment accounting.
-- expenses_accounting_select contient view_accounting.
-- expenses_accounting_insert contient manage_accounting.
-- expenses1301vyz et expenses1301vyz_1 sont absentes.
-- Aucune policy restante sur expenses ne se limite à
-- bucket_id = 'expenses' AND auth.role() = 'authenticated'.
