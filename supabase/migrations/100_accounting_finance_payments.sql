-- Charges et revenus : l'écriture naît seulement quand le paiement est confirmé.
-- Créer une charge, la laisser en retard, ou prévoir un revenu ne comptabilise rien.
-- Les écritures déjà passées ne sont ni effacées ni repostées.

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS paid_on DATE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category_account_id UUID;

ALTER TABLE public.club_revenues ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.club_revenues ADD COLUMN IF NOT EXISTS received_on DATE;
ALTER TABLE public.club_revenues ADD COLUMN IF NOT EXISTS category_account_id UUID;

-- Les revenus déjà saisis restent des encaissements historiques. Les nouveaux sont prévus.
UPDATE public.club_revenues
SET status = 'encaisse'
WHERE status IS NULL;

ALTER TABLE public.club_revenues ALTER COLUMN status SET DEFAULT 'prevu';

ALTER TABLE public.club_revenues DROP CONSTRAINT IF EXISTS club_revenues_status_check;
ALTER TABLE public.club_revenues
  ADD CONSTRAINT club_revenues_status_check
  CHECK (status IN ('prevu', 'encaisse'));

UPDATE public.club_revenues SET status = 'prevu' WHERE status IS NULL;
ALTER TABLE public.club_revenues ALTER COLUMN status SET NOT NULL;

-- File d'attente jamais devenue une écriture : on ne la poste plus,
-- pour ne pas doubler une confirmation ultérieure.
UPDATE public.accounting_inbox
SET status = 'skipped', updated_at = NOW()
WHERE source_type IN ('expense', 'club_revenue', 'support_sale')
  AND status IN ('pending', 'awaiting_account', 'awaiting_category', 'awaiting_details')
  AND NOT EXISTS (
    SELECT 1
    FROM public.accounting_entries e
    WHERE e.club_id = accounting_inbox.club_id
      AND e.source_id = accounting_inbox.source_id
      AND e.event_type = accounting_inbox.event_type
      AND e.status IN ('pending', 'validated')
  );

CREATE TABLE IF NOT EXISTS public.finance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('expense', 'club_revenue')),
  source_id UUID NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  paid_on DATE NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  category_account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  entry_id UUID REFERENCES public.accounting_entries(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT finance_payments_idem UNIQUE (club_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS finance_payments_source
  ON public.finance_payments (club_id, source_type, source_id);

CREATE UNIQUE INDEX IF NOT EXISTS finance_payments_entry
  ON public.finance_payments (entry_id)
  WHERE entry_id IS NOT NULL;

ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.finance_payments FROM PUBLIC;
REVOKE ALL ON public.finance_payments FROM anon;
REVOKE ALL ON public.finance_payments FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.finance_payments TO service_role;

CREATE OR REPLACE FUNCTION public.accounting_on_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer une charge ou la laisser ouverte ne comptabilise rien.
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_on_club_revenue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prévoir un revenu ne comptabilise rien.
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_guard_expense_paid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paye' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paye') THEN
    IF current_setting('obillz.cash_payment', true) IS DISTINCT FROM 'on' THEN
      IF TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'Une charge ne peut pas être créée déjà payée. Confirmez le paiement ensuite.';
      END IF;
      RAISE EXCEPTION 'Confirmez le paiement pour marquer cette charge comme payée.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_guard_expense_paid ON public.expenses;
CREATE TRIGGER accounting_guard_expense_paid
  BEFORE INSERT OR UPDATE OF status
  ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_guard_expense_paid();

CREATE OR REPLACE FUNCTION public.accounting_guard_revenue_received()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'encaisse' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'encaisse') THEN
    IF current_setting('obillz.cash_payment', true) IS DISTINCT FROM 'on' THEN
      RAISE EXCEPTION 'Confirmez l''encaissement pour marquer ce revenu comme encaissé.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_guard_revenue_received ON public.club_revenues;
CREATE TRIGGER accounting_guard_revenue_received
  BEFORE INSERT OR UPDATE OF status
  ON public.club_revenues
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_guard_revenue_received();

