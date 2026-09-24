-- ============================================
-- MIGRATION 094 : écriture comptable avancée
-- ============================================
-- Référence de pièce, compte du même club, lignes remplaçables
-- seulement tant que l'écriture est à vérifier.
-- IDEMPOTENT.
-- ============================================

ALTER TABLE public.accounting_entries
  ADD COLUMN IF NOT EXISTS reference TEXT;

CREATE OR REPLACE FUNCTION public.accounting_guard_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Une écriture comptable ne se supprime pas';
  END IF;

  IF OLD.status IN ('validated', 'reversed') AND NEW.status = OLD.status THEN
    IF OLD.entry_date IS DISTINCT FROM NEW.entry_date
      OR OLD.amount IS DISTINCT FROM NEW.amount
      OR OLD.description IS DISTINCT FROM NEW.description
      OR OLD.reference IS DISTINCT FROM NEW.reference
      OR OLD.party_name IS DISTINCT FROM NEW.party_name
      OR OLD.counter_account_id IS DISTINCT FROM NEW.counter_account_id
      OR OLD.category_account_id IS DISTINCT FROM NEW.category_account_id
    THEN
      RAISE EXCEPTION 'Ecriture validée immuable';
    END IF;
  END IF;

  IF OLD.status = 'validated' AND NEW.status NOT IN ('validated', 'reversed') THEN
    RAISE EXCEPTION 'Transition de statut interdite';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_line_account_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_entry_club UUID;
  v_account_club UUID;
  v_active BOOLEAN;
BEGIN
  SELECT club_id INTO v_entry_club
  FROM public.accounting_entries
  WHERE id = NEW.entry_id;

  SELECT club_id, is_active INTO v_account_club, v_active
  FROM public.accounting_accounts
  WHERE id = NEW.account_id;

  IF v_account_club IS NULL OR v_account_club IS DISTINCT FROM v_entry_club THEN
    RAISE EXCEPTION 'Compte hors club';
  END IF;

  IF NOT COALESCE(v_active, FALSE) THEN
    RAISE EXCEPTION 'Compte désactivé';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_line_account_guard ON public.accounting_entry_lines;
CREATE TRIGGER accounting_line_account_guard
  BEFORE INSERT OR UPDATE OF account_id ON public.accounting_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_line_account_guard();

CREATE OR REPLACE FUNCTION public.accounting_update_advanced_entry(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_id UUID;
  v_status TEXT;
  v_source TEXT;
  v_event TEXT;
  v_line JSONB;
  v_order INTEGER := 0;
  v_debit NUMERIC(14, 2);
  v_credit NUMERIC(14, 2);
  v_amount NUMERIC(14, 2);
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_id := (p_payload->>'entry_id')::UUID;

  SELECT status, source_type, event_type
  INTO v_status, v_source, v_event
  FROM public.accounting_entries
  WHERE id = v_id AND club_id = v_club
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Écriture introuvable';
  END IF;

  IF v_status <> 'pending' OR v_source <> 'manual_accounting' OR v_event <> 'manual_advanced_entry' THEN
    RAISE EXCEPTION 'Seule une écriture avancée à vérifier peut être modifiée';
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

  v_amount := v_debit;
  UPDATE public.accounting_entries
  SET
    entry_date = (p_payload->>'entry_date')::DATE,
    description = COALESCE(p_payload->>'description', description),
    reference = NULLIF(p_payload->>'reference', ''),
    party_name = NULLIF(p_payload->>'remark', ''),
    amount = v_amount
  WHERE id = v_id AND club_id = v_club;

  RETURN jsonb_build_object('id', v_id, 'amount', v_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_update_advanced_entry(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_update_advanced_entry(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_update_advanced_entry(JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_update_advanced_entry(JSONB) TO service_role;
