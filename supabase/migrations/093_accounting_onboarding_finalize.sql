-- ============================================
-- MIGRATION 093 : finalisation d'onboarding atomique
-- ============================================
-- Crée les comptes, les mappings et l'écriture d'ouverture
-- dans une seule transaction. Un second appel ne duplique rien.
-- IDEMPOTENT.
-- ============================================

CREATE OR REPLACE FUNCTION public.accounting_finalize_onboarding(p_payload JSONB)
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
  v_code TEXT;
  v_number TEXT;
  v_id UUID;
  v_line JSONB;
  v_lines JSONB := '[]'::JSONB;
  v_missing_codes TEXT[] := ARRAY[]::TEXT[];
  v_missing_ids TEXT[] := ARRAY[]::TEXT[];
  v_bank UUID;
  v_equity UUID;
  v_posted JSONB;
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_user := NULLIF(p_payload->>'user_id', '')::UUID;
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
    RETURN jsonb_build_object('ok', true, 'already', true);
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
    v_id := NULL;

    IF v_code IS NOT NULL THEN
      SELECT id INTO v_id
      FROM public.accounting_accounts
      WHERE club_id = v_club AND system_code = v_code
      LIMIT 1;
    END IF;

    IF v_id IS NULL THEN
      SELECT id INTO v_id
      FROM public.accounting_accounts
      WHERE club_id = v_club AND number = v_number
      LIMIT 1;
    END IF;

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
      )
      RETURNING id INTO v_id;
    ELSE
      UPDATE public.accounting_accounts
      SET
        name = v_account->>'name',
        is_active = TRUE,
        system_code = COALESCE(system_code, v_code),
        updated_at = NOW()
      WHERE id = v_id AND club_id = v_club;
    END IF;
  END LOOP;

  INSERT INTO public.accounting_mappings (club_id, source_kind, account_id)
  SELECT
    v_club,
    mapping->>'source_kind',
    account.id
  FROM jsonb_array_elements(COALESCE(p_payload->'mappings', '[]'::JSONB)) AS mapping
  JOIN public.accounting_accounts AS account
    ON account.club_id = v_club
   AND account.system_code = mapping->>'system_code'
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
  SET
    label = EXCLUDED.label,
    ends_on = EXCLUDED.ends_on
  RETURNING id INTO v_period;

  IF p_payload->'opening' IS NOT NULL AND jsonb_typeof(p_payload->'opening') = 'object' THEN
    FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload#>'{opening,lines}', '[]'::JSONB))
    LOOP
      v_code := v_line->>'system_code';
      SELECT id INTO v_id
      FROM public.accounting_accounts
      WHERE club_id = v_club
        AND is_active
        AND (system_code = v_code OR number = v_code)
      ORDER BY CASE WHEN system_code = v_code THEN 0 ELSE 1 END
      LIMIT 1;

      IF v_id IS NULL THEN
        v_missing_codes := array_append(v_missing_codes, v_code);
      ELSE
        v_lines := v_lines || jsonb_build_array(jsonb_build_object(
          'account_id', v_id,
          'debit', COALESCE((v_line->>'debit')::NUMERIC, 0),
          'credit', COALESCE((v_line->>'credit')::NUMERIC, 0)
        ));
      END IF;
    END LOOP;

    IF COALESCE(array_length(v_missing_codes, 1), 0) > 0 OR COALESCE(array_length(v_missing_ids, 1), 0) > 0 THEN
      RAISE EXCEPTION 'missing_account_codes=% missing_account_ids=%',
        array_to_string(v_missing_codes, ','),
        array_to_string(v_missing_ids, ',');
    END IF;

    SELECT id INTO v_bank
    FROM public.accounting_accounts
    WHERE club_id = v_club AND system_code = 'bank' AND is_active
    LIMIT 1;

    SELECT id INTO v_equity
    FROM public.accounting_accounts
    WHERE club_id = v_club AND system_code = 'equity' AND is_active
    LIMIT 1;

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
      'counter_account_id', v_bank,
      'category_account_id', v_equity,
      'created_by', v_user,
      'audit_action', 'opening',
      'lines', v_lines
    ));
  END IF;

  IF COALESCE((p_payload->>'history_planned')::BOOLEAN, FALSE) THEN
    INSERT INTO public.accounting_history_imports (club_id, period_id, format, status)
    SELECT v_club, v_period, 'csv', 'planned'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.accounting_history_imports
      WHERE club_id = v_club AND period_id = v_period AND status = 'planned'
    );
  END IF;

  UPDATE public.accounting_settings
  SET
    onboarding_completed_at = NOW(),
    opening_confirmed_at = NOW(),
    updated_at = NOW()
  WHERE club_id = v_club
    AND onboarding_completed_at IS NULL;

  RETURN jsonb_build_object(
    'ok', true,
    'already', false,
    'period_id', v_period,
    'opening_id', v_posted->>'id'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_finalize_onboarding(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_finalize_onboarding(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_finalize_onboarding(JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_finalize_onboarding(JSONB) TO service_role;
