-- Clôture atomique, frais Stripe réels, versement vers la banque,
-- et finalisation d'une vente de soutien en une seule écriture.
-- Dépend des migrations 099, 100 et 101.
-- N'efface aucune écriture existante.

ALTER TABLE public.accounting_settings
  ADD COLUMN IF NOT EXISTS stripe_payout_account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS stripe_fee_cents INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.supporters
  ADD COLUMN IF NOT EXISTS stripe_fee_cents INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.accounting_stripe_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_id TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  paid_on DATE NOT NULL,
  bank_account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  entry_id UUID REFERENCES public.accounting_entries(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('posted', 'pending_account')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounting_stripe_payouts_unique UNIQUE (club_id, payout_id)
);

ALTER TABLE public.accounting_stripe_payouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.accounting_stripe_payouts FROM PUBLIC;
REVOKE ALL ON public.accounting_stripe_payouts FROM anon;
REVOKE ALL ON public.accounting_stripe_payouts FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.accounting_stripe_payouts TO service_role;

-- Le report et la clôture tiennent dans une seule transaction.
-- Si l'écriture de report échoue, l'ancien report et l'exercice ouvert restent en place.
CREATE OR REPLACE FUNCTION public.accounting_close_period(
  p_club UUID,
  p_period UUID,
  p_user UUID,
  p_transfer BOOLEAN,
  p_lines JSONB,
  p_next_start DATE,
  p_next_end DATE,
  p_next_label TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period public.accounting_periods%ROWTYPE;
  v_active UUID;
  v_active_count INTEGER;
  v_match BOOLEAN := FALSE;
  v_entry UUID;
  v_key TEXT;
  v_count INTEGER;
  v_amount NUMERIC(14, 2);
  v_plug NUMERIC(14, 2);
  v_debit NUMERIC(14, 2);
  v_credit NUMERIC(14, 2);
  v_retained UUID;
  v_posted JSONB;
  v_status TEXT;
  v_replaced BOOLEAN := FALSE;
BEGIN
  IF p_club IS NULL OR p_period IS NULL OR p_next_start IS NULL OR p_next_end IS NULL THEN
    RAISE EXCEPTION 'Clôture incomplète';
  END IF;
  IF p_next_end < p_next_start THEN
    RAISE EXCEPTION 'Exercice suivant invalide';
  END IF;

  PERFORM 1
  FROM public.accounting_settings
  WHERE club_id = p_club
  FOR UPDATE;

  SELECT * INTO v_period
  FROM public.accounting_periods
  WHERE id = p_period AND club_id = p_club
  FOR UPDATE;

  IF NOT FOUND OR v_period.status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Exercice introuvable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.accounting_entries e
    WHERE e.club_id = p_club
      AND e.status = 'pending'
      AND (
        e.period_id = p_period
        OR e.entry_date BETWEEN v_period.starts_on AND v_period.ends_on
      )
  ) OR EXISTS (
    SELECT 1
    FROM public.accounting_inbox i
    WHERE i.club_id = p_club
      AND i.status IN (
        'pending', 'awaiting_account', 'awaiting_category',
        'awaiting_details', 'blocked_closed_period'
      )
      AND i.entry_date BETWEEN v_period.starts_on AND v_period.ends_on
  ) THEN
    RAISE EXCEPTION 'Il reste des opérations à vérifier';
  END IF;

  IF COALESCE(p_transfer, FALSE) THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(p_lines, '[]'::jsonb)) line
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.accounting_accounts a
        WHERE a.id = (line->>'account_id')::uuid
          AND a.club_id = p_club
      )
    ) THEN
      RAISE EXCEPTION 'Compte de report introuvable';
    END IF;

    SELECT
      ROUND(COALESCE(SUM((line->>'debit')::numeric), 0), 2),
      ROUND(COALESCE(SUM((line->>'credit')::numeric), 0), 2)
    INTO v_debit, v_credit
    FROM jsonb_array_elements(COALESCE(p_lines, '[]'::jsonb)) line;

    IF COALESCE(jsonb_array_length(p_lines), 0) > 0
       AND (COALESCE(jsonb_array_length(p_lines), 0) < 2 OR v_debit <> v_credit OR v_debit <= 0) THEN
      RAISE EXCEPTION 'Écriture de report déséquilibrée';
    END IF;

    SELECT COUNT(*) INTO v_active_count
    FROM public.accounting_entries e
    WHERE e.club_id = p_club
      AND e.source_type = 'period_close'
      AND e.source_id = p_period
      AND e.status IN ('pending', 'validated');

    v_active := NULL;
    IF v_active_count = 1 THEN
      SELECT e.id INTO v_active
      FROM public.accounting_entries e
      WHERE e.club_id = p_club
        AND e.source_type = 'period_close'
        AND e.source_id = p_period
        AND e.status IN ('pending', 'validated');

      SELECT NOT EXISTS (
        (
          SELECT (line->>'account_id')::uuid, ROUND((line->>'debit')::numeric, 2), ROUND((line->>'credit')::numeric, 2)
          FROM jsonb_array_elements(COALESCE(p_lines, '[]'::jsonb)) line
          EXCEPT
          SELECT account_id, ROUND(debit, 2), ROUND(credit, 2)
          FROM public.accounting_entry_lines
          WHERE entry_id = v_active
        )
        UNION ALL
        (
          SELECT account_id, ROUND(debit, 2), ROUND(credit, 2)
          FROM public.accounting_entry_lines
          WHERE entry_id = v_active
          EXCEPT
          SELECT (line->>'account_id')::uuid, ROUND((line->>'debit')::numeric, 2), ROUND((line->>'credit')::numeric, 2)
          FROM jsonb_array_elements(COALESCE(p_lines, '[]'::jsonb)) line
        )
      ) INTO v_match;
    ELSIF v_active_count = 0 AND COALESCE(jsonb_array_length(p_lines), 0) = 0 THEN
      v_match := TRUE;
    END IF;

    IF NOT COALESCE(v_match, FALSE) THEN
      INSERT INTO public.accounting_audit_log (club_id, entry_id, user_id, action, old_value, new_value)
      SELECT p_club, e.id, p_user, 'period_close_replace',
        jsonb_build_object('status', e.status, 'entry_number', e.entry_number),
        jsonb_build_object('status', 'voided')
      FROM public.accounting_entries e
      WHERE e.club_id = p_club
        AND e.source_type = 'period_close'
        AND e.source_id = p_period
        AND e.status IN ('pending', 'validated');

      FOR v_entry IN
        SELECT e.id
        FROM public.accounting_entries e
        WHERE e.club_id = p_club
          AND e.source_type = 'period_close'
          AND e.source_id = p_period
          AND e.status IN ('pending', 'validated')
      LOOP
        PERFORM public.accounting_void_journal_entry(p_club, v_entry);
      END LOOP;

      IF COALESCE(jsonb_array_length(p_lines), 0) >= 2 THEN
        SELECT id INTO v_retained
        FROM public.accounting_accounts
        WHERE club_id = p_club AND system_code = 'retained' AND is_active
        LIMIT 1;

        IF v_retained IS NULL THEN
          RAISE EXCEPTION 'Compte 2900 introuvable';
        END IF;

        SELECT COUNT(*) INTO v_count
        FROM public.accounting_entries
        WHERE club_id = p_club
          AND source_type = 'period_close'
          AND source_id = p_period;

        v_key := 'period_close:' || p_period::text || ':' || (v_count + 1)::text;

        SELECT ROUND(COALESCE(SUM(
          CASE
            WHEN (line->>'account_id')::uuid = v_retained
            THEN (line->>'credit')::numeric - (line->>'debit')::numeric
            ELSE 0
          END
        ), 0), 2)
        INTO v_plug
        FROM jsonb_array_elements(p_lines) line;

        v_amount := ROUND(ABS(v_plug), 2);
        IF v_amount = 0 THEN
          v_amount := v_debit;
        END IF;

        v_posted := public.accounting_post_entry(jsonb_build_object(
          'club_id', p_club,
          'period_id', p_period,
          'entry_date', v_period.ends_on,
          'description', 'Report du résultat',
          'amount', v_amount,
          'direction', 'adjustment',
          'source_type', 'period_close',
          'source_id', p_period,
          'event_type', 'adjustment',
          'idempotency_key', v_key,
          'status', 'validated',
          'category_account_id', v_retained,
          'created_by', p_user,
          'audit_action', 'period_close',
          'lines', p_lines
        ));

        v_entry := (v_posted->>'id')::uuid;
        SELECT status INTO v_status
        FROM public.accounting_entries
        WHERE id = v_entry AND club_id = p_club;

        IF v_status IS DISTINCT FROM 'validated' OR COALESCE(v_posted->>'created', 'true') = 'false' THEN
          RAISE EXCEPTION 'Le report du résultat n''a pas pu être enregistré';
        END IF;
        v_replaced := TRUE;
      END IF;
    END IF;
  END IF;

  UPDATE public.accounting_periods
  SET status = 'closed',
      closed_at = NOW(),
      closed_by = p_user
  WHERE id = p_period AND club_id = p_club;

  BEGIN
    INSERT INTO public.accounting_periods (club_id, label, starts_on, ends_on, status)
    SELECT p_club, COALESCE(NULLIF(btrim(p_next_label), ''), 'Exercice suivant'), p_next_start, p_next_end, 'open'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.accounting_periods existing
      WHERE existing.club_id = p_club
        AND existing.starts_on = p_next_start
    );
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  INSERT INTO public.accounting_audit_log (club_id, user_id, action, new_value)
  VALUES (
    p_club,
    p_user,
    'close_period',
    jsonb_build_object('periodId', p_period, 'transferResult', COALESCE(p_transfer, FALSE), 'replacedClose', v_replaced)
  );

  RETURN jsonb_build_object('closed', true, 'replaced', v_replaced);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_close_period(UUID, UUID, UUID, BOOLEAN, JSONB, DATE, DATE, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_close_period(UUID, UUID, UUID, BOOLEAN, JSONB, DATE, DATE, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_close_period(UUID, UUID, UUID, BOOLEAN, JSONB, DATE, DATE, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_close_period(UUID, UUID, UUID, BOOLEAN, JSONB, DATE, DATE, TEXT) TO service_role;

-- Frais réels : le produit reste le brut, une seule fois. Stripe ne reçoit que le net.
CREATE OR REPLACE FUNCTION public.accounting_on_shop_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(14, 2);
  v_fee NUMERIC(14, 2);
  v_date DATE;
  v_party TEXT;
BEGIN
  v_amount := ROUND(COALESCE(NEW.total_cents, 0) / 100.0, 2);
  v_fee := ROUND(COALESCE(NEW.stripe_fee_cents, 0) / 100.0, 2);
  IF v_fee < 0 OR v_fee >= v_amount THEN
    v_fee := 0;
  END IF;
  v_date := COALESCE((NEW.paid_at AT TIME ZONE 'Europe/Zurich')::DATE, (timezone('Europe/Zurich', NOW()))::DATE);
  v_party := NULLIF(TRIM(CONCAT_WS(' ', NEW.customer_first_name, NEW.customer_last_name)), '');

  IF NEW.payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'shop_order', NEW.id, 'payment_received', 'in',
      v_amount, v_fee, v_date,
      'Boutique', v_party, 'stripe', 'shop'
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.payment_status = 'paid'
    AND NEW.payment_status = 'refunded' THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'shop_order', NEW.id, 'payment_reversed', 'reversal',
      v_amount, v_fee, (timezone('Europe/Zurich', NOW()))::DATE,
      'Remboursement boutique', v_party, 'stripe', 'shop'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'accounting_on_shop_order: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_on_supporter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(14, 2);
  v_fee NUMERIC(14, 2);
  v_date DATE;
BEGIN
  v_amount := ROUND(COALESCE(NEW.amount_paid_cents, 0) / 100.0, 2);
  v_fee := ROUND(COALESCE(NEW.stripe_fee_cents, 0) / 100.0, 2);
  IF v_fee < 0 OR v_fee >= v_amount THEN
    v_fee := 0;
  END IF;
  v_date := COALESCE((NEW.activated_at AT TIME ZONE 'Europe/Zurich')::DATE, (timezone('Europe/Zurich', NOW()))::DATE);

  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'supporter', NEW.id, 'payment_received', 'in',
      v_amount, v_fee, v_date,
      'Carte supporter', NULLIF(TRIM(COALESCE(NEW.first_name, '')), ''),
      'stripe', 'supporters'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'cancelled' THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'supporter', NEW.id, 'payment_reversed', 'reversal',
      v_amount, v_fee, (timezone('Europe/Zurich', NOW()))::DATE,
      'Annulation carte supporter', NULLIF(TRIM(COALESCE(NEW.first_name, '')), ''),
      'stripe', 'supporters'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'accounting_on_supporter: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN
);

CREATE OR REPLACE FUNCTION public.accounting_record_document_receipt(
  p_club UUID,
  p_document TEXT,
  p_user UUID,
  p_received_on DATE,
  p_account UUID,
  p_amount NUMERIC,
  p_key TEXT,
  p_category TEXT,
  p_allow_stripe BOOLEAN DEFAULT FALSE,
  p_fee NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.documents%ROWTYPE;
  v_source TEXT;
  v_paid_status TEXT;
  v_total NUMERIC(14, 2);
  v_historical NUMERIC(14, 2);
  v_receipts NUMERIC(14, 2);
  v_already NUMERIC(14, 2);
  v_remaining NUMERIC(14, 2);
  v_amount NUMERIC(14, 2);
  v_fee NUMERIC(14, 2);
  v_received NUMERIC(14, 2);
  v_account_code TEXT;
  v_category UUID;
  v_fee_account UUID;
  v_period UUID;
  v_party TEXT;
  v_description TEXT;
  v_receipt UUID;
  v_existing_entry UUID;
  v_posted JSONB;
  v_entry UUID;
  v_lines JSONB;
BEGIN
  IF p_club IS NULL OR p_document IS NULL OR btrim(p_document) = '' OR p_key IS NULL OR btrim(p_key) = '' THEN
    RAISE EXCEPTION 'Encaissement incomplet';
  END IF;
  IF p_received_on IS NULL THEN
    RAISE EXCEPTION 'Date de réception invalide';
  END IF;
  IF p_category IS NULL OR btrim(p_category) = '' THEN
    RAISE EXCEPTION 'Catégorie de produit manquante';
  END IF;

  SELECT * INTO v_doc
  FROM public.documents
  WHERE id::text = btrim(p_document) AND user_id = p_club
  FOR UPDATE;

  IF NOT FOUND OR v_doc.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Document introuvable';
  END IF;
  IF v_doc.status IN ('refuse', 'annule') THEN
    RAISE EXCEPTION 'Ce document est annulé';
  END IF;

  SELECT r.entry_id INTO v_existing_entry
  FROM public.document_receipts r
  WHERE r.club_id = p_club AND r.idempotency_key = btrim(p_key);

  v_source := CASE WHEN v_doc.type = 'quote' THEN 'membership' ELSE 'invoice' END;
  v_paid_status := CASE WHEN v_doc.type = 'quote' THEN 'accepte' ELSE 'paye' END;
  v_total := ROUND(COALESCE(v_doc.total_ttc, 0), 2);

  SELECT COALESCE(SUM(e.amount), 0) INTO v_historical
  FROM public.accounting_entries e
  WHERE e.club_id = p_club
    AND e.source_type = v_source
    AND e.source_id::text = v_doc.id::text
    AND e.event_type = 'payment_received'
    AND e.status IN ('pending', 'validated')
    AND NOT EXISTS (
      SELECT 1 FROM public.document_receipts r
      WHERE r.entry_id = e.id
    );

  SELECT COALESCE(SUM(amount), 0) INTO v_receipts
  FROM public.document_receipts
  WHERE club_id = p_club AND document_id = v_doc.id;

  v_already := ROUND(v_historical + v_receipts, 2);
  v_remaining := ROUND(GREATEST(v_total - v_already, 0), 2);

  IF v_existing_entry IS NOT NULL OR EXISTS (
    SELECT 1 FROM public.document_receipts
    WHERE club_id = p_club AND idempotency_key = btrim(p_key)
  ) THEN
    RETURN jsonb_build_object(
      'created', false,
      'already', true,
      'paid', v_remaining <= 0 OR v_doc.status = v_paid_status,
      'status', v_doc.status,
      'received', v_already,
      'remaining', v_remaining,
      'entry_id', v_existing_entry
    );
  END IF;

  IF v_remaining <= 0 THEN
    IF v_doc.status IS DISTINCT FROM v_paid_status THEN
      UPDATE public.documents
      SET status = v_paid_status,
          date_paiement = COALESCE(date_paiement, p_received_on),
          updated_at = NOW()
      WHERE id = v_doc.id AND user_id = p_club;
    END IF;
    RETURN jsonb_build_object(
      'created', false,
      'already', true,
      'paid', true,
      'status', v_paid_status,
      'received', v_already,
      'remaining', 0,
      'entry_id', NULL
    );
  END IF;

  v_amount := ROUND(COALESCE(p_amount, v_remaining), 2);
  IF v_amount <= 0 OR v_amount > v_remaining THEN
    RAISE EXCEPTION 'Montant supérieur au reste à encaisser';
  END IF;

  v_fee := ROUND(COALESCE(p_fee, 0), 2);
  IF v_fee < 0 OR v_fee >= v_amount THEN
    v_fee := 0;
  END IF;

  SELECT system_code INTO v_account_code
  FROM public.accounting_accounts
  WHERE id = p_account AND club_id = p_club AND is_active AND account_type = 'asset';

  IF v_account_code IS NULL
     OR NOT (
       v_account_code = 'cash'
       OR v_account_code = 'bank'
       OR v_account_code ~ '^bank_[0-9]+$'
       OR (COALESCE(p_allow_stripe, FALSE) AND v_account_code = 'stripe')
     ) THEN
    RAISE EXCEPTION 'Choisissez un compte de trésorerie : banque, poste ou caisse';
  END IF;

  SELECT a.id INTO v_category
  FROM public.accounting_mappings m
  JOIN public.accounting_accounts a ON a.id = m.account_id
  WHERE m.club_id = p_club AND m.source_kind = p_category AND a.is_active
  LIMIT 1;

  IF v_category IS NULL THEN
    SELECT id INTO v_category
    FROM public.accounting_accounts
    WHERE club_id = p_club AND system_code = p_category AND is_active
    LIMIT 1;
  END IF;

  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Compte de produit introuvable pour cette catégorie';
  END IF;

  v_fee_account := NULL;
  IF v_fee > 0 THEN
    SELECT id INTO v_fee_account
    FROM public.accounting_accounts
    WHERE club_id = p_club AND system_code = 'bank_fees' AND is_active
    LIMIT 1;
    IF v_fee_account IS NULL THEN
      RAISE EXCEPTION 'Compte de frais bancaires introuvable';
    END IF;
  END IF;

  SELECT id INTO v_period
  FROM public.accounting_periods
  WHERE club_id = p_club
    AND status = 'open'
    AND p_received_on BETWEEN starts_on AND ends_on
  LIMIT 1;

  IF v_period IS NULL THEN
    RAISE EXCEPTION 'Aucun exercice ouvert à cette date';
  END IF;

  SELECT NULLIF(btrim(COALESCE(c.nom, '')), '') INTO v_party
  FROM public.clients c
  WHERE c.id = v_doc.client_id;

  v_description := COALESCE(
    NULLIF(btrim(v_doc.title), ''),
    NULLIF(btrim(v_doc.numero), ''),
    'Encaissement'
  );

  INSERT INTO public.document_receipts (
    club_id, document_id, amount, received_on, account_id, idempotency_key, created_by
  ) VALUES (
    p_club, v_doc.id, v_amount, p_received_on, p_account, btrim(p_key), p_user
  )
  RETURNING id INTO v_receipt;

  IF v_fee > 0 THEN
    v_lines := jsonb_build_array(
      jsonb_build_object('account_id', p_account, 'debit', ROUND(v_amount - v_fee, 2), 'credit', 0),
      jsonb_build_object('account_id', v_fee_account, 'debit', v_fee, 'credit', 0),
      jsonb_build_object('account_id', v_category, 'debit', 0, 'credit', v_amount)
    );
  ELSE
    v_lines := jsonb_build_array(
      jsonb_build_object('account_id', p_account, 'debit', v_amount, 'credit', 0),
      jsonb_build_object('account_id', v_category, 'debit', 0, 'credit', v_amount)
    );
  END IF;

  v_posted := public.accounting_post_entry(jsonb_build_object(
    'club_id', p_club,
    'period_id', v_period,
    'entry_date', p_received_on,
    'description', v_description,
    'amount', v_amount,
    'direction', 'in',
    'source_type', v_source,
    'source_id', CASE
      WHEN v_doc.id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN v_doc.id::text
      ELSE NULL
    END,
    'event_type', 'payment_received',
    'idempotency_key', 'receipt:' || v_receipt::TEXT,
    'status', 'validated',
    'counter_account_id', p_account,
    'category_account_id', v_category,
    'party_name', v_party,
    'created_by', p_user,
    'audit_action', 'receipt',
    'lines', v_lines
  ));

  v_entry := (v_posted->>'id')::UUID;
  UPDATE public.document_receipts
  SET entry_id = v_entry
  WHERE id = v_receipt;

  v_received := ROUND(v_already + v_amount, 2);
  v_remaining := ROUND(GREATEST(v_total - v_received, 0), 2);

  IF v_remaining <= 0 THEN
    UPDATE public.documents
    SET status = v_paid_status,
        date_paiement = p_received_on,
        updated_at = NOW()
    WHERE id = v_doc.id AND user_id = p_club;
  END IF;

  UPDATE public.accounting_inbox
  SET status = 'skipped', updated_at = NOW()
  WHERE club_id = p_club
    AND source_id::text = v_doc.id::text
    AND source_type = v_source
    AND status IN ('pending', 'awaiting_account', 'awaiting_category', 'awaiting_details');

  RETURN jsonb_build_object(
    'created', true,
    'already', false,
    'paid', v_remaining <= 0,
    'status', CASE WHEN v_remaining <= 0 THEN v_paid_status ELSE v_doc.status END,
    'received', v_received,
    'remaining', v_remaining,
    'entry_id', v_entry
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN, NUMERIC
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN, NUMERIC
) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN, NUMERIC
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN, NUMERIC
) TO service_role;

CREATE OR REPLACE FUNCTION public.accounting_resolve_payout_bank(p_club UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bank UUID;
  v_count INTEGER;
BEGIN
  SELECT stripe_payout_account_id INTO v_bank
  FROM public.accounting_settings
  WHERE club_id = p_club;

  IF v_bank IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.accounting_accounts a
    WHERE a.id = v_bank
      AND a.club_id = p_club
      AND a.is_active
      AND (a.system_code = 'bank' OR a.system_code ~ '^bank_[0-9]+$')
  ) THEN
    v_bank := NULL;
  END IF;

  IF v_bank IS NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.accounting_accounts a
    WHERE a.club_id = p_club
      AND a.is_active
      AND (a.system_code = 'bank' OR a.system_code ~ '^bank_[0-9]+$');
    IF v_count = 1 THEN
      SELECT a.id INTO v_bank
      FROM public.accounting_accounts a
      WHERE a.club_id = p_club
        AND a.is_active
        AND (a.system_code = 'bank' OR a.system_code ~ '^bank_[0-9]+$');
    END IF;
  END IF;

  RETURN v_bank;
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_resolve_payout_bank(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accounting_resolve_payout_bank(UUID) TO service_role;

-- Versement Stripe vers la banque : transfert de trésorerie, aucun produit.
CREATE OR REPLACE FUNCTION public.accounting_record_stripe_payout(
  p_club UUID,
  p_payout TEXT,
  p_amount NUMERIC,
  p_paid_on DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(14, 2);
  v_ready BOOLEAN;
  v_bank UUID;
  v_stripe UUID;
  v_period UUID;
  v_row public.accounting_stripe_payouts%ROWTYPE;
  v_posted JSONB;
  v_entry UUID;
  v_status TEXT;
BEGIN
  IF p_club IS NULL OR p_payout IS NULL OR btrim(p_payout) = '' OR p_paid_on IS NULL THEN
    RAISE EXCEPTION 'Versement incomplet';
  END IF;
  v_amount := ROUND(COALESCE(p_amount, 0), 2);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'Versement incomplet';
  END IF;

  PERFORM 1 FROM public.accounting_settings WHERE club_id = p_club FOR UPDATE;

  SELECT * INTO v_row
  FROM public.accounting_stripe_payouts
  WHERE club_id = p_club AND payout_id = btrim(p_payout)
  FOR UPDATE;

  IF FOUND AND v_row.status = 'posted' AND v_row.entry_id IS NOT NULL THEN
    RETURN jsonb_build_object('created', false, 'already', true, 'status', 'posted', 'entry_id', v_row.entry_id);
  END IF;

  SELECT onboarding_completed_at IS NOT NULL INTO v_ready
  FROM public.accounting_settings
  WHERE club_id = p_club;

  v_bank := public.accounting_resolve_payout_bank(p_club);

  IF NOT COALESCE(v_ready, FALSE) OR v_bank IS NULL THEN
    IF v_row.id IS NULL THEN
      INSERT INTO public.accounting_stripe_payouts (club_id, payout_id, amount, paid_on, status)
      VALUES (p_club, btrim(p_payout), v_amount, p_paid_on, 'pending_account');
    END IF;
    RETURN jsonb_build_object('created', false, 'already', false, 'status', 'pending_account', 'entry_id', NULL);
  END IF;

  SELECT id INTO v_stripe
  FROM public.accounting_accounts
  WHERE club_id = p_club AND system_code = 'stripe' AND is_active
  LIMIT 1;

  IF v_stripe IS NULL OR v_stripe = v_bank THEN
    IF v_row.id IS NULL THEN
      INSERT INTO public.accounting_stripe_payouts (club_id, payout_id, amount, paid_on, status)
      VALUES (p_club, btrim(p_payout), v_amount, p_paid_on, 'pending_account');
    END IF;
    RETURN jsonb_build_object('created', false, 'already', false, 'status', 'pending_account', 'entry_id', NULL);
  END IF;

  SELECT id INTO v_period
  FROM public.accounting_periods
  WHERE club_id = p_club
    AND status = 'open'
    AND p_paid_on BETWEEN starts_on AND ends_on
  LIMIT 1;

  IF v_period IS NULL THEN
    IF v_row.id IS NULL THEN
      INSERT INTO public.accounting_stripe_payouts (club_id, payout_id, amount, paid_on, bank_account_id, status)
      VALUES (p_club, btrim(p_payout), v_amount, p_paid_on, v_bank, 'pending_account');
    END IF;
    RETURN jsonb_build_object('created', false, 'already', false, 'status', 'pending_account', 'entry_id', NULL);
  END IF;

  v_posted := public.accounting_post_entry(jsonb_build_object(
    'club_id', p_club,
    'period_id', v_period,
    'entry_date', p_paid_on,
    'description', 'Versement Stripe',
    'amount', v_amount,
    'direction', 'transfer',
    'source_type', 'stripe_payout',
    'event_type', 'transfer',
    'idempotency_key', 'stripe_payout:' || btrim(p_payout),
    'status', 'validated',
    'counter_account_id', v_stripe,
    'category_account_id', v_bank,
    'audit_action', 'stripe_payout',
    'lines', jsonb_build_array(
      jsonb_build_object('account_id', v_bank, 'debit', v_amount, 'credit', 0),
      jsonb_build_object('account_id', v_stripe, 'debit', 0, 'credit', v_amount)
    )
  ));

  v_entry := (v_posted->>'id')::uuid;
  SELECT status INTO v_status FROM public.accounting_entries WHERE id = v_entry;
  IF v_status IS DISTINCT FROM 'validated' THEN
    RAISE EXCEPTION 'Le versement Stripe n''a pas pu être enregistré';
  END IF;

  IF v_row.id IS NULL THEN
    INSERT INTO public.accounting_stripe_payouts (
      club_id, payout_id, amount, paid_on, bank_account_id, entry_id, status
    ) VALUES (
      p_club, btrim(p_payout), v_amount, p_paid_on, v_bank, v_entry, 'posted'
    );
  ELSE
    UPDATE public.accounting_stripe_payouts
    SET amount = v_amount,
        paid_on = p_paid_on,
        bank_account_id = v_bank,
        entry_id = v_entry,
        status = 'posted'
    WHERE id = v_row.id;
  END IF;

  RETURN jsonb_build_object('created', true, 'already', false, 'status', 'posted', 'entry_id', v_entry);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_record_stripe_payout(UUID, TEXT, NUMERIC, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_record_stripe_payout(UUID, TEXT, NUMERIC, DATE) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_record_stripe_payout(UUID, TEXT, NUMERIC, DATE) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_record_stripe_payout(UUID, TEXT, NUMERIC, DATE) TO service_role;

CREATE OR REPLACE FUNCTION public.accounting_post_pending_payouts(p_club UUID, p_user UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.accounting_stripe_payouts%ROWTYPE;
  v_posted INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT *
    FROM public.accounting_stripe_payouts
    WHERE club_id = p_club AND status = 'pending_account'
    ORDER BY paid_on, created_at
  LOOP
    PERFORM public.accounting_record_stripe_payout(p_club, v_row.payout_id, v_row.amount, v_row.paid_on);
    IF EXISTS (
      SELECT 1 FROM public.accounting_stripe_payouts
      WHERE id = v_row.id AND status = 'posted'
    ) THEN
      v_posted := v_posted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('posted', v_posted);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_post_pending_payouts(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accounting_post_pending_payouts(UUID, UUID) TO service_role;

-- Une vente de soutien se termine avec les sommes confirmées.
-- Une seule écriture, même si l'argent arrive sur plusieurs comptes.
-- Un second encaissement du même revenu ne repasse pas le montant.
CREATE OR REPLACE FUNCTION public.accounting_finish_support_sale(
  p_club UUID,
  p_sale UUID,
  p_user UUID,
  p_received_on DATE,
  p_amount NUMERIC,
  p_category UUID,
  p_name TEXT,
  p_description TEXT,
  p_splits JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale public.support_sales%ROWTYPE;
  v_amount NUMERIC(14, 2);
  v_ready BOOLEAN;
  v_revenue UUID;
  v_period UUID;
  v_split JSONB;
  v_account UUID;
  v_code TEXT;
  v_part NUMERIC(14, 2);
  v_sum NUMERIC(14, 2) := 0;
  v_lines JSONB := '[]'::jsonb;
  v_first UUID;
  v_category_type TEXT;
  v_historical NUMERIC(14, 2);
  v_paid NUMERIC(14, 2);
  v_posted JSONB;
  v_entry UUID;
  v_created BOOLEAN := FALSE;
  v_key TEXT;
  v_existing_status TEXT;
BEGIN
  IF p_club IS NULL OR p_sale IS NULL OR p_received_on IS NULL THEN
    RAISE EXCEPTION 'Finalisation incomplète';
  END IF;

  SELECT * INTO v_sale
  FROM public.support_sales
  WHERE id = p_sale AND club_id = p_club AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vente introuvable';
  END IF;

  v_amount := ROUND(COALESCE(p_amount, 0), 2);
  IF v_amount < 0 THEN
    RAISE EXCEPTION 'Montant confirmé invalide';
  END IF;

  v_revenue := v_sale.club_revenue_id;
  IF v_revenue IS NULL THEN
    SELECT id INTO v_revenue
    FROM public.club_revenues
    WHERE user_id = p_club
      AND source_type = 'support_sale'
      AND source_id = p_sale
      AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  -- Une vente déjà terminée n'est pas recomptabilisée.
  IF v_sale.status = 'ended' THEN
    RETURN jsonb_build_object('created', false, 'already', true, 'revenue_id', v_revenue, 'entry_id', NULL);
  END IF;

  SELECT onboarding_completed_at IS NOT NULL INTO v_ready
  FROM public.accounting_settings
  WHERE club_id = p_club;

  IF v_amount = 0 THEN
    UPDATE public.support_sales
    SET status = 'ended', updated_by = p_user, club_revenue_id = v_revenue
    WHERE id = p_sale AND club_id = p_club;
    RETURN jsonb_build_object('created', false, 'already', false, 'revenue_id', v_revenue, 'entry_id', NULL);
  END IF;

  IF COALESCE(v_ready, FALSE) THEN
    IF p_category IS NULL THEN
      RAISE EXCEPTION 'Choisissez une catégorie comptable';
    END IF;

    SELECT account_type INTO v_category_type
    FROM public.accounting_accounts
    WHERE id = p_category AND club_id = p_club AND is_active;

    IF v_category_type IS DISTINCT FROM 'revenue' THEN
      RAISE EXCEPTION 'Choisissez une catégorie comptable';
    END IF;

    FOR v_split IN SELECT value FROM jsonb_array_elements(COALESCE(p_splits, '[]'::jsonb))
    LOOP
      v_part := ROUND(COALESCE((v_split->>'amount')::numeric, 0), 2);
      IF v_part <= 0 THEN
        CONTINUE;
      END IF;
      v_account := (v_split->>'account_id')::uuid;
      SELECT system_code INTO v_code
      FROM public.accounting_accounts
      WHERE id = v_account AND club_id = p_club AND is_active AND account_type = 'asset';
      IF v_code IS NULL OR NOT (
        v_code IN ('cash', 'bank', 'stripe') OR v_code ~ '^bank_[0-9]+$'
      ) THEN
        RAISE EXCEPTION 'Choisissez un compte de trésorerie : banque, poste ou caisse';
      END IF;
      IF v_first IS NULL THEN
        v_first := v_account;
      END IF;
      v_sum := ROUND(v_sum + v_part, 2);
      v_lines := v_lines || jsonb_build_array(
        jsonb_build_object('account_id', v_account, 'debit', v_part, 'credit', 0)
      );
    END LOOP;

    IF v_sum IS DISTINCT FROM v_amount OR v_first IS NULL THEN
      RAISE EXCEPTION 'Les montants des comptes doivent égaler la somme encaissée';
    END IF;

    SELECT id INTO v_period
    FROM public.accounting_periods
    WHERE club_id = p_club
      AND status = 'open'
      AND p_received_on BETWEEN starts_on AND ends_on
    LIMIT 1;

    IF v_period IS NULL THEN
      RAISE EXCEPTION 'Aucun exercice ouvert à cette date';
    END IF;

    v_lines := v_lines || jsonb_build_array(
      jsonb_build_object('account_id', p_category, 'debit', 0, 'credit', v_amount)
    );
  END IF;

  IF v_revenue IS NULL THEN
    INSERT INTO public.club_revenues (
      user_id, name, amount, revenue_date, description,
      source_type, source_id, created_by, updated_by, status
    ) VALUES (
      p_club,
      COALESCE(NULLIF(btrim(p_name), ''), 'Vente de soutien'),
      v_amount,
      p_received_on,
      NULLIF(btrim(p_description), ''),
      'support_sale',
      p_sale,
      p_user,
      p_user,
      'prevu'
    )
    RETURNING id INTO v_revenue;
  ELSE
    UPDATE public.club_revenues
    SET amount = v_amount,
        revenue_date = p_received_on,
        name = COALESCE(NULLIF(btrim(p_name), ''), name),
        description = COALESCE(NULLIF(btrim(p_description), ''), description),
        updated_by = p_user
    WHERE id = v_revenue AND user_id = p_club;
  END IF;

  IF COALESCE(v_ready, FALSE) THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM public.finance_payments
    WHERE club_id = p_club AND source_type = 'club_revenue' AND source_id = v_revenue;

    SELECT COALESCE(SUM(e.amount), 0) INTO v_historical
    FROM public.accounting_entries e
    WHERE e.club_id = p_club
      AND e.source_id = v_revenue
      AND e.event_type = 'payment_received'
      AND e.status IN ('pending', 'validated')
      AND NOT EXISTS (
        SELECT 1 FROM public.finance_payments fp WHERE fp.entry_id = e.id
      );

    IF ROUND(v_paid + v_historical, 2) <= 0 THEN
      v_key := 'support_sale:' || p_sale::text;
      SELECT status INTO v_existing_status
      FROM public.accounting_entries
      WHERE club_id = p_club AND idempotency_key = v_key;
      IF v_existing_status = 'voided' THEN
        v_key := v_key || ':repost';
      END IF;

      v_posted := public.accounting_post_entry(jsonb_build_object(
        'club_id', p_club,
        'period_id', v_period,
        'entry_date', p_received_on,
        'description', COALESCE(NULLIF(btrim(p_name), ''), 'Vente de soutien'),
        'amount', v_amount,
        'direction', 'in',
        'source_type', 'club_revenue',
        'source_id', v_revenue,
        'event_type', 'payment_received',
        'idempotency_key', v_key,
        'status', 'validated',
        'counter_account_id', v_first,
        'category_account_id', p_category,
        'created_by', p_user,
        'audit_action', 'support_sale',
        'lines', v_lines
      ));
      v_entry := (v_posted->>'id')::uuid;
      SELECT status INTO v_existing_status
      FROM public.accounting_entries
      WHERE id = v_entry AND club_id = p_club;
      IF v_existing_status IS DISTINCT FROM 'validated' THEN
        RAISE EXCEPTION 'L''écriture de la vente n''a pas pu être enregistrée';
      END IF;
      v_created := TRUE;

      INSERT INTO public.finance_payments (
        club_id, source_type, source_id, amount, paid_on, account_id,
        category_account_id, entry_id, idempotency_key, created_by
      ) VALUES (
        p_club, 'club_revenue', v_revenue, v_amount, p_received_on, v_first,
        p_category, v_entry, v_key, p_user
      );
    END IF;
  END IF;

  PERFORM set_config('obillz.cash_payment', 'on', true);
  UPDATE public.club_revenues
  SET status = 'encaisse',
      received_on = p_received_on,
      category_account_id = COALESCE(p_category, category_account_id),
      updated_at = NOW()
  WHERE id = v_revenue AND user_id = p_club;

  UPDATE public.accounting_inbox
  SET status = 'skipped', updated_at = NOW()
  WHERE club_id = p_club
    AND source_id = v_revenue
    AND source_type = 'club_revenue'
    AND status IN ('pending', 'awaiting_account', 'awaiting_category', 'awaiting_details');

  UPDATE public.support_sales
  SET status = 'ended',
      club_revenue_id = v_revenue,
      updated_by = p_user
  WHERE id = p_sale AND club_id = p_club;

  RETURN jsonb_build_object(
    'created', v_created,
    'already', false,
    'revenue_id', v_revenue,
    'entry_id', v_entry
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_finish_support_sale(
  UUID, UUID, UUID, DATE, NUMERIC, UUID, TEXT, TEXT, JSONB
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_finish_support_sale(
  UUID, UUID, UUID, DATE, NUMERIC, UUID, TEXT, TEXT, JSONB
) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_finish_support_sale(
  UUID, UUID, UUID, DATE, NUMERIC, UUID, TEXT, TEXT, JSONB
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_finish_support_sale(
  UUID, UUID, UUID, DATE, NUMERIC, UUID, TEXT, TEXT, JSONB
) TO service_role;
