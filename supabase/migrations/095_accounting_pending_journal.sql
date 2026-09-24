-- Mise à jour de n'importe quelle écriture encore à vérifier.
-- Une écriture validée reste immuable (trigger existant).

CREATE OR REPLACE FUNCTION public.accounting_update_pending_entry(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_id UUID;
  v_status TEXT;
  v_line JSONB;
  v_order INTEGER := 0;
  v_debit NUMERIC(14, 2);
  v_credit NUMERIC(14, 2);
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_id := (p_payload->>'entry_id')::UUID;

  SELECT status INTO v_status
  FROM public.accounting_entries
  WHERE id = v_id AND club_id = v_club
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Écriture introuvable';
  END IF;
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Seule une écriture à vérifier peut être modifiée';
  END IF;

  DELETE FROM public.accounting_entry_lines WHERE entry_id = v_id AND club_id = v_club;

  FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'lines', '[]'::JSONB))
  LOOP
    v_order := v_order + 1;
    INSERT INTO public.accounting_entry_lines (club_id, entry_id, account_id, debit, credit, line_order)
    VALUES (
      v_club,
      v_id,
      (v_line->>'account_id')::UUID,
      ROUND(COALESCE((v_line->>'debit')::NUMERIC, 0), 2),
      ROUND(COALESCE((v_line->>'credit')::NUMERIC, 0), 2),
      v_order
    );
  END LOOP;

  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
  INTO v_debit, v_credit
  FROM public.accounting_entry_lines
  WHERE entry_id = v_id;

  IF v_order < 2 OR v_debit <> v_credit OR v_debit <= 0 THEN
    RAISE EXCEPTION 'L’écriture doit être équilibrée avant d’être enregistrée.';
  END IF;

  UPDATE public.accounting_entries
  SET
    entry_date = (p_payload->>'entry_date')::DATE,
    description = COALESCE(NULLIF(p_payload->>'description', ''), description),
    reference = NULLIF(p_payload->>'reference', ''),
    party_name = NULLIF(p_payload->>'remark', ''),
    amount = v_debit
  WHERE id = v_id AND club_id = v_club;

  RETURN jsonb_build_object('id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_update_pending_entry(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_update_pending_entry(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_update_pending_entry(JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_update_pending_entry(JSONB) TO service_role;
