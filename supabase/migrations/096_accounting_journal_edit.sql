-- Une écriture vérifiée reste modifiable.
-- La suppression est un statut voided, jamais un DELETE.
-- Les écritures extournées restent immuables.

CREATE OR REPLACE FUNCTION public.accounting_guard_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Une écriture comptable ne se supprime pas';
  END IF;

  IF OLD.status = 'reversed' AND (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.entry_date IS DISTINCT FROM NEW.entry_date
    OR OLD.amount IS DISTINCT FROM NEW.amount
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.reference IS DISTINCT FROM NEW.reference
    OR OLD.party_name IS DISTINCT FROM NEW.party_name
    OR OLD.entry_number IS DISTINCT FROM NEW.entry_number
  ) THEN
    RAISE EXCEPTION 'Ecriture extournée immuable';
  END IF;

  IF OLD.status = 'voided' AND (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.entry_date IS DISTINCT FROM NEW.entry_date
    OR OLD.amount IS DISTINCT FROM NEW.amount
    OR OLD.description IS DISTINCT FROM NEW.description
  ) THEN
    RAISE EXCEPTION 'Ecriture supprimée immuable';
  END IF;

  IF OLD.status IN ('pending', 'validated')
    AND NEW.status NOT IN ('pending', 'validated', 'voided', 'reversed') THEN
    RAISE EXCEPTION 'Transition de statut interdite';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_guard_lines()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_entry UUID;
BEGIN
  v_entry := COALESCE(NEW.entry_id, OLD.entry_id);
  SELECT status INTO v_status FROM public.accounting_entries WHERE id = v_entry;
  IF v_status IN ('reversed', 'voided') THEN
    RAISE EXCEPTION 'Lignes d''une écriture figée immuables';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

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
  v_next_status TEXT;
  v_number INTEGER;
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
  IF v_status NOT IN ('pending', 'validated') THEN
    RAISE EXCEPTION 'Cette écriture ne peut plus être modifiée';
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

  v_next_status := COALESCE(NULLIF(p_payload->>'status', ''), v_status);
  IF v_next_status = 'validated' AND (v_order < 2 OR v_debit <> v_credit OR v_debit <= 0) THEN
    RAISE EXCEPTION 'L’écriture doit être équilibrée avant d’être vérifiée.';
  END IF;
  IF v_order < 2 OR v_debit <> v_credit OR v_debit <= 0 THEN
    RAISE EXCEPTION 'L’écriture doit être équilibrée avant d’être enregistrée.';
  END IF;

  v_number := NULLIF(p_payload->>'entry_number', '')::INTEGER;
  IF v_number IS NOT NULL AND v_number < 1 THEN
    RAISE EXCEPTION 'Le numéro d’écriture doit être un entier positif';
  END IF;

  UPDATE public.accounting_entries
  SET
    entry_date = (p_payload->>'entry_date')::DATE,
    description = COALESCE(NULLIF(p_payload->>'description', ''), description),
    reference = NULLIF(p_payload->>'reference', ''),
    party_name = NULLIF(p_payload->>'remark', ''),
    amount = v_debit,
    status = v_next_status,
    entry_number = COALESCE(v_number, entry_number)
  WHERE id = v_id AND club_id = v_club;

  RETURN jsonb_build_object('id', v_id, 'status', v_next_status);
END;
$$;
