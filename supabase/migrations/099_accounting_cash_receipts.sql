-- Encaissement au moment où le club confirme avoir reçu l'argent.
-- L'émission, l'envoi et un statut encore ouvert ne créent plus d'écriture.
-- Les écritures déjà passées ne sont ni effacées ni repostées.

ALTER TABLE public.accounting_inbox DROP CONSTRAINT IF EXISTS accounting_inbox_status_check;
ALTER TABLE public.accounting_inbox
  ADD CONSTRAINT accounting_inbox_status_check
  CHECK (status IN (
    'pending',
    'awaiting_account',
    'awaiting_category',
    'awaiting_details',
    'posted',
    'reversed',
    'ignored_before_start',
    'blocked_closed_period',
    'skipped'
  ));

-- File d'attente anticipée, jamais devenue une écriture : on ne la poste plus.
UPDATE public.accounting_inbox
SET status = 'skipped', updated_at = NOW()
WHERE source_type IN ('invoice', 'membership')
  AND status IN ('pending', 'awaiting_account', 'awaiting_category', 'awaiting_details');

-- documents.id est un bigint en production, un uuid dans le script d'origine.
-- La colonne reprend exactement le type réel de documents.id.
DO $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT pg_catalog.format_type(a.atttypid, a.atttypmod)
  INTO v_type
  FROM pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'documents'
    AND a.attname = 'id'
    AND NOT a.attisdropped;

  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Table documents introuvable';
  END IF;

  IF to_regclass('public.document_receipts') IS NULL THEN
    EXECUTE format($sql$
      CREATE TABLE public.document_receipts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        document_id %s NOT NULL REFERENCES public.documents(id) ON DELETE RESTRICT,
        amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
        received_on DATE NOT NULL,
        account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
        entry_id UUID REFERENCES public.accounting_entries(id) ON DELETE RESTRICT,
        idempotency_key TEXT NOT NULL,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT document_receipts_idem UNIQUE (club_id, idempotency_key)
      )
    $sql$, v_type);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS document_receipts_entry
  ON public.document_receipts (entry_id)
  WHERE entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS document_receipts_document
  ON public.document_receipts (club_id, document_id);

ALTER TABLE public.document_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.document_receipts FROM PUBLIC;
REVOKE ALL ON public.document_receipts FROM anon;
REVOKE ALL ON public.document_receipts FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.document_receipts TO service_role;

-- Plusieurs encaissements réels d'une même facture ou cotisation.
-- Les autres sources gardent une seule écriture active.
DROP INDEX IF EXISTS public.accounting_entries_active_source;
CREATE UNIQUE INDEX accounting_entries_active_source
  ON public.accounting_entries (club_id, source_type, source_id, event_type)
  WHERE status IN ('pending', 'validated')
    AND event_type IN ('payment_received', 'payment_sent')
    AND source_id IS NOT NULL
    AND source_type NOT IN ('invoice', 'membership');

CREATE OR REPLACE FUNCTION public.accounting_on_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer, envoyer ou laisser le document ouvert ne comptabilise rien.
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_record_document_receipt(
  p_club UUID,
  p_document TEXT,
  p_user UUID,
  p_received_on DATE,
  p_account UUID,
  p_amount NUMERIC,
  p_key TEXT,
  p_category TEXT,
  p_allow_stripe BOOLEAN DEFAULT FALSE
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
  v_received NUMERIC(14, 2);
  v_account_code TEXT;
  v_category UUID;
  v_period UUID;
  v_party TEXT;
  v_description TEXT;
  v_receipt UUID;
  v_existing_entry UUID;
  v_posted JSONB;
  v_entry UUID;
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
    'lines', jsonb_build_array(
      jsonb_build_object('account_id', p_account, 'debit', v_amount, 'credit', 0),
      jsonb_build_object('account_id', v_category, 'debit', 0, 'credit', v_amount)
    )
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
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN
) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN
) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_record_document_receipt(
  UUID, TEXT, UUID, DATE, UUID, NUMERIC, TEXT, TEXT, BOOLEAN
) TO service_role;
