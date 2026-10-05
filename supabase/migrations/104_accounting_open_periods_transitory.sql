-- Plusieurs exercices ouverts, et encaissement transitoire d'une facture.
-- N'efface aucune écriture. Ne recopie aucun solde d'ouverture.
-- Dépend des migrations 099 à 103. À appliquer manuellement, pas depuis l'application.

CREATE OR REPLACE FUNCTION public.accounting_periods_reject_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.accounting_periods period
    WHERE period.club_id = NEW.club_id
      AND period.id IS DISTINCT FROM NEW.id
      AND period.starts_on <= NEW.ends_on
      AND NEW.starts_on <= period.ends_on
  ) THEN
    RAISE EXCEPTION 'Cette période chevauche un exercice existant';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_periods_no_overlap ON public.accounting_periods;
CREATE TRIGGER accounting_periods_no_overlap
  BEFORE INSERT OR UPDATE OF starts_on, ends_on, club_id
  ON public.accounting_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_periods_reject_overlap();

REVOKE ALL ON FUNCTION public.accounting_periods_reject_overlap() FROM PUBLIC;

-- Ouvre seulement la période suivante. Aucune écriture d'ouverture n'est insérée.
CREATE OR REPLACE FUNCTION public.accounting_open_following_period(
  p_club UUID,
  p_anchor UUID,
  p_user UUID,
  p_start DATE,
  p_end DATE,
  p_label TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_club IS NULL OR p_anchor IS NULL OR p_start IS NULL OR p_end IS NULL OR p_end < p_start THEN
    RAISE EXCEPTION 'Exercice suivant invalide';
  END IF;

  PERFORM 1
  FROM public.accounting_settings
  WHERE club_id = p_club
  FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE id = p_anchor AND club_id = p_club
  ) THEN
    RAISE EXCEPTION 'Exercice introuvable';
  END IF;

  SELECT id INTO v_id
  FROM public.accounting_periods
  WHERE club_id = p_club AND starts_on = p_start
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('created', false, 'period_id', v_id);
  END IF;

  INSERT INTO public.accounting_periods (club_id, label, starts_on, ends_on, status)
  VALUES (
    p_club,
    COALESCE(NULLIF(btrim(p_label), ''), 'Exercice suivant'),
    p_start,
    p_end,
    'open'
  )
  RETURNING id INTO v_id;

  INSERT INTO public.accounting_audit_log (club_id, user_id, action, new_value)
  VALUES (
    p_club,
    p_user,
    'open_period',
    jsonb_build_object('periodId', v_id, 'anchorId', p_anchor, 'startsOn', p_start, 'endsOn', p_end)
  );

  RETURN jsonb_build_object('created', true, 'period_id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_open_following_period(UUID, UUID, UUID, DATE, DATE, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_open_following_period(UUID, UUID, UUID, DATE, DATE, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_open_following_period(UUID, UUID, UUID, DATE, DATE, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_open_following_period(UUID, UUID, UUID, DATE, DATE, TEXT) TO service_role;

ALTER TABLE public.document_receipts
  ADD COLUMN IF NOT EXISTS bridge_mode TEXT,
  ADD COLUMN IF NOT EXISTS accrual_entry_id UUID,
  ADD COLUMN IF NOT EXISTS release_entry_id UUID,
  ADD COLUMN IF NOT EXISTS product_period_id UUID,
  ADD COLUMN IF NOT EXISTS recognition_on DATE,
  ADD COLUMN IF NOT EXISTS accrual_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.document_receipts DROP CONSTRAINT IF EXISTS document_receipts_bridge_mode_check;
ALTER TABLE public.document_receipts
  ADD CONSTRAINT document_receipts_bridge_mode_check
  CHECK (bridge_mode IS NULL OR bridge_mode IN ('prior', 'future', 'settle'));

ALTER TABLE public.accounting_entries
  ADD COLUMN IF NOT EXISTS bridge_receipt_id UUID;

-- Les messages reprennent lib/accounting/transitory.ts.
CREATE OR REPLACE FUNCTION public.accounting_record_transitory_receipt(
  p_club UUID,
  p_document TEXT,
  p_user UUID,
  p_received_on DATE,
  p_account UUID,
  p_amount NUMERIC,
  p_key TEXT,
  p_category TEXT,
  p_product_period UUID,
  p_recognition DATE
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
  v_regularized NUMERIC(14, 2);
  v_settled NUMERIC(14, 2);
  v_released NUMERIC(14, 2);
  v_open NUMERIC(14, 2);
  v_new_accrual NUMERIC(14, 2);
  v_account_code TEXT;
  v_category UUID;
  v_pay_period public.accounting_periods%ROWTYPE;
  v_product public.accounting_periods%ROWTYPE;
  v_closed public.accounting_periods%ROWTYPE;
  v_kind TEXT;
  v_clearing UUID;
  v_clearing_code TEXT;
  v_party TEXT;
  v_description TEXT;
  v_receipt UUID;
  v_existing_entry UUID;
  v_existing_accrual UUID;
  v_posted JSONB;
  v_cash UUID;
  v_accrual UUID;
  v_created_accrual UUID;
  v_release UUID;
  v_product_id UUID;
  v_source_id TEXT;
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

  IF v_doc.type NOT IN ('invoice', 'quote') THEN
    RAISE EXCEPTION 'L''option Transitoire concerne une facture ou une cotisation';
  END IF;
  IF v_doc.status IN ('refuse', 'annule') THEN
    RAISE EXCEPTION 'Ce document est annulé';
  END IF;
  IF ROUND(COALESCE(v_doc.total_tva, 0), 2) <> 0
     OR (
       ROUND(COALESCE(v_doc.total_ht, 0), 2) > 0
       AND ROUND(COALESCE(v_doc.total_ttc, 0), 2) > ROUND(COALESCE(v_doc.total_ht, 0), 2)
     ) THEN
    RAISE EXCEPTION 'Cette facture comporte de la TVA. L''option Transitoire ne répartit pas la TVA entre les exercices. Enregistrez un encaissement normal, qui conserve le traitement actuel.';
  END IF;

  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'Cette facture est déjà soldée';
  END IF;

  v_amount := ROUND(COALESCE(p_amount, v_remaining), 2);
  IF v_amount <= 0 OR v_amount > v_remaining THEN
    RAISE EXCEPTION 'Montant supérieur au reste à encaisser';
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

  SELECT * INTO v_closed
  FROM public.accounting_periods
  WHERE club_id = p_club
    AND status = 'closed'
    AND p_received_on BETWEEN starts_on AND ends_on
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Cette date de paiement appartient à un exercice clôturé. Elle n''a pas été modifiée et l''exercice n''a pas été rouvert.';
  END IF;

  SELECT * INTO v_pay_period
  FROM public.accounting_periods
  WHERE club_id = p_club
    AND status = 'open'
    AND p_received_on BETWEEN starts_on AND ends_on
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun exercice ouvert à cette date';
  END IF;

  SELECT COALESCE(SUM(e.amount), 0) INTO v_regularized
  FROM public.accounting_entries e
  WHERE e.club_id = p_club
    AND e.event_type = 'accrual_income'
    AND e.status = 'validated'
    AND (
      e.source_id::text = v_doc.id::text
      OR e.bridge_receipt_id IN (
        SELECT r.id FROM public.document_receipts r
        WHERE r.club_id = p_club AND r.document_id = v_doc.id
      )
    );

  SELECT COALESCE(SUM(r.amount), 0) INTO v_settled
  FROM public.document_receipts r
  WHERE r.club_id = p_club
    AND r.document_id = v_doc.id
    AND r.bridge_mode IN ('prior', 'settle')
    AND r.entry_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.accounting_entries e
      WHERE e.id = r.entry_id AND e.status = 'validated'
    );

  v_open := ROUND(v_regularized - v_settled, 2);
  IF v_open < 0 THEN
    RAISE EXCEPTION 'Le solde de la créance est incohérent';
  END IF;

  SELECT e.id INTO v_existing_accrual
  FROM public.accounting_entries e
  WHERE e.club_id = p_club
    AND e.event_type = 'accrual_income'
    AND e.status = 'validated'
    AND (
      e.source_id::text = v_doc.id::text
      OR e.bridge_receipt_id IN (
        SELECT r.id FROM public.document_receipts r
        WHERE r.club_id = p_club AND r.document_id = v_doc.id
      )
    )
  ORDER BY e.entry_date, e.entry_number
  LIMIT 1;

  v_new_accrual := 0;
  v_accrual := NULL;
  v_created_accrual := NULL;
  v_release := NULL;
  v_product_id := NULL;

  IF v_open > 0 AND v_amount <= v_open THEN
    v_kind := 'settle';
  ELSE
    IF p_product_period IS NULL THEN
      RAISE EXCEPTION 'Choisissez l''exercice du produit';
    END IF;

    SELECT * INTO v_product
    FROM public.accounting_periods
    WHERE id = p_product_period AND club_id = p_club;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Choisissez l''exercice du produit';
    END IF;
    v_product_id := v_product.id;
    IF v_product.id = v_pay_period.id THEN
      RAISE EXCEPTION 'Le produit et le paiement sont dans le même exercice. Laissez le parcours normal.';
    END IF;

    IF v_product.starts_on > v_pay_period.ends_on THEN
      v_kind := 'future';
    ELSIF v_product.ends_on < v_pay_period.starts_on THEN
      v_kind := 'prior';
    ELSE
      RAISE EXCEPTION 'Les exercices se chevauchent';
    END IF;

    IF v_kind = 'future' THEN
      IF v_product.status IS DISTINCT FROM 'open' THEN
        RAISE EXCEPTION 'Cet exercice est clôturé. Il ne peut plus recevoir de nouvelle affectation.';
      END IF;
      IF p_recognition IS NULL OR p_recognition < v_product.starts_on OR p_recognition > v_product.ends_on THEN
        RAISE EXCEPTION 'La date de rattachement doit être comprise dans l''exercice du produit.';
      END IF;

      SELECT COALESCE(SUM(e.amount), 0) INTO v_released
      FROM public.accounting_entries e
      WHERE e.club_id = p_club
        AND e.event_type = 'deferred_release'
        AND e.status = 'validated'
        AND (
          e.source_id::text = v_doc.id::text
          OR e.bridge_receipt_id IN (
            SELECT r.id FROM public.document_receipts r
            WHERE r.club_id = p_club AND r.document_id = v_doc.id
          )
        );

      IF ROUND(v_released + v_amount, 2) > v_total THEN
        RAISE EXCEPTION 'Ce produit a déjà été rattaché pour un montant qui couvre la facture.';
      END IF;
    ELSE
      v_new_accrual := ROUND(GREATEST(v_amount - v_open, 0), 2);
      IF ROUND(v_regularized + v_new_accrual, 2) > v_total THEN
        RAISE EXCEPTION 'Cette régularisation dépasse le montant de la facture';
      END IF;
      IF ROUND(v_open + v_new_accrual, 2) < v_amount THEN
        RAISE EXCEPTION 'Le règlement dépasse le solde de la créance';
      END IF;
      IF v_new_accrual > 0 AND v_product.status IS DISTINCT FROM 'open' THEN
        IF v_open > 0 THEN
          RAISE EXCEPTION 'L''exercice du produit est clôturé. Seul le solde déjà régularisé de CHF % peut encore être encaissé, sans nouvelle régularisation.', to_char(v_open, 'FM999999990.00');
        END IF;
        RAISE EXCEPTION 'Cet exercice est clôturé. Il ne peut plus recevoir de nouvelle affectation.';
      END IF;
      IF v_new_accrual > 0 AND (p_recognition IS NULL OR p_recognition < v_product.starts_on OR p_recognition > v_product.ends_on) THEN
        RAISE EXCEPTION 'La date de rattachement doit être comprise dans l''exercice du produit.';
      END IF;
    END IF;
  END IF;

  IF v_kind = 'future' THEN
    v_clearing_code := 'accrued';
  ELSIF v_doc.status IN ('brouillon', 'draft') THEN
    v_clearing_code := 'prepaid';
  ELSE
    v_clearing_code := 'debtors';
  END IF;

  v_clearing := NULL;
  IF v_kind IN ('prior', 'settle') AND v_existing_accrual IS NOT NULL THEN
    SELECT l.account_id INTO v_clearing
    FROM public.accounting_entry_lines l
    JOIN public.accounting_accounts a ON a.id = l.account_id
    WHERE l.entry_id = v_existing_accrual
      AND l.club_id = p_club
      AND a.club_id = p_club
      AND a.is_active
      AND a.system_code IN ('debtors', 'prepaid')
      AND l.debit > 0
    LIMIT 1;
  END IF;

  IF v_clearing IS NULL THEN
    SELECT id INTO v_clearing
    FROM public.accounting_accounts
    WHERE club_id = p_club AND system_code = v_clearing_code AND is_active
    LIMIT 1;
  END IF;

  IF v_clearing IS NULL THEN
    IF v_clearing_code = 'debtors' THEN
      RAISE EXCEPTION 'Le compte Débiteurs est introuvable dans le plan';
    ELSIF v_clearing_code = 'prepaid' THEN
      RAISE EXCEPTION 'Le compte d''actifs transitoires est introuvable dans le plan';
    ELSE
      RAISE EXCEPTION 'Le compte de passifs transitoires est introuvable dans le plan';
    END IF;
  END IF;

  SELECT NULLIF(btrim(COALESCE(c.nom, '')), '') INTO v_party
  FROM public.clients c
  WHERE c.id = v_doc.client_id;

  v_description := COALESCE(
    NULLIF(btrim(v_doc.title), ''),
    NULLIF(btrim(v_doc.numero), ''),
    'Encaissement'
  );

  v_source_id := CASE
    WHEN v_doc.id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN v_doc.id::text
    ELSE NULL
  END;

  INSERT INTO public.document_receipts (
    club_id, document_id, amount, received_on, account_id, idempotency_key, created_by,
    bridge_mode, product_period_id, recognition_on, accrual_amount
  ) VALUES (
    p_club, v_doc.id, v_amount, p_received_on, p_account, btrim(p_key), p_user,
    v_kind,
    CASE WHEN v_kind = 'settle' THEN NULL ELSE v_product_id END,
    CASE WHEN v_kind = 'settle' THEN NULL ELSE p_recognition END,
    CASE WHEN v_kind = 'prior' THEN v_new_accrual ELSE 0 END
  )
  RETURNING id INTO v_receipt;

  IF v_kind = 'future' THEN
    v_posted := public.accounting_post_entry(jsonb_build_object(
      'club_id', p_club,
      'period_id', v_pay_period.id,
      'entry_date', p_received_on,
      'description', v_description,
      'amount', v_amount,
      'direction', 'in',
      'source_type', v_source,
      'source_id', v_source_id,
      'event_type', 'payment_received',
      'idempotency_key', 'receipt:' || v_receipt::TEXT,
      'status', 'validated',
      'counter_account_id', p_account,
      'category_account_id', v_clearing,
      'party_name', v_party,
      'created_by', p_user,
      'audit_action', 'receipt',
      'lines', jsonb_build_array(
        jsonb_build_object('account_id', p_account, 'debit', v_amount, 'credit', 0),
        jsonb_build_object('account_id', v_clearing, 'debit', 0, 'credit', v_amount)
      )
    ));
    v_cash := (v_posted->>'id')::UUID;

    v_posted := public.accounting_post_entry(jsonb_build_object(
      'club_id', p_club,
      'period_id', v_product.id,
      'entry_date', p_recognition,
      'description', 'Rattachement du produit — ' || v_description,
      'amount', v_amount,
      'direction', 'in',
      'source_type', v_source,
      'source_id', v_source_id,
      'event_type', 'deferred_release',
      'idempotency_key', 'receipt:' || v_receipt::TEXT || ':release',
      'status', 'validated',
      'counter_account_id', v_clearing,
      'category_account_id', v_category,
      'party_name', v_party,
      'created_by', p_user,
      'audit_action', 'receipt_release',
      'lines', jsonb_build_array(
        jsonb_build_object('account_id', v_clearing, 'debit', v_amount, 'credit', 0),
        jsonb_build_object('account_id', v_category, 'debit', 0, 'credit', v_amount)
      )
    ));
    v_release := (v_posted->>'id')::UUID;
  ELSE
    IF v_kind = 'prior' AND v_new_accrual > 0 THEN
      v_posted := public.accounting_post_entry(jsonb_build_object(
        'club_id', p_club,
        'period_id', v_product.id,
        'entry_date', p_recognition,
        'description', 'Produit à recevoir — ' || v_description,
        'amount', v_new_accrual,
        'direction', 'in',
        'source_type', v_source,
        'source_id', v_source_id,
        'event_type', 'accrual_income',
        'idempotency_key', 'receipt:' || v_receipt::TEXT || ':accrual',
        'status', 'validated',
        'counter_account_id', v_clearing,
        'category_account_id', v_category,
        'party_name', v_party,
        'created_by', p_user,
        'audit_action', 'receipt_accrual',
        'lines', jsonb_build_array(
          jsonb_build_object('account_id', v_clearing, 'debit', v_new_accrual, 'credit', 0),
          jsonb_build_object('account_id', v_category, 'debit', 0, 'credit', v_new_accrual)
        )
      ));
      v_created_accrual := (v_posted->>'id')::UUID;
      v_accrual := v_created_accrual;
    END IF;

    v_posted := public.accounting_post_entry(jsonb_build_object(
      'club_id', p_club,
      'period_id', v_pay_period.id,
      'entry_date', p_received_on,
      'description', v_description,
      'amount', v_amount,
      'direction', 'in',
      'source_type', v_source,
      'source_id', v_source_id,
      'event_type', 'payment_received',
      'idempotency_key', 'receipt:' || v_receipt::TEXT,
      'status', 'validated',
      'counter_account_id', p_account,
      'category_account_id', v_clearing,
      'party_name', v_party,
      'created_by', p_user,
      'audit_action', 'receipt',
      'lines', jsonb_build_array(
        jsonb_build_object('account_id', p_account, 'debit', v_amount, 'credit', 0),
        jsonb_build_object('account_id', v_clearing, 'debit', 0, 'credit', v_amount)
      )
    ));
    v_cash := (v_posted->>'id')::UUID;
    IF v_accrual IS NULL THEN
      v_accrual := v_existing_accrual;
    END IF;
  END IF;

  UPDATE public.accounting_entries
  SET bridge_receipt_id = v_receipt
  WHERE club_id = p_club
    AND id = ANY (ARRAY[v_cash, v_created_accrual, v_release]::UUID[])
    AND id IS NOT NULL;

  UPDATE public.document_receipts
  SET entry_id = v_cash,
      accrual_entry_id = v_accrual,
      release_entry_id = v_release
  WHERE id = v_receipt;

  v_already := ROUND(v_already + v_amount, 2);
  v_remaining := ROUND(GREATEST(v_total - v_already, 0), 2);

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
    'received', v_already,
    'remaining', v_remaining,
    'entry_id', v_cash,
    'accrual_entry_id', v_accrual,
    'release_entry_id', v_release,
    'bridge_mode', v_kind
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_record_transitory_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, UUID, DATE
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_record_transitory_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, UUID, DATE
) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_record_transitory_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, UUID, DATE
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_record_transitory_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, UUID, DATE
) TO service_role;

