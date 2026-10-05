-- Réinitialisation de la comptabilité partagée du club Obillz.
-- Identifiant résolu par la prévisualisation : 657c2be5-6b67-4ef3-96fa-130e68cbc229
-- profiles est lu par user_id. Aucune adresse n'est recherchée.
--
-- La comptabilité est une seule série de lignes pour ce club_id.
-- Les autres membres actifs la voient aussi. Le script ne retire personne.
--
-- Prévisualisation par défaut. Pour exécuter après confirmation du périmètre
-- partagé, passer v_execute et v_confirm_shared à TRUE, puis relancer.
-- Toute erreur annule la transaction, sauvegarde comprise.

DO $$
DECLARE
  v_club CONSTANT UUID := '657c2be5-6b67-4ef3-96fa-130e68cbc229';
  v_expected_name CONSTANT TEXT := 'Obillz';
  v_expected_other_members CONSTANT INTEGER := 2;
  v_execute CONSTANT BOOLEAN := FALSE;
  v_confirm_shared CONSTANT BOOLEAN := FALSE;
  v_label TEXT;
  v_founder BOOLEAN;
  v_plan TEXT;
  v_label_after TEXT;
  v_founder_after BOOLEAN;
  v_plan_after TEXT;
  v_other_members INTEGER;
  v_members TEXT;
  v_summary TEXT := '';
  v_count INTEGER;
  v_archive UUID;
  v_anchor UUID;
  v_entries_elsewhere INTEGER;
  v_memberships_before INTEGER;
  v_documents_before INTEGER;
  v_receipts_before INTEGER := 0;
  v_finance_before INTEGER := 0;
  v_payouts_before INTEGER := 0;
  v_memberships_after INTEGER;
  v_documents_after INTEGER;
  v_receipts_after INTEGER := 0;
  v_finance_after INTEGER := 0;
  v_payouts_after INTEGER := 0;
  v_entries_after INTEGER;
  r RECORD;
