-- Numéros de documents, budget et lecture des appartenances.
-- N'écrit aucune ligne métier. Ne désactive aucun verrou comptable.
-- Ne prend pas le rôle supabase_storage_admin.
-- À lancer en une transaction dans l'éditeur SQL. Ne pas l'exécuter depuis l'application.
--
-- Contrôle après application :
-- SELECT has_table_privilege('authenticated', 'public.club_memberships', 'SELECT') AS lecture,
--        has_table_privilege('authenticated', 'public.club_memberships', 'INSERT') AS insertion,
--        has_table_privilege('anon', 'public.club_memberships', 'SELECT') AS anon_lecture;
-- lecture vrai, insertion faux, anon_lecture faux.
--
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conname = 'accounting_settings_history_import';
-- doit citer not_requested, planned, manual, applied.
--
-- SELECT has_function_privilege('service_role', 'public.reserve_document_sequence(uuid, text, integer)', 'EXECUTE') AS service,
--        has_function_privilege('authenticated', 'public.reserve_document_sequence(uuid, text, integer)', 'EXECUTE') AS auth;
-- service vrai, auth faux. Même attente pour accounting_save_budget_draft.

-- Lecture des appartenances par la session du membre.
-- RLS membership_select_own_club limite les lignes. Les écritures restent au service_role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.club_memberships FROM anon, authenticated;
GRANT SELECT ON TABLE public.club_memberships TO authenticated;

-- Le statut d'import suit la contrainte. Une valeur inconnue échoue avec un message,
-- elle n'est pas enregistrée.
ALTER TABLE public.accounting_settings
  DROP CONSTRAINT IF EXISTS accounting_settings_history_import;

ALTER TABLE public.accounting_settings
  ADD CONSTRAINT accounting_settings_history_import
  CHECK (history_import_status IN ('not_requested', 'planned', 'manual', 'applied'));

CREATE OR REPLACE FUNCTION public.accounting_settings_history_status_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.history_import_status IS NULL OR btrim(NEW.history_import_status) = '' THEN
    NEW.history_import_status := 'not_requested';
  ELSIF NEW.history_import_status NOT IN ('not_requested', 'planned', 'manual', 'applied') THEN
    RAISE EXCEPTION 'Statut d''import inconnu (%). Valeurs acceptées : not_requested, planned, manual, applied. Aucune écriture n''a été créée.', NEW.history_import_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_settings_history_status_guard ON public.accounting_settings;
CREATE TRIGGER accounting_settings_history_status_guard
  BEFORE INSERT OR UPDATE OF history_import_status ON public.accounting_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_settings_history_status_guard();

CREATE TABLE IF NOT EXISTS public.document_number_counters (
  club_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_seq INTEGER NOT NULL,
  PRIMARY KEY (club_id, doc_type, year),
  CONSTRAINT document_number_counters_type CHECK (doc_type IN ('invoice', 'quote')),
  CONSTRAINT document_number_counters_seq CHECK (last_seq >= 0)
);