-- Retire toutes les écritures liées, ou aucune si un exercice est clôturé.
CREATE OR REPLACE FUNCTION public.accounting_void_receipt_bridge(p_club UUID, p_entry UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt public.document_receipts%ROWTYPE;
  v_id UUID;
  v_ids UUID[] := ARRAY[]::UUID[];
  v_status TEXT;
  v_period_status TEXT;
BEGIN
  SELECT * INTO v_receipt
  FROM public.document_receipts
  WHERE club_id = p_club
    AND (
      entry_id = p_entry
      OR accrual_entry_id = p_entry
      OR release_entry_id = p_entry
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Encaissement introuvable';
  END IF;

  SELECT COALESCE(array_agg(e.id), ARRAY[]::UUID[])
  INTO v_ids
  FROM public.accounting_entries e
  WHERE e.club_id = p_club
    AND e.status IS DISTINCT FROM 'voided'
    AND (
      e.id = v_receipt.entry_id
      OR e.id = v_receipt.release_entry_id
      OR (
        e.id = v_receipt.accrual_entry_id
        AND e.bridge_receipt_id = v_receipt.id
      )
      OR e.bridge_receipt_id = v_receipt.id
    );

  FOREACH v_id IN ARRAY v_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;
    SELECT e.status, p.status
    INTO v_status, v_period_status
    FROM public.accounting_entries e
    JOIN public.accounting_periods p ON p.id = e.period_id
    WHERE e.id = v_id AND e.club_id = p_club
    FOR UPDATE OF e;

    IF v_status IS NULL OR v_status = 'voided' THEN
      CONTINUE;
    END IF;
    IF v_period_status IS DISTINCT FROM 'open' THEN
      RAISE EXCEPTION 'Cette correction touche une écriture d''un exercice clôturé. Aucune partie de l''encaissement transitoire n''a été modifiée.';
    END IF;
  END LOOP;

  FOREACH v_id IN ARRAY v_ids LOOP
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;
    SELECT status INTO v_status
    FROM public.accounting_entries
    WHERE id = v_id AND club_id = p_club;
    IF v_status IS NOT NULL AND v_status <> 'voided' THEN
      PERFORM public.accounting_void_journal_entry(p_club, v_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('receipt_id', v_receipt.id, 'voided', to_jsonb(v_ids));
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_void_receipt_bridge(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_void_receipt_bridge(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_void_receipt_bridge(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_void_receipt_bridge(UUID, UUID) TO service_role;