CREATE OR REPLACE FUNCTION public.accounting_record_finance_payment(
  p_club UUID,
  p_source_type TEXT,
  p_source UUID,
  p_user UUID,
  p_paid_on DATE,
  p_account UUID,
  p_amount NUMERIC,
  p_key TEXT,
  p_category UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC(14, 2);
  v_description TEXT;
  v_legacy UUID;
  v_event TEXT;
  v_direction TEXT;
  v_historical NUMERIC(14, 2);
  v_paid NUMERIC(14, 2);
  v_already NUMERIC(14, 2);
  v_remaining NUMERIC(14, 2);
  v_amount NUMERIC(14, 2);
  v_account_code TEXT;
  v_category_type TEXT;
  v_period UUID;
  v_payment UUID;
  v_existing_entry UUID;
  v_posted JSONB;
  v_entry UUID;
  v_status TEXT;
  v_ready BOOLEAN;
BEGIN
  IF p_club IS NULL OR p_source IS NULL OR p_key IS NULL OR btrim(p_key) = '' THEN
    RAISE EXCEPTION 'Paiement incomplet';
  END IF;
  IF p_source_type NOT IN ('expense', 'club_revenue') THEN
    RAISE EXCEPTION 'Paiement incomplet';
  END IF;
  IF p_paid_on IS NULL THEN
    RAISE EXCEPTION 'Date de paiement invalide';
  END IF;

  IF p_source_type = 'expense' THEN
    SELECT e.amount, e.description
    INTO v_total, v_description
    FROM public.expenses e
    WHERE e.id = p_source AND e.user_id = p_club AND e.deleted_at IS NULL
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Charge introuvable';
    END IF;
    v_legacy := NULL;
    v_event := 'payment_sent';
    v_direction := 'out';
    v_status := 'paye';
  ELSE
    SELECT r.amount, r.name, r.source_id
    INTO v_total, v_description, v_legacy
    FROM public.club_revenues r
    WHERE r.id = p_source AND r.user_id = p_club AND r.deleted_at IS NULL
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Revenu introuvable';
    END IF;
    v_event := 'payment_received';
    v_direction := 'in';
    v_status := 'encaisse';
  END IF;

  v_total := ROUND(COALESCE(v_total, 0), 2);

  SELECT onboarding_completed_at IS NOT NULL INTO v_ready
  FROM public.accounting_settings
  WHERE club_id = p_club;

  IF NOT COALESCE(v_ready, FALSE) THEN
    v_amount := ROUND(COALESCE(p_amount, 0), 2);
    IF v_amount IS DISTINCT FROM v_total OR v_amount <= 0 THEN
      RAISE EXCEPTION 'Le montant confirmé doit correspondre au montant restant';
    END IF;
    PERFORM set_config('obillz.cash_payment', 'on', true);
    IF p_source_type = 'expense' THEN
      UPDATE public.expenses
      SET status = 'paye', paid_on = p_paid_on, updated_at = NOW()
      WHERE id = p_source AND user_id = p_club;
    ELSE
      UPDATE public.club_revenues
      SET status = 'encaisse', received_on = p_paid_on, updated_at = NOW()
      WHERE id = p_source AND user_id = p_club;
    END IF;
    RETURN jsonb_build_object(
      'created', false, 'already', false, 'paid', true, 'status', v_status,
      'received', v_amount, 'remaining', 0, 'entry_id', NULL
    );
  END IF;

  IF p_category IS NULL THEN
    RAISE EXCEPTION 'Choisissez une catégorie comptable';
  END IF;

  SELECT fp.entry_id INTO v_existing_entry
  FROM public.finance_payments fp
  WHERE fp.club_id = p_club AND fp.idempotency_key = btrim(p_key);

  SELECT COALESCE(SUM(e.amount), 0) INTO v_historical
  FROM public.accounting_entries e
  WHERE e.club_id = p_club
    AND e.event_type = v_event
    AND e.status IN ('pending', 'validated')
    AND (
      e.source_id = p_source
      OR (v_legacy IS NOT NULL AND e.source_id = v_legacy)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.finance_payments fp WHERE fp.entry_id = e.id
    );

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM public.finance_payments
  WHERE club_id = p_club AND source_type = p_source_type AND source_id = p_source;

  v_already := ROUND(v_historical + v_paid, 2);
  v_remaining := ROUND(GREATEST(v_total - v_already, 0), 2);

  IF v_existing_entry IS NOT NULL OR EXISTS (
    SELECT 1 FROM public.finance_payments
    WHERE club_id = p_club AND idempotency_key = btrim(p_key)
  ) THEN
    RETURN jsonb_build_object(
      'created', false,
      'already', true,
      'paid', v_remaining <= 0,
      'status', v_status,
      'received', v_already,
      'remaining', v_remaining,
      'entry_id', v_existing_entry
    );
  END IF;

  IF v_remaining <= 0 THEN
    PERFORM set_config('obillz.cash_payment', 'on', true);
    IF p_source_type = 'expense' THEN
      UPDATE public.expenses
      SET status = 'paye',
          paid_on = COALESCE(paid_on, p_paid_on),
          updated_at = NOW()
      WHERE id = p_source AND user_id = p_club;
    ELSE
      UPDATE public.club_revenues
      SET status = 'encaisse',
          received_on = COALESCE(received_on, p_paid_on),
          updated_at = NOW()
      WHERE id = p_source AND user_id = p_club;
    END IF;
    RETURN jsonb_build_object(
      'created', false,
      'already', true,
      'paid', true,
      'status', v_status,
      'received', v_already,
      'remaining', 0,
      'entry_id', NULL
    );
  END IF;

  v_amount := ROUND(COALESCE(p_amount, 0), 2);
  IF v_amount IS DISTINCT FROM v_remaining OR v_amount <= 0 THEN
    RAISE EXCEPTION 'Le montant confirmé doit correspondre au montant restant';
  END IF;

  SELECT system_code INTO v_account_code
  FROM public.accounting_accounts
  WHERE id = p_account AND club_id = p_club AND is_active AND account_type = 'asset';

  IF v_account_code IS NULL
     OR NOT (
       v_account_code = 'cash'
       OR v_account_code = 'bank'
       OR v_account_code ~ '^bank_[0-9]+$'
     ) THEN
    RAISE EXCEPTION 'Choisissez un compte de trésorerie : banque, poste ou caisse';
  END IF;

  SELECT account_type INTO v_category_type
  FROM public.accounting_accounts
  WHERE id = p_category AND club_id = p_club AND is_active;

  IF p_source_type = 'expense' AND v_category_type IS DISTINCT FROM 'expense' THEN
    RAISE EXCEPTION 'Choisissez une catégorie de charge';
  END IF;
  IF p_source_type = 'club_revenue' AND v_category_type IS DISTINCT FROM 'revenue' THEN
    RAISE EXCEPTION 'Choisissez une catégorie de produit';
  END IF;

  SELECT id INTO v_period
  FROM public.accounting_periods
  WHERE club_id = p_club
    AND status = 'open'
    AND p_paid_on BETWEEN starts_on AND ends_on
  LIMIT 1;

  IF v_period IS NULL THEN
    RAISE EXCEPTION 'Aucun exercice ouvert à cette date';
  END IF;

  INSERT INTO public.finance_payments (
    club_id, source_type, source_id, amount, paid_on, account_id, category_account_id, idempotency_key, created_by
  ) VALUES (
    p_club, p_source_type, p_source, v_amount, p_paid_on, p_account, p_category, btrim(p_key), p_user
  )
  RETURNING id INTO v_payment;

  -- Montant confirmé, sans ligne de TVA ajoutée : même traitement que les encaissements de documents.
  v_posted := public.accounting_post_entry(jsonb_build_object(
    'club_id', p_club,
    'period_id', v_period,
    'entry_date', p_paid_on,
    'description', COALESCE(NULLIF(btrim(v_description), ''), CASE WHEN p_source_type = 'expense' THEN 'Charge' ELSE 'Revenu' END),
    'amount', v_amount,
    'direction', v_direction,
    'source_type', p_source_type,
    'source_id', p_source,
    'event_type', v_event,
    'idempotency_key', 'finance:' || v_payment::TEXT,
    'status', 'validated',
    'counter_account_id', p_account,
    'category_account_id', p_category,
    'created_by', p_user,
    'audit_action', 'finance_payment',
    'lines', CASE
      WHEN p_source_type = 'expense' THEN jsonb_build_array(
        jsonb_build_object('account_id', p_category, 'debit', v_amount, 'credit', 0),
        jsonb_build_object('account_id', p_account, 'debit', 0, 'credit', v_amount)
      )
      ELSE jsonb_build_array(
        jsonb_build_object('account_id', p_account, 'debit', v_amount, 'credit', 0),
        jsonb_build_object('account_id', p_category, 'debit', 0, 'credit', v_amount)
      )
    END
  ));

  v_entry := (v_posted->>'id')::UUID;
  UPDATE public.finance_payments SET entry_id = v_entry WHERE id = v_payment;

  PERFORM set_config('obillz.cash_payment', 'on', true);
  IF p_source_type = 'expense' THEN
    UPDATE public.expenses
    SET status = 'paye',
        paid_on = p_paid_on,
        category_account_id = p_category,
        updated_at = NOW()
    WHERE id = p_source AND user_id = p_club;
  ELSE
    UPDATE public.club_revenues
    SET status = 'encaisse',
        received_on = p_paid_on,
        category_account_id = p_category,
        updated_at = NOW()
    WHERE id = p_source AND user_id = p_club;
  END IF;

  UPDATE public.accounting_inbox
  SET status = 'skipped', updated_at = NOW()
  WHERE club_id = p_club
    AND source_id = p_source
    AND event_type = v_event
    AND status IN ('pending', 'awaiting_account', 'awaiting_category', 'awaiting_details');

  RETURN jsonb_build_object(
    'created', true,
    'already', false,
    'paid', true,
    'status', v_status,
    'received', v_amount + v_already,
    'remaining', 0,
    'entry_id', v_entry
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_record_finance_payment(UUID, TEXT, UUID, UUID, DATE, UUID, NUMERIC, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_record_finance_payment(UUID, TEXT, UUID, UUID, DATE, UUID, NUMERIC, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_record_finance_payment(UUID, TEXT, UUID, UUID, DATE, UUID, NUMERIC, TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_record_finance_payment(UUID, TEXT, UUID, UUID, DATE, UUID, NUMERIC, TEXT, UUID) TO service_role;
