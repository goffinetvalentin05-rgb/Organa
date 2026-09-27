-- Une écriture du journal (y compris l’ouverture et une extourne) se modifie
-- ou se retire tant que son exercice est ouvert.
-- La suppression reste un statut voided. Un exercice clôturé bloque l’écriture.

CREATE OR REPLACE FUNCTION public.accounting_guard_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_period_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Une écriture comptable ne se supprime pas';
  END IF;

  SELECT status INTO v_period_status
  FROM public.accounting_periods
  WHERE id = OLD.period_id;

  IF OLD.status = 'voided' AND (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.entry_date IS DISTINCT FROM NEW.entry_date
    OR OLD.amount IS DISTINCT FROM NEW.amount
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.reference IS DISTINCT FROM NEW.reference
    OR OLD.party_name IS DISTINCT FROM NEW.party_name
    OR OLD.entry_number IS DISTINCT FROM NEW.entry_number
    OR OLD.period_id IS DISTINCT FROM NEW.period_id
  ) THEN
    RAISE EXCEPTION 'Ecriture supprimée immuable';
  END IF;

  IF v_period_status = 'closed' AND (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.entry_date IS DISTINCT FROM NEW.entry_date
    OR OLD.amount IS DISTINCT FROM NEW.amount
    OR OLD.description IS DISTINCT FROM NEW.description
    OR OLD.reference IS DISTINCT FROM NEW.reference
    OR OLD.party_name IS DISTINCT FROM NEW.party_name
    OR OLD.entry_number IS DISTINCT FROM NEW.entry_number
    OR OLD.period_id IS DISTINCT FROM NEW.period_id
    OR OLD.reversed_by_entry_id IS DISTINCT FROM NEW.reversed_by_entry_id
  ) THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;

  IF OLD.status IN ('pending', 'validated', 'reversed')
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
  v_period_status TEXT;
  v_entry UUID;
BEGIN
  v_entry := COALESCE(NEW.entry_id, OLD.entry_id);
  SELECT e.status, p.status
  INTO v_status, v_period_status
  FROM public.accounting_entries AS e
  LEFT JOIN public.accounting_periods AS p ON p.id = e.period_id
  WHERE e.id = v_entry;

  IF v_status = 'voided' THEN
    RAISE EXCEPTION 'Lignes d''une écriture supprimée immuables';
  END IF;

  IF v_period_status = 'closed' THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
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
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_id := (p_payload->>'entry_id')::UUID;

  SELECT status, period_id, COALESCE(reversed_by_entry_id, reversal_of_entry_id)
  INTO v_status, v_period_id, v_counterpart
  FROM public.accounting_entries
  WHERE id = v_id AND club_id = v_club
  FOR UPDATE;

  SELECT status INTO v_period_status
  FROM public.accounting_periods
  WHERE id = v_period_id;

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

CREATE OR REPLACE FUNCTION public.accounting_void_journal_entry(p_club UUID, p_entry UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_period_status TEXT;
  v_counterpart UUID;
  v_counterpart_status TEXT;
  v_counterpart_period TEXT;
  v_period_id UUID;
BEGIN
  SELECT status, period_id, COALESCE(reversed_by_entry_id, reversal_of_entry_id)
  INTO v_status, v_period_id, v_counterpart
  FROM public.accounting_entries
  WHERE id = p_entry AND club_id = p_club
  FOR UPDATE;

  SELECT status INTO v_period_status
  FROM public.accounting_periods
  WHERE id = v_period_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Écriture introuvable';
  END IF;
  IF v_status = 'voided' THEN
    RAISE EXCEPTION 'Cette écriture a déjà été retirée du journal.';
  END IF;
  IF v_status NOT IN ('pending', 'validated', 'reversed') THEN
    RAISE EXCEPTION 'Cette écriture ne peut plus être supprimée';
  END IF;
  IF v_period_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;

  IF v_counterpart IS NOT NULL AND v_counterpart <> p_entry THEN
    SELECT status, period_id
    INTO v_counterpart_status, v_period_id
    FROM public.accounting_entries
    WHERE id = v_counterpart AND club_id = p_club
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
      WHERE id = v_counterpart AND club_id = p_club;
    ELSE
      v_counterpart := NULL;
    END IF;
  ELSE
    v_counterpart := NULL;
  END IF;

  UPDATE public.accounting_entries
  SET status = 'voided'
  WHERE id = p_entry AND club_id = p_club;

  RETURN jsonb_build_object('id', p_entry, 'voided_counterpart', v_counterpart);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_void_journal_entry(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_void_journal_entry(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_void_journal_entry(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_void_journal_entry(UUID, UUID) TO service_role;