REVOKE ALL ON TABLE public.document_number_counters FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.document_number_counters TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_document_sequence(p_club UUID, p_type TEXT, p_year INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing INTEGER;
  v_seq INTEGER;
BEGIN
  IF p_club IS NULL OR p_type NOT IN ('invoice', 'quote') OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'Type ou année de document invalide';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_club::text || ':' || p_type || ':' || p_year::text, 0)
  );

  SELECT COALESCE(MAX(
    CASE
      WHEN btrim(numero) ~ ('^(FAC|COT)-' || p_year::text || '-[0-9]+$')
      THEN substring(btrim(numero) FROM '([0-9]+)$')::INTEGER
      ELSE NULL
    END
  ), 0)
  INTO v_existing
  FROM public.documents
  WHERE user_id = p_club
    AND type = p_type
    AND deleted_at IS NULL
    AND numero IS NOT NULL;

  INSERT INTO public.document_number_counters (club_id, doc_type, year, last_seq)
  VALUES (p_club, p_type, p_year, v_existing + 1)
  ON CONFLICT (club_id, doc_type, year)
  DO UPDATE SET last_seq = GREATEST(public.document_number_counters.last_seq, EXCLUDED.last_seq - 1) + 1
  RETURNING last_seq INTO v_seq;

  RETURN v_seq;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_document_sequence(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_document_sequence(UUID, TEXT, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.accounting_save_budget_draft(
  p_club UUID,
  p_user UUID,
  p_period UUID,
  p_lines JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_budget UUID;
  v_version INTEGER;
  v_line JSONB;
  v_account TEXT;
  v_group TEXT;
  v_seen_accounts UUID[] := ARRAY[]::UUID[];
  v_seen_groups UUID[] := ARRAY[]::UUID[];
  v_uuid_re CONSTANT TEXT := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
BEGIN
  IF p_club IS NULL OR p_period IS NULL THEN
    RAISE EXCEPTION 'Exercice introuvable';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE id = p_period AND club_id = p_club
  ) THEN
    RAISE EXCEPTION 'Exercice introuvable';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('budget:' || p_club::text || ':' || p_period::text, 0));

  IF EXISTS (
    SELECT 1 FROM public.accounting_budgets
    WHERE club_id = p_club AND period_id = p_period AND status = 'validated'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.accounting_budgets
    WHERE club_id = p_club AND period_id = p_period AND status = 'draft'
  ) THEN
    RAISE EXCEPTION 'Ce budget est validé. Révisez-le pour préparer une nouvelle version.';
  END IF;

  SELECT id INTO v_budget
  FROM public.accounting_budgets
  WHERE club_id = p_club AND period_id = p_period AND status = 'draft'
  FOR UPDATE;

  IF v_budget IS NULL THEN
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_version
    FROM public.accounting_budgets
    WHERE club_id = p_club AND period_id = p_period;
    INSERT INTO public.accounting_budgets (club_id, period_id, status, version, created_by)
    VALUES (p_club, p_period, 'draft', v_version, p_user)
    RETURNING id INTO v_budget;
  ELSE
    UPDATE public.accounting_budgets
    SET updated_at = NOW()
    WHERE id = v_budget AND club_id = p_club AND status = 'draft';
  END IF;

  DELETE FROM public.accounting_budget_lines
  WHERE budget_id = v_budget AND club_id = p_club;

  FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(p_lines, '[]'::JSONB))
  LOOP
    v_account := NULLIF(v_line->>'account_id', '');
    v_group := NULLIF(v_line->>'group_id', '');
    IF v_account IS NOT NULL AND v_account !~ v_uuid_re THEN
      RAISE EXCEPTION 'Le numéro de compte n''est pas l''identifiant technique du budget.';
    END IF;
    IF v_group IS NOT NULL AND v_group !~ v_uuid_re THEN
      RAISE EXCEPTION 'La rubrique du budget n''a pas d''identifiant technique.';
    END IF;
    IF v_account IS NOT NULL AND v_group IS NOT NULL THEN
      RAISE EXCEPTION 'Une ligne de budget vise un compte ou une rubrique, pas les deux.';
    END IF;
    IF v_account IS NOT NULL THEN
      IF v_account::UUID = ANY (v_seen_accounts) THEN
        RAISE EXCEPTION 'Ce compte est déjà dans le budget.';
      END IF;
      v_seen_accounts := v_seen_accounts || v_account::UUID;
    END IF;
    IF v_group IS NOT NULL THEN
      IF v_group::UUID = ANY (v_seen_groups) THEN
        RAISE EXCEPTION 'Cette rubrique est déjà dans le budget.';
      END IF;
      v_seen_groups := v_seen_groups || v_group::UUID;
    END IF;
    INSERT INTO public.accounting_budget_lines (
      budget_id, club_id, account_id, group_id, group_number, group_name, amount
    ) VALUES (
      v_budget,
      p_club,
      v_account::UUID,
      CASE WHEN v_account IS NULL THEN v_group::UUID ELSE NULL END,
      CASE WHEN v_account IS NULL THEN NULLIF(v_line->>'group_number', '') ELSE NULL END,
      CASE WHEN v_account IS NULL THEN NULLIF(v_line->>'group_name', '') ELSE NULL END,
      ROUND(COALESCE((v_line->>'amount')::NUMERIC, 0), 2)
    );
  END LOOP;

  RETURN v_budget;
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_save_budget_draft(UUID, UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_save_budget_draft(UUID, UUID, UUID, JSONB) TO service_role;
