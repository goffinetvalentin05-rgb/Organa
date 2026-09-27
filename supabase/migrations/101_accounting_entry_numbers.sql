-- Numéros visibles par exercice, dans l’ordre des dates comptables.
-- L’identifiant de l’écriture ne change pas. Les liens (source_id, reversal_of_entry_id,
-- entry_id des lignes, paiements et justificatifs) ne sont pas modifiés.
-- Un exercice clôturé n’est pas renuméroté.

ALTER TABLE public.accounting_entries
  ADD COLUMN IF NOT EXISTS entry_number_manual BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.accounting_settings
  ADD COLUMN IF NOT EXISTS numbering_notice TEXT;

COMMENT ON COLUMN public.accounting_entries.entry_number_manual IS
  'Vrai lorsque le numéro a été choisi dans le journal. Un décalage ultérieur est indiqué.';

CREATE OR REPLACE FUNCTION public.accounting_place_entry_number(
  p_entry UUID,
  p_mode TEXT,
  p_target INTEGER,
  p_user UUID,
  p_audit_subject BOOLEAN DEFAULT TRUE,
  p_previous INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_period UUID;
  v_status TEXT;
  v_period_status TEXT;
  v_ids UUID[] := ARRAY[]::UUID[];
  v_olds INTEGER[] := ARRAY[]::INTEGER[];
  v_manuals BOOLEAN[] := ARRAY[]::BOOLEAN[];
  v_labels TEXT[] := ARRAY[]::TEXT[];
  v_dates DATE[] := ARRAY[]::DATE[];
  v_created TIMESTAMPTZ[] := ARRAY[]::TIMESTAMPTZ[];
  v_before UUID[] := ARRAY[]::UUID[];
  v_after UUID[] := ARRAY[]::UUID[];
  v_new_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER;
  v_subject INTEGER;
  v_subject_date DATE;
  v_subject_created TIMESTAMPTZ;
  v_subject_old INTEGER;
  v_subject_new INTEGER;
  v_subject_manual BOOLEAN;
  i INTEGER;
  v_new INTEGER;
  v_parts TEXT := '';
  v_shifted BOOLEAN := FALSE;
  v_notice TEXT := '';
  v_before_subject BOOLEAN;
  rec RECORD;
BEGIN
  SELECT e.club_id, e.period_id, e.status, p.status
  INTO v_club, v_period, v_status, v_period_status
  FROM public.accounting_entries e
  JOIN public.accounting_periods p ON p.id = e.period_id
  WHERE e.id = p_entry
  FOR UPDATE OF e;

  IF v_club IS NULL OR v_status = 'voided' THEN
    RETURN jsonb_build_object('notice', NULL, 'entry_number', NULL);
  END IF;
  IF v_period_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;

  PERFORM 1
  FROM public.accounting_entries
  WHERE period_id = v_period AND status <> 'voided'
  FOR UPDATE;

  FOR rec IN
    SELECT id, entry_number, entry_number_manual, description, entry_date, created_at
    FROM public.accounting_entries
    WHERE period_id = v_period AND status <> 'voided'
    ORDER BY entry_number, id
  LOOP
    v_ids := v_ids || rec.id;
    v_olds := v_olds || rec.entry_number;
    v_manuals := v_manuals || rec.entry_number_manual;
    v_labels := v_labels || COALESCE(rec.description, 'Écriture');
    v_dates := v_dates || rec.entry_date;
    v_created := v_created || rec.created_at;
  END LOOP;

  v_count := COALESCE(array_length(v_ids, 1), 0);
  v_subject := array_position(v_ids, p_entry);
  IF v_subject IS NULL THEN
    RAISE EXCEPTION 'Écriture introuvable';
  END IF;
  v_subject_date := v_dates[v_subject];
  v_subject_created := v_created[v_subject];
  v_subject_old := COALESCE(p_previous, v_olds[v_subject]);
  v_subject_manual := v_manuals[v_subject];

  IF p_mode = 'manual' THEN
    IF p_target IS NULL OR p_target < 1 OR p_target > v_count THEN
      RAISE EXCEPTION 'Choisissez un numéro entre 1 et %.', v_count;
    END IF;
    FOR i IN 1..v_count LOOP
      IF v_ids[i] = p_entry THEN CONTINUE; END IF;
      v_after := v_after || v_ids[i];
    END LOOP;
    IF p_target = 1 THEN
      v_new_ids := ARRAY[p_entry] || v_after;
    ELSIF p_target > COALESCE(array_length(v_after, 1), 0) THEN
      v_new_ids := v_after || p_entry;
    ELSE
      v_new_ids := v_after[1:p_target - 1] || p_entry || v_after[p_target:COALESCE(array_length(v_after, 1), 0)];
    END IF;
  ELSE
    FOR i IN 1..v_count LOOP
      IF v_ids[i] = p_entry THEN CONTINUE; END IF;
      v_before_subject := v_dates[i] < v_subject_date
        OR (v_dates[i] = v_subject_date AND v_created[i] < v_subject_created)
        OR (v_dates[i] = v_subject_date AND v_created[i] = v_subject_created AND v_ids[i]::TEXT < p_entry::TEXT);
      IF v_before_subject THEN
        v_before := v_before || v_ids[i];
      ELSE
        v_after := v_after || v_ids[i];
      END IF;
    END LOOP;
    v_new_ids := v_before || p_entry || v_after;
  END IF;

  UPDATE public.accounting_entries
  SET entry_number = -entry_number
  WHERE period_id = v_period AND status <> 'voided' AND entry_number > 0;

  FOR i IN 1..v_count LOOP
    UPDATE public.accounting_entries
    SET entry_number = i,
        entry_number_manual = CASE
          WHEN id = p_entry AND p_mode = 'manual' THEN TRUE
          WHEN id = p_entry AND p_mode = 'chronological' THEN FALSE
          ELSE entry_number_manual
        END
    WHERE id = v_new_ids[i];

    v_new := array_position(v_ids, v_new_ids[i]);
    IF (CASE WHEN v_new_ids[i] = p_entry THEN v_subject_old ELSE v_olds[v_new] END) IS DISTINCT FROM i
       AND (v_new_ids[i] <> p_entry OR p_audit_subject) THEN
      INSERT INTO public.accounting_audit_log (club_id, entry_id, user_id, action, old_value, new_value)
      VALUES (
        v_club,
        v_new_ids[i],
        p_user,
        'renumber',
        jsonb_build_object('entryNumber', CASE WHEN v_new_ids[i] = p_entry THEN v_subject_old ELSE v_olds[v_new] END),
        jsonb_build_object('entryNumber', i, 'manual', p_mode = 'manual' AND v_new_ids[i] = p_entry)
      );
    END IF;
    IF v_new_ids[i] <> p_entry AND v_manuals[v_new] AND v_olds[v_new] IS DISTINCT FROM i THEN
      IF v_parts <> '' THEN
        v_parts := v_parts || ' ; ';
      END IF;
      v_parts := v_parts || '« ' || v_labels[v_new] || ' » passe de ' || v_olds[v_new] || ' à ' || i;
    END IF;
    IF v_new_ids[i] <> p_entry AND v_olds[v_new] IS DISTINCT FROM i THEN
      v_shifted := TRUE;
    END IF;
  END LOOP;

  v_subject_new := array_position(v_new_ids, p_entry);

  IF p_mode = 'manual' THEN
    v_notice := 'Le numéro est placé en ' || v_subject_new || '.';
    IF v_parts <> '' THEN
      v_notice := v_notice || ' Des numéros corrigés manuellement sont décalés : ' || v_parts || '.';
    ELSIF v_shifted THEN
      v_notice := v_notice || ' Les autres écritures sont décalées.';
    END IF;
  ELSIF v_subject_manual AND v_subject_old IS DISTINCT FROM v_subject_new THEN
    v_notice := 'La date replace cette écriture. Le numéro corrigé manuellement passe de '
      || v_subject_old || ' à ' || v_subject_new || '.';
    IF v_parts <> '' THEN
      v_notice := v_notice || ' Des numéros corrigés manuellement sont décalés : ' || v_parts || '.';
    END IF;
  ELSIF v_parts <> '' THEN
    v_notice := 'Des numéros corrigés manuellement sont décalés : ' || v_parts || '.';
  END IF;

  IF v_notice <> '' THEN
    UPDATE public.accounting_settings
    SET numbering_notice = v_notice, updated_at = NOW()
    WHERE club_id = v_club;
  END IF;

  RETURN jsonb_build_object('notice', NULLIF(v_notice, ''), 'entry_number', v_subject_new);
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_compact_entry_numbers(p_period UUID, p_user UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_status TEXT;
  v_ids UUID[] := ARRAY[]::UUID[];
  v_olds INTEGER[] := ARRAY[]::INTEGER[];
  v_manuals BOOLEAN[] := ARRAY[]::BOOLEAN[];
  v_labels TEXT[] := ARRAY[]::TEXT[];
  v_count INTEGER;
  i INTEGER;
  v_parts TEXT := '';
  v_notice TEXT := '';
  rec RECORD;
BEGIN
  SELECT club_id, status INTO v_club, v_status
  FROM public.accounting_periods
  WHERE id = p_period
  FOR UPDATE;

  IF v_club IS NULL THEN
    RETURN jsonb_build_object('notice', NULL);
  END IF;
  IF v_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;

  PERFORM 1 FROM public.accounting_entries
  WHERE period_id = p_period AND status <> 'voided'
  FOR UPDATE;

  FOR rec IN
    SELECT id, entry_number, entry_number_manual, description
    FROM public.accounting_entries
    WHERE period_id = p_period AND status <> 'voided'
    ORDER BY entry_number, id
  LOOP
    v_ids := v_ids || rec.id;
    v_olds := v_olds || rec.entry_number;
    v_manuals := v_manuals || rec.entry_number_manual;
    v_labels := v_labels || COALESCE(rec.description, 'Écriture');
  END LOOP;

  v_count := COALESCE(array_length(v_ids, 1), 0);
  IF v_count = 0 THEN
    RETURN jsonb_build_object('notice', NULL);
  END IF;

  UPDATE public.accounting_entries
  SET entry_number = -entry_number
  WHERE period_id = p_period AND status <> 'voided' AND entry_number > 0;

  FOR i IN 1..v_count LOOP
    UPDATE public.accounting_entries
    SET entry_number = i
    WHERE id = v_ids[i];
    IF v_olds[i] IS DISTINCT FROM i THEN
      INSERT INTO public.accounting_audit_log (club_id, entry_id, user_id, action, old_value, new_value)
      VALUES (
        v_club, v_ids[i], p_user, 'renumber',
        jsonb_build_object('entryNumber', v_olds[i]),
        jsonb_build_object('entryNumber', i, 'manual', v_manuals[i])
      );
      IF v_manuals[i] THEN
        IF v_parts <> '' THEN v_parts := v_parts || ' ; '; END IF;
        v_parts := v_parts || '« ' || v_labels[i] || ' » passe de ' || v_olds[i] || ' à ' || i;
      END IF;
    END IF;
  END LOOP;

  IF v_parts <> '' THEN
    v_notice := 'Des numéros corrigés manuellement sont décalés : ' || v_parts || '.';
    UPDATE public.accounting_settings
    SET numbering_notice = v_notice, updated_at = NOW()
    WHERE club_id = v_club;
  END IF;

  RETURN jsonb_build_object('notice', NULLIF(v_notice, ''));
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_seed_period_numbers(p_period UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_status TEXT;
  v_ids UUID[] := ARRAY[]::UUID[];
  v_olds INTEGER[] := ARRAY[]::INTEGER[];
  v_count INTEGER;
  i INTEGER;
  rec RECORD;
BEGIN
  SELECT club_id, status INTO v_club, v_status
  FROM public.accounting_periods WHERE id = p_period FOR UPDATE;
  IF v_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.accounting_entries
    WHERE period_id = p_period AND status <> 'voided' AND entry_number_manual
  ) THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT id, entry_number
    FROM public.accounting_entries
    WHERE period_id = p_period AND status <> 'voided'
    ORDER BY entry_date, created_at, id::TEXT
  LOOP
    v_ids := v_ids || rec.id;
    v_olds := v_olds || rec.entry_number;
  END LOOP;

  v_count := COALESCE(array_length(v_ids, 1), 0);
  IF v_count = 0 THEN
    RETURN;
  END IF;

  UPDATE public.accounting_entries
  SET entry_number = -entry_number
  WHERE period_id = p_period AND status <> 'voided' AND entry_number > 0;

  FOR i IN 1..v_count LOOP
    UPDATE public.accounting_entries
    SET entry_number = i, entry_number_manual = FALSE
    WHERE id = v_ids[i];
    IF v_olds[i] IS DISTINCT FROM i THEN
      INSERT INTO public.accounting_audit_log (club_id, entry_id, user_id, action, old_value, new_value)
      VALUES (
        v_club, v_ids[i], NULL, 'renumber',
        jsonb_build_object('entryNumber', v_olds[i]),
        jsonb_build_object('entryNumber', i, 'manual', FALSE)
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_after_entry_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'voided' THEN
    RETURN NEW;
  END IF;
  PERFORM public.accounting_place_entry_number(NEW.id, 'chronological', NULL, NEW.created_by, FALSE, NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_entries_place_number ON public.accounting_entries;
CREATE TRIGGER accounting_entries_place_number
  AFTER INSERT ON public.accounting_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_after_entry_insert();

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
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
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
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
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
  v_entry_period UUID;
  v_old_date DATE;
  v_old_number INTEGER;
  v_number_manual BOOLEAN;
  v_user UUID;
  v_placed JSONB;
  v_compact JSONB;
  v_notice TEXT;
  v_final INTEGER;
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_id := (p_payload->>'entry_id')::UUID;

  SELECT status, period_id, entry_date, entry_number, COALESCE(reversed_by_entry_id, reversal_of_entry_id)
  INTO v_status, v_period_id, v_old_date, v_old_number, v_counterpart
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
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;
  IF v_status NOT IN ('pending', 'validated', 'reversed') THEN
    RAISE EXCEPTION 'Cette écriture ne peut plus être modifiée';
  END IF;

  v_period := NULLIF(p_payload->>'period_id', '')::UUID;
  IF v_period IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE id = v_period AND club_id = v_club AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
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
        RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
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

  v_number := NULLIF(p_payload->>'entry_number', '')::INTEGER;
  v_number_manual := COALESCE((p_payload->>'number_manual')::BOOLEAN, FALSE);
  v_user := NULLIF(p_payload->>'user_id', '')::UUID;
  IF v_number_manual AND (v_number IS NULL OR v_number < 1) THEN
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
    period_id = COALESCE(v_period, period_id),
    reversed_by_entry_id = NULL
  WHERE id = v_id AND club_id = v_club;

  v_placed := NULL;
  v_compact := NULL;
  IF v_period IS NOT NULL AND v_period IS DISTINCT FROM v_entry_period THEN
    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_final
    FROM public.accounting_entries
    WHERE period_id = v_period AND status <> 'voided' AND id <> v_id;
    UPDATE public.accounting_entries
    SET entry_number = GREATEST(v_final, 1)
    WHERE id = v_id AND club_id = v_club;
    v_compact := public.accounting_compact_entry_numbers(v_entry_period, v_user);
  END IF;

  IF v_number_manual THEN
    v_placed := public.accounting_place_entry_number(v_id, 'manual', v_number, v_user, TRUE, v_old_number);
  ELSIF (p_payload->>'entry_date')::DATE IS DISTINCT FROM v_old_date
     OR (v_period IS NOT NULL AND v_period IS DISTINCT FROM v_entry_period) THEN
    v_placed := public.accounting_place_entry_number(v_id, 'chronological', NULL, v_user, TRUE, v_old_number);
  END IF;

  v_notice := NULLIF(concat_ws(' ', NULLIF(v_compact->>'notice', ''), NULLIF(v_placed->>'notice', '')), '');
  v_final := COALESCE((v_placed->>'entry_number')::INTEGER, v_old_number);
  IF v_placed IS NULL THEN
    SELECT entry_number INTO v_final FROM public.accounting_entries WHERE id = v_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'status', v_next_status,
    'voided_counterpart', v_counterpart,
    'entry_number', v_final,
    'notice', v_notice
  );
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
  v_other_period UUID;
  v_compact JSONB;
  v_notice TEXT;
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
    RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
  END IF;

  v_other_period := NULL;
  IF v_counterpart IS NOT NULL AND v_counterpart <> p_entry THEN
    SELECT status, period_id
    INTO v_counterpart_status, v_other_period
    FROM public.accounting_entries
    WHERE id = v_counterpart AND club_id = p_club
    FOR UPDATE;

    SELECT status INTO v_counterpart_period
    FROM public.accounting_periods
    WHERE id = v_other_period;

    IF v_counterpart_status IS NOT NULL AND v_counterpart_status <> 'voided' THEN
      IF v_counterpart_period IS DISTINCT FROM 'open' THEN
        RAISE EXCEPTION 'Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.';
      END IF;
      UPDATE public.accounting_entries
      SET status = 'voided'
      WHERE id = v_counterpart AND club_id = p_club;
    ELSE
      v_counterpart := NULL;
      v_other_period := NULL;
    END IF;
  ELSE
    v_counterpart := NULL;
  END IF;

  UPDATE public.accounting_entries
  SET status = 'voided'
  WHERE id = p_entry AND club_id = p_club;

  v_compact := public.accounting_compact_entry_numbers(v_period_id, NULL);
  v_notice := NULLIF(v_compact->>'notice', '');
  IF v_other_period IS NOT NULL AND v_other_period IS DISTINCT FROM v_period_id THEN
    v_compact := public.accounting_compact_entry_numbers(v_other_period, NULL);
    v_notice := NULLIF(concat_ws(' ', v_notice, NULLIF(v_compact->>'notice', '')), '');
  END IF;

  RETURN jsonb_build_object('id', p_entry, 'voided_counterpart', v_counterpart, 'notice', v_notice);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_place_entry_number(UUID, TEXT, INTEGER, UUID, BOOLEAN, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_compact_entry_numbers(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_seed_period_numbers(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accounting_place_entry_number(UUID, TEXT, INTEGER, UUID, BOOLEAN, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.accounting_compact_entry_numbers(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.accounting_seed_period_numbers(UUID) TO service_role;

DO $$
DECLARE
  v_period UUID;
BEGIN
  FOR v_period IN
    SELECT id FROM public.accounting_periods WHERE status = 'open'
  LOOP
    PERFORM public.accounting_seed_period_numbers(v_period);
  END LOOP;
END $$;
