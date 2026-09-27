-- Une écriture retirée du journal (statut voided) ne bloque plus son numéro.
-- L’unicité reste valable pour les écritures encore présentes dans l’exercice.

ALTER TABLE public.accounting_entries
  DROP CONSTRAINT IF EXISTS accounting_entries_number;

CREATE UNIQUE INDEX IF NOT EXISTS accounting_entries_number
  ON public.accounting_entries (club_id, period_id, entry_number)
  WHERE status <> 'voided';

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
  v_period_status TEXT;
  v_counterpart UUID;
  v_counterpart_status TEXT;
  v_counterpart_period TEXT;
  v_line JSONB;
  v_order INTEGER := 0;
  v_debit NUMERIC(14, 2);
  v_credit NUMERIC(14, 2);
  v_next_status TEXT;
  v_number INTEGER;
  v_period UUID;
  v_period_id UUID;
  v_entry_period UUID;
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_id := (p_payload->>'entry_id')::UUID;

  SELECT status, period_id, COALESCE(reversed_by_entry_id, reversal_of_entry_id)
  INTO v_status, v_period_id, v_counterpart
  FROM public.accounting_entries
  WHERE id = v_id AND club_id = v_club
  FOR UPDATE;

  v_entry_period := v_period_id;

  SELECT status INTO v_period_status
  FROM public.accounting_periods
  WHERE id = v_entry_period;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Écriture introuvable';
  END IF;
  IF v_period_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;
  IF v_status NOT IN ('pending', 'validated', 'reversed') THEN
    RAISE EXCEPTION 'Cette écriture ne peut plus être modifiée';
  END IF;

  v_period := NULLIF(p_payload->>'period_id', '')::UUID;
  IF v_period IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE id = v_period AND club_id = v_club AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;

  IF NULLIF(p_payload->>'void_counterpart_id', '') IS NOT NULL THEN
    v_counterpart := (p_payload->>'void_counterpart_id')::UUID;
  END IF;

  IF v_counterpart IS NOT NULL AND v_counterpart <> v_id THEN
    SELECT status, period_id
    INTO v_counterpart_status, v_period_id
    FROM public.accounting_entries
    WHERE id = v_counterpart AND club_id = v_club
    FOR UPDATE;

    SELECT status INTO v_counterpart_period
    FROM public.accounting_periods
    WHERE id = v_period_id;

    IF v_counterpart_status IS NOT NULL AND v_counterpart_status <> 'voided' THEN
      IF v_counterpart_period IS DISTINCT FROM 'open' THEN
        RAISE EXCEPTION 'Cet exercice est clôturé. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
      END IF;
      UPDATE public.accounting_entries
      SET status = 'voided'
      WHERE id = v_counterpart AND club_id = v_club;
    END IF;
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
  IF v_next_status NOT IN ('pending', 'validated') THEN
    v_next_status := 'pending';
  END IF;
  IF v_order < 2 OR v_debit <> v_credit OR v_debit <= 0 THEN
    RAISE EXCEPTION 'L’écriture doit être équilibrée avant d’être enregistrée.';
  END IF;
  IF v_next_status = 'validated' AND (v_order < 2 OR v_debit <> v_credit OR v_debit <= 0) THEN
    RAISE EXCEPTION 'L’écriture doit être équilibrée avant d’être vérifiée.';
  END IF;

  v_number := NULLIF(p_payload->>'entry_number', '')::INTEGER;
  IF v_number IS NOT NULL AND v_number < 1 THEN
    RAISE EXCEPTION 'Le numéro d’écriture doit être un entier positif';
  END IF;
  IF v_number IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.accounting_entries
    WHERE club_id = v_club
      AND period_id = COALESCE(v_period, v_entry_period)
      AND entry_number = v_number
      AND id <> v_id
      AND status <> 'voided'
  ) THEN
    RAISE EXCEPTION 'Ce numéro d’écriture est déjà utilisé dans l’exercice.';
  END IF;

  UPDATE public.accounting_entries
  SET
    entry_date = (p_payload->>'entry_date')::DATE,
    description = COALESCE(NULLIF(p_payload->>'description', ''), description),
    reference = NULLIF(p_payload->>'reference', ''),
    party_name = NULLIF(p_payload->>'remark', ''),
    amount = v_debit,
    status = v_next_status,
    entry_number = COALESCE(v_number, entry_number),
    period_id = COALESCE(v_period, period_id),
    reversed_by_entry_id = NULL
  WHERE id = v_id AND club_id = v_club;

  RETURN jsonb_build_object('id', v_id, 'status', v_next_status, 'voided_counterpart', v_counterpart);
END;
$$;