BEGIN
  IF v_club IS DISTINCT FROM '657c2be5-6b67-4ef3-96fa-130e68cbc229'::UUID THEN
    RAISE EXCEPTION 'Identifiant de club inattendu. Aucune donnée modifiée.';
  END IF;

  SELECT company_name, is_founder, plan
  INTO v_label, v_founder, v_plan
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
    SELECT * FROM (VALUES
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
    ) AS t(name)
  LOOP
    IF to_regclass('public.' || r.name) IS NULL THEN
      v_summary := v_summary || format(E'\n%s : table absente', r.name);
      CONTINUE;
    END IF;
    EXECUTE format('SELECT COUNT(*) FROM public.%I WHERE club_id = $1', r.name) INTO v_count USING v_club;
    v_summary := v_summary || format(E'\n%s : %s', r.name, v_count);
  END LOOP;

  IF v_execute IS NOT TRUE OR v_confirm_shared IS NOT TRUE THEN
    RAISE EXCEPTION E'Prévisualisation seulement. Aucune donnée modifiée.\nClub % — %\nComptabilité partagée par ce club_id. Autres membres actifs : %\n%\nVolumes :%\nPour exécuter, passer v_execute et v_confirm_shared à TRUE.',
      v_club, v_label, v_other_members, v_members, v_summary;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE club_id = v_club AND starts_on = DATE '1900-01-01'
  ) THEN
    RAISE EXCEPTION 'La date d''archive 1900-01-01 est déjà un exercice du club %. Aucune donnée modifiée.', v_club;
  END IF;

  SELECT COUNT(*) INTO v_entries_elsewhere FROM public.accounting_entries WHERE club_id <> v_club;
  SELECT COUNT(*) INTO v_memberships_before FROM public.club_memberships WHERE club_id = v_club;
  SELECT COUNT(*) INTO v_documents_before FROM public.documents WHERE user_id = v_club;

  IF to_regclass('public.document_receipts') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_receipts_before FROM public.document_receipts WHERE club_id = v_club;
  END IF;
  IF to_regclass('public.finance_payments') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_finance_before FROM public.finance_payments WHERE club_id = v_club;
  END IF;
  IF to_regclass('public.accounting_stripe_payouts') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_payouts_before FROM public.accounting_stripe_payouts WHERE club_id = v_club;
  END IF;

  EXECUTE 'CREATE SCHEMA IF NOT EXISTS accounting_reset_backup';
  EXECUTE format(
    'CREATE TABLE accounting_reset_backup.run_%s (table_name TEXT, row_data JSONB)',
    replace(v_club::text, '-', '')
  );

  FOR r IN
    SELECT * FROM (VALUES
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
    ) AS t(name)
  LOOP
    IF to_regclass('public.' || r.name) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format(
      'INSERT INTO accounting_reset_backup.run_%s (table_name, row_data)
       SELECT %L, to_jsonb(s) FROM public.%I s WHERE s.club_id = $1',
      replace(v_club::text, '-', ''),
      r.name,
      r.name
    ) USING v_club;
  END LOOP;

  INSERT INTO public.accounting_inbox (
    club_id, idempotency_key, source_type, source_id, event_type, direction,
    amount, entry_date, description, status
  )
  SELECT DISTINCT ON (e.source_type, e.source_id, e.event_type)
    e.club_id,
    e.source_type || ':' || e.source_id::TEXT || ':' || e.event_type,
    e.source_type,
    e.source_id,
    e.event_type,
    CASE WHEN e.direction IN ('in', 'out') THEN e.direction ELSE 'in' END,
    e.amount,
    e.entry_date,
    e.description,
    'posted'
  FROM public.accounting_entries e
  WHERE e.club_id = v_club
    AND e.source_id IS NOT NULL
    AND e.event_type IN ('payment_received', 'payment_sent')
  AND NOT EXISTS (
      SELECT 1 FROM public.accounting_inbox i
      WHERE i.club_id = e.club_id
        AND i.source_type = e.source_type
        AND i.source_id = e.source_id
        AND i.event_type = e.event_type
    )
  ORDER BY e.source_type, e.source_id, e.event_type, e.created_at
  ON CONFLICT (club_id, idempotency_key) DO NOTHING;

  UPDATE public.accounting_inbox
  SET status = 'posted', updated_at = NOW()
  WHERE club_id = v_club
    AND event_type IN ('payment_received', 'payment_sent')
    AND status IS DISTINCT FROM 'posted';

  INSERT INTO public.accounting_periods (club_id, label, starts_on, ends_on, status, closed_at)
  VALUES (
    v_club,
    'Archive technique — hors exercices',
    DATE '1900-01-01',
    DATE '1900-01-01',
    'closed',
    NOW()
  )
  RETURNING id INTO v_archive;

  INSERT INTO public.accounting_entries (
    club_id, period_id, entry_number, entry_date, description, amount, direction,
    source_type, event_type, idempotency_key, status
  ) VALUES (
    v_club,
    v_archive,
    1,
    DATE '1900-01-01',
    'Ancre technique des versements Stripe déjà enregistrés. Écartée du journal et des rapports.',
    0,
    'opening',
    'stripe_payout_anchor',
    'anchor',
    'accounting-reset-tombstone',
    'voided'
  )
  RETURNING id INTO v_anchor;

  IF to_regclass('public.accounting_stripe_payouts') IS NOT NULL THEN
    UPDATE public.accounting_stripe_payouts
    SET entry_id = v_anchor, status = 'posted', bank_account_id = NULL
    WHERE club_id = v_club;
  END IF;

  IF to_regclass('public.document_receipts') IS NOT NULL THEN
    UPDATE public.document_receipts
    SET entry_id = NULL
    WHERE club_id = v_club AND entry_id IS NOT NULL;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'document_receipts' AND column_name = 'accrual_entry_id'
    ) THEN
      UPDATE public.document_receipts
      SET accrual_entry_id = NULL, release_entry_id = NULL
      WHERE club_id = v_club;
    END IF;
  END IF;

  IF to_regclass('public.finance_payments') IS NOT NULL THEN
    UPDATE public.finance_payments
    SET entry_id = NULL
    WHERE club_id = v_club AND entry_id IS NOT NULL;
  END IF;

  IF to_regclass('public.accounting_attachments') IS NOT NULL THEN
    DELETE FROM public.accounting_attachments WHERE club_id = v_club;
  END IF;

  -- Les écritures déjà écartées et les exercices clos interdisent la suppression
  -- de leurs lignes. Le verrou est levé seulement dans cette transaction.
  ALTER TABLE public.accounting_entry_lines DISABLE TRIGGER accounting_lines_guard;
  ALTER TABLE public.accounting_entries DISABLE TRIGGER accounting_entries_guard;

  DELETE FROM public.accounting_entry_lines WHERE club_id = v_club AND entry_id <> v_anchor;

  UPDATE public.accounting_entries
  SET reversal_of_entry_id = NULL
  WHERE club_id = v_club AND reversal_of_entry_id IS NOT NULL;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounting_entries' AND column_name = 'reversed_by_entry_id'
  ) THEN
    EXECUTE 'UPDATE public.accounting_entries SET reversed_by_entry_id = NULL WHERE club_id = $1' USING v_club;
  END IF;

  UPDATE public.accounting_entries
  SET counter_account_id = NULL, category_account_id = NULL
  WHERE club_id = v_club AND id <> v_anchor;

  DELETE FROM public.accounting_entries WHERE club_id = v_club AND id <> v_anchor;

  ALTER TABLE public.accounting_entry_lines ENABLE TRIGGER accounting_lines_guard;
  ALTER TABLE public.accounting_entries ENABLE TRIGGER accounting_entries_guard;

  IF to_regclass('public.accounting_budget_lines') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.accounting_budget_lines WHERE club_id = $1' USING v_club;
  END IF;
  IF to_regclass('public.accounting_budgets') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.accounting_budgets WHERE club_id = $1' USING v_club;
  END IF;
  IF to_regclass('public.accounting_account_group_members') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.accounting_account_group_members WHERE club_id = $1' USING v_club;
  END IF;
  IF to_regclass('public.accounting_account_groups') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.accounting_account_groups WHERE club_id = $1' USING v_club;
  END IF;
  IF to_regclass('public.accounting_open_items') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.accounting_open_items WHERE club_id = $1' USING v_club;
  END IF;
  IF to_regclass('public.accounting_history_imports') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.accounting_history_imports WHERE club_id = $1' USING v_club;
  END IF;

  DELETE FROM public.accounting_audit_log WHERE club_id = v_club;
  DELETE FROM public.accounting_periods WHERE club_id = v_club AND id <> v_archive;
  DELETE FROM public.accounting_mappings WHERE club_id = v_club;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'accounting_settings' AND column_name = 'stripe_payout_account_id'
  ) THEN
    EXECUTE 'UPDATE public.accounting_settings SET stripe_payout_account_id = NULL WHERE club_id = $1' USING v_club;
  END IF;

  EXECUTE format(
    'DELETE FROM public.accounting_accounts a WHERE a.club_id = $1 %s %s',
    CASE WHEN to_regclass('public.document_receipts') IS NULL THEN ''
      ELSE 'AND NOT EXISTS (SELECT 1 FROM public.document_receipts r WHERE r.account_id = a.id)' END,
    CASE WHEN to_regclass('public.finance_payments') IS NULL THEN ''
      ELSE 'AND NOT EXISTS (SELECT 1 FROM public.finance_payments f WHERE f.account_id = a.id OR f.category_account_id = a.id)' END
  ) USING v_club;

  UPDATE public.accounting_settings
  SET
    onboarding_completed_at = NULL,
    opening_confirmed_at = NULL,
    start_mode = NULL,
    history_import_status = 'not_requested',
    coverage_type = 'full_period',
    updated_at = NOW()
  WHERE club_id = v_club;

  IF (SELECT COUNT(*) FROM public.accounting_entries WHERE club_id <> v_club) <> v_entries_elsewhere THEN
    RAISE EXCEPTION 'Des écritures d''un autre club ont changé. Annulation.';
  END IF;

  SELECT COUNT(*) INTO v_entries_after FROM public.accounting_entries WHERE club_id = v_club;
  IF v_entries_after <> 1 THEN
    RAISE EXCEPTION 'Le club ciblé devrait conserver une seule écriture d''ancre, % trouvées.', v_entries_after;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.accounting_entries
    WHERE club_id = v_club AND (id <> v_anchor OR status <> 'voided' OR period_id <> v_archive)
  ) THEN
    RAISE EXCEPTION 'L''ancre du club ciblé est invalide. Annulation.';
  END IF;

  SELECT COUNT(*) INTO v_memberships_after FROM public.club_memberships WHERE club_id = v_club;
  SELECT COUNT(*) INTO v_documents_after FROM public.documents WHERE user_id = v_club;
  IF v_memberships_after <> v_memberships_before OR v_documents_after <> v_documents_before THEN
    RAISE EXCEPTION 'Des appartenances ou des documents ont changé. Annulation.';
  END IF;

  SELECT company_name, is_founder, plan
  INTO v_label_after, v_founder_after, v_plan_after
  FROM public.profiles
  WHERE user_id = v_club;
  IF v_label_after IS DISTINCT FROM v_label OR v_founder_after IS DISTINCT FROM v_founder OR v_plan_after IS DISTINCT FROM v_plan THEN
    RAISE EXCEPTION 'Le profil du club a changé. Annulation.';
  END IF;

  IF to_regclass('public.document_receipts') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_receipts_after FROM public.document_receipts WHERE club_id = v_club;
  END IF;
  IF to_regclass('public.finance_payments') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_finance_after FROM public.finance_payments WHERE club_id = v_club;
  END IF;
  IF to_regclass('public.accounting_stripe_payouts') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_payouts_after FROM public.accounting_stripe_payouts WHERE club_id = v_club;
    IF EXISTS (
      SELECT 1 FROM public.accounting_stripe_payouts
      WHERE club_id = v_club AND (status IS DISTINCT FROM 'posted' OR entry_id IS DISTINCT FROM v_anchor)
    ) THEN
      RAISE EXCEPTION 'Un versement Stripe du club ciblé n''est plus protégé. Annulation.';
    END IF;
  END IF;

  IF v_receipts_after <> v_receipts_before OR v_finance_after <> v_finance_before OR v_payouts_after <> v_payouts_before THEN
    RAISE EXCEPTION 'Le nombre d''encaissements, de paiements ou de versements Stripe a changé. Annulation.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname IN ('accounting_lines_guard', 'accounting_entries_guard')
      AND tgenabled = 'D'
  ) THEN
    RAISE EXCEPTION 'Un verrou comptable est resté désactivé. Annulation.';
  END IF;

  RAISE NOTICE 'Réinitialisation comptable terminée pour % (%). Sauvegarde : accounting_reset_backup.run_%',
    v_label, v_club, replace(v_club::text, '-', '');
END $$;

-- Restauration, après une exécution réussie, sur ce seul club.
-- Les lignes sont dans accounting_reset_backup.run_657c2be56b674ef396fa130e68cbc229, colonne row_data.
-- Réinsérer les comptes, exercices, écritures et lignes, puis remettre les entry_id
-- sauvegardés sur document_receipts, finance_payments et accounting_stripe_payouts.
-- Retirer ensuite l'ancre voided et l'exercice du 1900-01-01.
