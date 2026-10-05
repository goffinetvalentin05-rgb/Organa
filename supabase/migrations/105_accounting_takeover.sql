-- ============================================
-- MIGRATION 105 : reprise comptable
-- ============================================
-- Étend les modes de démarrage. N'écrit aucune ligne
-- sur une comptabilité déjà configurée.
-- IDEMPOTENT.
-- ============================================

ALTER TABLE public.accounting_settings
  DROP CONSTRAINT IF EXISTS accounting_settings_start_mode;

ALTER TABLE public.accounting_settings
  ADD CONSTRAINT accounting_settings_start_mode
  CHECK (start_mode IS NULL OR start_mode IN (
    'next_period', 'resume_current', 'from_today', 'full_period', 'from_date'
  ));

ALTER TABLE public.accounting_history_imports
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS accounting_history_imports_fingerprint
  ON public.accounting_history_imports (club_id, fingerprint)
  WHERE fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.accounting_open_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id UUID REFERENCES public.accounting_periods(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  label TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('receivable', 'payable')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  settled_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (settled_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.accounting_open_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounting_open_items_select ON public.accounting_open_items;
CREATE POLICY accounting_open_items_select ON public.accounting_open_items
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

CREATE OR REPLACE FUNCTION public.accounting_resolve_account(p_club UUID, p_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.accounting_accounts
  WHERE club_id = p_club
    AND is_active
    AND (system_code = p_code OR number = p_code)
  ORDER BY CASE WHEN system_code = p_code THEN 0 ELSE 1 END
  LIMIT 1;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_finalize_takeover(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_user UUID;
  v_done TIMESTAMPTZ;
  v_period UUID;
  v_account JSONB;
  v_entry JSONB;
  v_line JSONB;
  v_item JSONB;
  v_code TEXT;
  v_number TEXT;
  v_id UUID;
  v_lines JSONB;
  v_posted JSONB;
  v_fingerprint TEXT;
  v_existing UUID;
  v_count INTEGER := 0;
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_user := NULLIF(p_payload->>'user_id', '')::UUID;
  v_fingerprint := NULLIF(p_payload->>'fingerprint', '');
  IF v_club IS NULL THEN
    RAISE EXCEPTION 'club_id manquant';
  END IF;

  INSERT INTO public.accounting_settings (club_id, start_date, auto_validate)
  VALUES (v_club, (p_payload->>'start_date')::DATE, FALSE)
  ON CONFLICT (club_id) DO NOTHING;

  SELECT onboarding_completed_at
  INTO v_done
  FROM public.accounting_settings
  WHERE club_id = v_club
  FOR UPDATE;

  IF v_done IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'journal_count', 0);
  END IF;

  IF v_fingerprint IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.accounting_history_imports
    WHERE club_id = v_club AND fingerprint = v_fingerprint
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'journal_count', 0);
  END IF;

  UPDATE public.accounting_settings
  SET
    start_date = (p_payload->>'start_date')::DATE,
    coverage_type = COALESCE(p_payload->>'coverage_type', 'full_period'),
    start_mode = NULLIF(p_payload->>'start_mode', ''),
    history_import_status = COALESCE(p_payload->>'history_import_status', 'not_requested'),
    auto_validate = FALSE,
    updated_at = NOW()
  WHERE club_id = v_club;

  FOR v_account IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'accounts', '[]'::JSONB))
  LOOP
    v_code := NULLIF(v_account->>'system_code', '');
    v_number := v_account->>'number';
    v_id := public.accounting_resolve_account(v_club, COALESCE(v_code, v_number));
    IF v_id IS NULL THEN
      INSERT INTO public.accounting_accounts (
        club_id, number, name, account_type, account_class, system_code, is_system, is_active, sort_order
      ) VALUES (
        v_club,
        v_number,
        v_account->>'name',
        v_account->>'account_type',
        (v_account->>'account_class')::INTEGER,
        v_code,
        COALESCE((v_account->>'is_system')::BOOLEAN, FALSE),
        TRUE,
        COALESCE((v_account->>'sort_order')::INTEGER, 0)
      );
    ELSE
      UPDATE public.accounting_accounts
      SET name = COALESCE(NULLIF(v_account->>'name', ''), name), is_active = TRUE, updated_at = NOW()
      WHERE id = v_id AND club_id = v_club;
    END IF;
  END LOOP;

  INSERT INTO public.accounting_mappings (club_id, source_kind, account_id)
  SELECT v_club, mapping->>'source_kind', account.id
  FROM jsonb_array_elements(COALESCE(p_payload->'mappings', '[]'::JSONB)) AS mapping
  JOIN public.accounting_accounts AS account
    ON account.club_id = v_club AND account.system_code = mapping->>'system_code'
  ON CONFLICT (club_id, source_kind) DO UPDATE
  SET account_id = EXCLUDED.account_id;

  INSERT INTO public.accounting_periods (club_id, label, starts_on, ends_on, status)
  VALUES (
    v_club,
    COALESCE(p_payload#>>'{period,label}', 'Exercice'),
    (p_payload#>>'{period,starts_on}')::DATE,
    (p_payload#>>'{period,ends_on}')::DATE,
    'open'
  )
  ON CONFLICT (club_id, starts_on) DO UPDATE
  SET label = EXCLUDED.label, ends_on = EXCLUDED.ends_on
  RETURNING id INTO v_period;

  IF p_payload->'opening' IS NOT NULL AND jsonb_typeof(p_payload->'opening') = 'object' THEN
    v_lines := '[]'::JSONB;
    FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload#>'{opening,lines}', '[]'::JSONB))
    LOOP
      v_id := public.accounting_resolve_account(v_club, v_line->>'system_code');
      IF v_id IS NULL THEN
        RAISE EXCEPTION 'Compte de reprise introuvable : %', v_line->>'system_code';
      END IF;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'account_id', v_id,
        'debit', COALESCE((v_line->>'debit')::NUMERIC, 0),
        'credit', COALESCE((v_line->>'credit')::NUMERIC, 0)
      ));
    END LOOP;
    v_posted := public.accounting_post_entry(jsonb_build_object(
      'club_id', v_club,
      'period_id', v_period,
      'entry_date', p_payload#>>'{opening,entry_date}',
      'description', COALESCE(p_payload#>>'{opening,description}', 'Situation de départ'),
      'amount', COALESCE((p_payload#>>'{opening,amount}')::NUMERIC, 0),
      'direction', 'opening',
      'source_type', 'opening',
      'source_id', v_period,
      'event_type', 'opening',
      'idempotency_key', 'opening:' || v_period::TEXT,
      'status', 'validated',
      'created_by', v_user,
      'audit_action', 'opening',
      'lines', v_lines
    ));
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'journal', '[]'::JSONB))
  LOOP
    v_lines := '[]'::JSONB;
    FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(v_entry->'lines', '[]'::JSONB))
    LOOP
      v_id := public.accounting_resolve_account(v_club, v_line->>'system_code');
      IF v_id IS NULL THEN
        RAISE EXCEPTION 'Compte d''import introuvable : %', v_line->>'system_code';
      END IF;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'account_id', v_id,
        'debit', COALESCE((v_line->>'debit')::NUMERIC, 0),
        'credit', COALESCE((v_line->>'credit')::NUMERIC, 0)
      ));
    END LOOP;
    v_posted := public.accounting_post_entry(jsonb_build_object(
      'club_id', v_club,
      'period_id', v_period,
      'entry_date', v_entry->>'entry_date',
      'description', COALESCE(v_entry->>'description', 'Écriture reprise'),
      'reference', NULLIF(v_entry->>'reference', ''),
      'amount', COALESCE((v_entry->>'amount')::NUMERIC, 0),
      'direction', 'adjustment',
      'source_type', COALESCE(NULLIF(v_entry->>'source_type', ''), 'import'),
      'source_id', NULLIF(v_entry->>'source_id', ''),
      'event_type', COALESCE(NULLIF(v_entry->>'event_type', ''), 'import'),
      'idempotency_key', v_entry->>'idempotency_key',
      'status', 'validated',
      'created_by', v_user,
      'audit_action', 'history_import',
      'lines', v_lines
    ));
    v_count := v_count + 1;
    IF NULLIF(v_entry->>'reference', '') IS NOT NULL THEN
      UPDATE public.accounting_entries
      SET reference = v_entry->>'reference'
      WHERE id = (v_posted->>'id')::UUID AND club_id = v_club;
    END IF;
  END LOOP;

  IF p_payload->'rollup' IS NOT NULL AND jsonb_typeof(p_payload->'rollup') = 'object' THEN
    v_lines := '[]'::JSONB;
    FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload#>'{rollup,lines}', '[]'::JSONB))
    LOOP
      v_id := public.accounting_resolve_account(v_club, v_line->>'system_code');
      IF v_id IS NULL THEN
        RAISE EXCEPTION 'Compte de cumul introuvable : %', v_line->>'system_code';
      END IF;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'account_id', v_id,
        'debit', COALESCE((v_line->>'debit')::NUMERIC, 0),
        'credit', COALESCE((v_line->>'credit')::NUMERIC, 0)
      ));
    END LOOP;
    PERFORM public.accounting_post_entry(jsonb_build_object(
      'club_id', v_club,
      'period_id', v_period,
      'entry_date', p_payload#>>'{rollup,entry_date}',
      'description', COALESCE(p_payload#>>'{rollup,description}', 'Reprise agrégée'),
      'amount', COALESCE((p_payload#>>'{rollup,amount}')::NUMERIC, 0),
      'direction', 'adjustment',
      'source_type', 'history_rollup',
      'event_type', 'history_rollup',
      'idempotency_key', COALESCE(p_payload#>>'{rollup,idempotency_key}', 'rollup:' || v_period::TEXT),
      'status', 'validated',
      'created_by', v_user,
      'audit_action', 'history_rollup',
      'lines', v_lines
    ));
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'open_items', '[]'::JSONB))
  LOOP
    v_id := public.accounting_resolve_account(v_club, v_item->>'account_code');
    INSERT INTO public.accounting_open_items (club_id, period_id, account_id, label, side, amount)
    VALUES (
      v_club,
      v_period,
      v_id,
      v_item->>'label',
      v_item->>'side',
      (v_item->>'amount')::NUMERIC
    );
  END LOOP;

  IF COALESCE(jsonb_array_length(p_payload->'journal'), 0) > 0
    AND v_count <> jsonb_array_length(p_payload->'journal') THEN
    RAISE EXCEPTION 'L''import n''a pas repris toutes les écritures prévues.';
  END IF;

  IF v_fingerprint IS NOT NULL THEN
    INSERT INTO public.accounting_history_imports (
      club_id, period_id, format, status, idempotency_key, fingerprint, message, applied_at
    ) VALUES (
      v_club,
      v_period,
      'csv',
      'applied',
      v_fingerprint,
      v_fingerprint,
      COALESCE(p_payload->>'coverage_note', ''),
      NOW()
    );
  END IF;

  INSERT INTO public.accounting_audit_log (club_id, entry_id, user_id, action, new_value)
  VALUES (
    v_club,
    NULL,
    v_user,
    'takeover',
    jsonb_build_object(
      'mode', p_payload->>'start_mode',
      'takeover_date', p_payload->>'start_date',
      'journal_count', v_count,
      'fingerprint', v_fingerprint
    )
  );

  UPDATE public.accounting_settings
  SET onboarding_completed_at = NOW(), opening_confirmed_at = NOW(), updated_at = NOW()
  WHERE club_id = v_club AND onboarding_completed_at IS NULL;

  RETURN jsonb_build_object('ok', true, 'already', false, 'period_id', v_period, 'journal_count', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_apply_history_import(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_user UUID;
  v_period UUID;
  v_fingerprint TEXT;
  v_entry JSONB;
  v_line JSONB;
  v_id UUID;
  v_lines JSONB;
  v_posted JSONB;
  v_count INTEGER := 0;
  v_status TEXT;
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_user := NULLIF(p_payload->>'user_id', '')::UUID;
  v_period := (p_payload->>'period_id')::UUID;
  v_fingerprint := NULLIF(p_payload->>'fingerprint', '');
  IF v_club IS NULL OR v_period IS NULL OR v_fingerprint IS NULL THEN
    RAISE EXCEPTION 'Import incomplet';
  END IF;

  PERFORM 1 FROM public.accounting_settings WHERE club_id = v_club FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.accounting_history_imports
    WHERE club_id = v_club AND fingerprint = v_fingerprint
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'journal_count', 0);
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.accounting_history_imports
    WHERE club_id = v_club AND period_id = v_period AND status = 'applied'
  ) THEN
    RAISE EXCEPTION 'Un import a déjà repris cet exercice. Un second lot compterait les mêmes opérations deux fois.';
  END IF;

  SELECT status INTO v_status FROM public.accounting_periods WHERE id = v_period AND club_id = v_club;
  IF v_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. La reprise ne peut plus être importée.';
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'journal', '[]'::JSONB))
  LOOP
    v_lines := '[]'::JSONB;
    FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(v_entry->'lines', '[]'::JSONB))
    LOOP
      v_id := public.accounting_resolve_account(v_club, v_line->>'system_code');
      IF v_id IS NULL THEN
        RAISE EXCEPTION 'Compte d''import introuvable : %', v_line->>'system_code';
      END IF;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'account_id', v_id,
        'debit', COALESCE((v_line->>'debit')::NUMERIC, 0),
        'credit', COALESCE((v_line->>'credit')::NUMERIC, 0)
      ));
    END LOOP;
    v_posted := public.accounting_post_entry(jsonb_build_object(
      'club_id', v_club,
      'period_id', v_period,
      'entry_date', v_entry->>'entry_date',
      'description', COALESCE(v_entry->>'description', 'Écriture reprise'),
      'amount', COALESCE((v_entry->>'amount')::NUMERIC, 0),
      'direction', 'adjustment',
      'source_type', COALESCE(NULLIF(v_entry->>'source_type', ''), 'import'),
      'source_id', NULLIF(v_entry->>'source_id', ''),
      'event_type', COALESCE(NULLIF(v_entry->>'event_type', ''), 'import'),
      'idempotency_key', v_entry->>'idempotency_key',
      'status', 'validated',
      'created_by', v_user,
      'audit_action', 'history_import',
      'lines', v_lines
    ));
    UPDATE public.accounting_entries
    SET reference = NULLIF(v_entry->>'reference', '')
    WHERE id = (v_posted->>'id')::UUID AND club_id = v_club AND NULLIF(v_entry->>'reference', '') IS NOT NULL;
    v_count := v_count + 1;
  END LOOP;

  IF p_payload->'rollup' IS NOT NULL AND jsonb_typeof(p_payload->'rollup') = 'object' THEN
    v_lines := '[]'::JSONB;
    FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload#>'{rollup,lines}', '[]'::JSONB))
    LOOP
      v_id := public.accounting_resolve_account(v_club, v_line->>'system_code');
      IF v_id IS NULL THEN
        RAISE EXCEPTION 'Compte de cumul introuvable : %', v_line->>'system_code';
      END IF;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'account_id', v_id,
        'debit', COALESCE((v_line->>'debit')::NUMERIC, 0),
        'credit', COALESCE((v_line->>'credit')::NUMERIC, 0)
      ));
    END LOOP;
    PERFORM public.accounting_post_entry(jsonb_build_object(
      'club_id', v_club,
      'period_id', v_period,
      'entry_date', p_payload#>>'{rollup,entry_date}',
      'description', COALESCE(p_payload#>>'{rollup,description}', 'Reprise agrégée'),
      'amount', COALESCE((p_payload#>>'{rollup,amount}')::NUMERIC, 0),
      'direction', 'adjustment',
      'source_type', 'history_rollup',
      'event_type', 'history_rollup',
      'idempotency_key', COALESCE(p_payload#>>'{rollup,idempotency_key}', 'rollup:' || v_period::TEXT),
      'status', 'validated',
      'created_by', v_user,
      'audit_action', 'history_rollup',
      'lines', v_lines
    ));
  END IF;

  INSERT INTO public.accounting_history_imports (
    club_id, period_id, format, status, idempotency_key, fingerprint, applied_at
  ) VALUES (v_club, v_period, 'csv', 'applied', v_fingerprint, v_fingerprint, NOW());

  UPDATE public.accounting_settings
  SET history_import_status = 'applied', updated_at = NOW()
  WHERE club_id = v_club;

  INSERT INTO public.accounting_audit_log (club_id, user_id, action, new_value)
  VALUES (v_club, v_user, 'history_import', jsonb_build_object('fingerprint', v_fingerprint, 'journal_count', v_count));

  RETURN jsonb_build_object('ok', true, 'already', false, 'journal_count', v_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_settle_open_item(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_user UUID;
  v_item UUID;
  v_account UUID;
  v_financial UUID;
  v_period UUID;
  v_side TEXT;
  v_amount NUMERIC(14, 2);
  v_settled NUMERIC(14, 2);
  v_pay NUMERIC(14, 2);
  v_date DATE;
  v_key TEXT;
  v_posted JSONB;
  v_lines JSONB;
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_user := NULLIF(p_payload->>'user_id', '')::UUID;
  v_item := (p_payload->>'item_id')::UUID;
  v_financial := (p_payload->>'financial_account_id')::UUID;
  v_pay := ROUND(COALESCE((p_payload->>'amount')::NUMERIC, 0), 2);
  v_date := (p_payload->>'entry_date')::DATE;

  SELECT account_id, period_id, side, amount, settled_amount
  INTO v_account, v_period, v_side, v_amount, v_settled
  FROM public.accounting_open_items
  WHERE id = v_item AND club_id = v_club
  FOR UPDATE;

  IF v_account IS NULL THEN
    RAISE EXCEPTION 'Somme reprise introuvable';
  END IF;
  IF v_pay <= 0 OR v_settled + v_pay > v_amount THEN
    RAISE EXCEPTION 'Le règlement dépasse la somme reprise encore ouverte.';
  END IF;

  v_key := 'settle:' || v_item::TEXT || ':' || v_settled::TEXT || ':' || v_pay::TEXT || ':' || v_date::TEXT;
  IF v_side = 'receivable' THEN
    v_lines := jsonb_build_array(
      jsonb_build_object('account_id', v_financial, 'debit', v_pay, 'credit', 0),
      jsonb_build_object('account_id', v_account, 'debit', 0, 'credit', v_pay)
    );
  ELSE
    v_lines := jsonb_build_array(
      jsonb_build_object('account_id', v_account, 'debit', v_pay, 'credit', 0),
      jsonb_build_object('account_id', v_financial, 'debit', 0, 'credit', v_pay)
    );
  END IF;

  v_posted := public.accounting_post_entry(jsonb_build_object(
    'club_id', v_club,
    'period_id', v_period,
    'entry_date', v_date,
    'description', COALESCE(p_payload->>'description', 'Règlement d''une somme reprise'),
    'amount', v_pay,
    'direction', 'adjustment',
    'source_type', 'opening_settlement',
    'event_type', 'settlement',
    'idempotency_key', v_key,
    'status', 'validated',
    'created_by', v_user,
    'audit_action', 'opening_settlement',
    'lines', v_lines
  ));

  IF COALESCE((v_posted->>'created')::BOOLEAN, TRUE) THEN
    UPDATE public.accounting_open_items
    SET settled_amount = ROUND(settled_amount + v_pay, 2)
    WHERE id = v_item AND club_id = v_club;
  END IF;

  RETURN jsonb_build_object('ok', true, 'entry_id', v_posted->>'id', 'created', COALESCE(v_posted->>'created', 'true'));
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_resolve_account(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_finalize_takeover(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_apply_history_import(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_settle_open_item(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_resolve_account(UUID, TEXT) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.accounting_finalize_takeover(JSONB) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.accounting_apply_history_import(JSONB) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.accounting_settle_open_item(JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_finalize_takeover(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.accounting_apply_history_import(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.accounting_settle_open_item(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.accounting_resolve_account(UUID, TEXT) TO service_role;
