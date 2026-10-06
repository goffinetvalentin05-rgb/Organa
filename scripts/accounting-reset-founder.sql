-- Prévisualisation de la comptabilité partagée du club Obillz.
-- Identifiant : 657c2be5-6b67-4ef3-96fa-130e68cbc229
-- profiles est lu par user_id. Aucune adresse n'est recherchée.
--
-- Ce script ne modifie aucune donnée.
-- Il ne désactive aucun déclencheur, aucune contrainte et aucune policy.
-- Il ne prend aucun rôle, en particulier pas supabase_storage_admin.
-- accounting_settings n'a pas de colonne id (clé : club_id).
-- accounting_account_group_members n'a pas de colonne id (clé : group_id, account_id).
-- N'ajoutez pas d'instruction d'exécution en dehors de ce bloc.

DO $$
DECLARE
  v_club CONSTANT UUID := '657c2be5-6b67-4ef3-96fa-130e68cbc229';
  v_expected_name CONSTANT TEXT := 'Obillz';
  v_expected_other_members CONSTANT INTEGER := 2;
  v_label TEXT;
  v_founder BOOLEAN;
  v_other_members INTEGER;
  v_members TEXT;
  v_summary TEXT := '';
  v_count INTEGER;
  r RECORD;
BEGIN
  IF v_club IS DISTINCT FROM '657c2be5-6b67-4ef3-96fa-130e68cbc229'::UUID THEN
    RAISE EXCEPTION 'Identifiant de club inattendu. Aucune donnée modifiée.';
  END IF;

  SELECT company_name, is_founder
  INTO v_label, v_founder
  FROM public.profiles
  WHERE user_id = v_club;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun profil dont user_id = %. Aucune donnée modifiée.', v_club;
  END IF;

  IF v_founder IS NOT TRUE THEN
    RAISE EXCEPTION 'Le profil % (%) n''a pas is_founder. Aucune donnée modifiée.', v_club, COALESCE(v_label, '(sans nom)');
  END IF;

  IF btrim(COALESCE(v_label, '')) IS DISTINCT FROM v_expected_name THEN
    RAISE EXCEPTION 'Le profil % s''appelle « % ». Le nom attendu est %. Aucune donnée modifiée.', v_club, COALESCE(v_label, '(sans nom)'), v_expected_name;
  END IF;

  SELECT COUNT(*), string_agg(format('%s | %s | %s', m.user_id, m.role, u.email), E'\n' ORDER BY u.email)
  INTO v_other_members, v_members
  FROM public.club_memberships m
  JOIN auth.users u ON u.id = m.user_id
  WHERE m.club_id = v_club
    AND m.user_id <> v_club
    AND m.deleted_at IS NULL
    AND m.status = 'active';

  IF v_other_members IS DISTINCT FROM v_expected_other_members THEN
    RAISE EXCEPTION E'Le club % a % autre(s) membre(s) actif(s), le périmètre confirmé en attend %. Aucune donnée modifiée.\n%',
      v_club, COALESCE(v_other_members, 0), v_expected_other_members, COALESCE(v_members, '(aucun)');
  END IF;

  FOR r IN
    SELECT table_name
    FROM (VALUES
      ('accounting_settings'),
      ('accounting_accounts'),
      ('accounting_mappings'),
      ('accounting_periods'),
      ('accounting_entries'),
      ('accounting_entry_lines'),
      ('accounting_inbox'),
      ('accounting_audit_log'),
      ('accounting_attachments'),
      ('accounting_history_imports'),
      ('accounting_open_items'),
      ('accounting_account_groups'),
      ('accounting_account_group_members'),
      ('accounting_budgets'),
      ('accounting_budget_lines'),
      ('document_receipts'),
      ('finance_payments'),
      ('accounting_stripe_payouts')
    ) AS listed(table_name)
  LOOP
    IF to_regclass('public.' || r.table_name) IS NULL THEN
      v_summary := v_summary || format(E'\n%s : table absente', r.table_name);
      CONTINUE;
    END IF;
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE club_id = $1', r.table_name) INTO v_count USING v_club;
    v_summary := v_summary || format(E'\n%s : %s', r.table_name, v_count);
  END LOOP;

  RAISE EXCEPTION E'Prévisualisation seulement. Aucune donnée modifiée.\nClub % — %\nComptabilité partagée par ce club_id. Autres membres actifs : %\n%\nVolumes :%\nLes écritures retirées restent immuables. Le script ne désactive pas ce verrou et n''efface rien.',
    v_club, v_label, v_other_members, v_members, v_summary;
END $$;
