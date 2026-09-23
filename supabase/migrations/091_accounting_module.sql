-- ============================================
-- MIGRATION 091 : Module Comptabilité
-- ============================================
-- Comptabilité de trésorerie (recettes, dépenses, patrimoine).
-- Une opération métier = une accounting_entry.
-- Les écritures pending ne sont pas des soldes officiels :
-- les rapports ne lisent que status = 'validated'.
-- accounting_audit_log est hors de purge_operational_data (conservation 10 ans).
-- IDEMPOTENT.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------
-- Add-on premium (abonnement séparé, CHF / an)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'active', 'past_due', 'canceled')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT club_addons_unique UNIQUE (club_id, addon_key)
);

-- --------------------------------------------
-- Paramètres, exercices, plan
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounting_settings (
  club_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  auto_validate BOOLEAN NOT NULL DEFAULT FALSE,
  vat_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  opening_confirmed_at TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reopened_at TIMESTAMPTZ,
  reopened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reopen_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounting_periods_dates CHECK (ends_on >= starts_on),
  CONSTRAINT accounting_periods_unique UNIQUE (club_id, starts_on)
);

CREATE TABLE IF NOT EXISTS public.accounting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL
    CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_class INTEGER NOT NULL CHECK (account_class BETWEEN 1 AND 9),
  system_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_accounts_number_active
  ON public.accounting_accounts (club_id, number)
  WHERE is_active;

CREATE UNIQUE INDEX IF NOT EXISTS accounting_accounts_system_code
  ON public.accounting_accounts (club_id, system_code)
  WHERE system_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.accounting_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounting_mappings_unique UNIQUE (club_id, source_kind)
);

-- --------------------------------------------
-- Écritures : une ligne = une opération
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.accounting_periods(id) ON DELETE RESTRICT,
  entry_number INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  direction TEXT NOT NULL
    CHECK (direction IN ('in', 'out', 'transfer', 'opening', 'adjustment', 'reversal')),
  source_type TEXT NOT NULL,
  source_id UUID,
  event_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'validated', 'reversed', 'voided')),
  counter_account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  category_account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  reversal_of_entry_id UUID REFERENCES public.accounting_entries(id) ON DELETE RESTRICT,
  reversed_by_entry_id UUID,
  party_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounting_entries_idem UNIQUE (club_id, idempotency_key),
  CONSTRAINT accounting_entries_number UNIQUE (club_id, period_id, entry_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_entries_active_source
  ON public.accounting_entries (club_id, source_type, source_id, event_type)
  WHERE status IN ('pending', 'validated')
    AND event_type IN ('payment_received', 'payment_sent')
    AND source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.accounting_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.accounting_entries(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  debit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  line_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT accounting_entry_lines_one_side CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

CREATE TABLE IF NOT EXISTS public.accounting_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.accounting_entries(id) ON DELETE RESTRICT,
  storage_bucket TEXT,
  storage_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  source_type TEXT,
  source_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.accounting_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fee_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  party_name TEXT,
  financial_account_code TEXT,
  category_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'awaiting_account',
      'awaiting_category',
      'awaiting_details',
      'posted',
      'reversed',
      'ignored_before_start',
      'blocked_closed_period'
    )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounting_inbox_idem UNIQUE (club_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS accounting_inbox_club_status
  ON public.accounting_inbox (club_id, status);

-- Historique comptable dédié. Ne pas l'ajouter à purge_operational_data.
CREATE TABLE IF NOT EXISTS public.accounting_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accounting_audit_log_club_created
  ON public.accounting_audit_log (club_id, created_at DESC);

COMMENT ON TABLE public.accounting_audit_log IS
  'Piste d''audit comptable. Conservation 10 ans (art. 958f CO). Exclue de purge_operational_data.';

-- --------------------------------------------
-- Immutabilité et équilibre
-- --------------------------------------------
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

DROP TRIGGER IF EXISTS accounting_entries_guard ON public.accounting_entries;
CREATE TRIGGER accounting_entries_guard
  BEFORE UPDATE OR DELETE ON public.accounting_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_guard_entry();

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
  IF v_status IN ('validated', 'reversed') THEN
    RAISE EXCEPTION 'Lignes d''une écriture validée immuables';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_lines_guard ON public.accounting_entry_lines;
CREATE TRIGGER accounting_lines_guard
  BEFORE UPDATE OR DELETE ON public.accounting_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_guard_lines();

-- --------------------------------------------
-- Passage atomique d'une écriture (service_role)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.accounting_post_entry(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club UUID;
  v_period UUID;
  v_key TEXT;
  v_existing UUID;
  v_id UUID;
  v_number INTEGER;
  v_amount NUMERIC(14, 2);
  v_status TEXT;
  v_debit NUMERIC(14, 2);
  v_credit NUMERIC(14, 2);
  v_line JSONB;
  v_order INTEGER := 0;
  v_reversal UUID;
  v_user UUID;
BEGIN
  v_club := (p_payload->>'club_id')::UUID;
  v_period := (p_payload->>'period_id')::UUID;
  v_key := p_payload->>'idempotency_key';
  v_amount := ROUND(COALESCE((p_payload->>'amount')::NUMERIC, 0), 2);
  v_status := COALESCE(p_payload->>'status', 'pending');
  v_user := NULLIF(p_payload->>'created_by', '')::UUID;

  IF v_club IS NULL OR v_period IS NULL OR v_key IS NULL OR v_key = '' THEN
    RAISE EXCEPTION 'Payload comptable incomplet';
  END IF;

  IF v_status NOT IN ('pending', 'validated') THEN
    RAISE EXCEPTION 'Statut initial interdit';
  END IF;

  PERFORM 1
  FROM public.accounting_settings
  WHERE club_id = v_club
  FOR UPDATE;

  SELECT id INTO v_existing
  FROM public.accounting_entries
  WHERE club_id = v_club AND idempotency_key = v_key;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing, 'created', false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE id = v_period AND club_id = v_club AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Exercice clôturé ou introuvable';
  END IF;

  SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_number
  FROM public.accounting_entries
  WHERE club_id = v_club AND period_id = v_period;

  INSERT INTO public.accounting_entries (
    club_id, period_id, entry_number, entry_date, description, amount,
    direction, source_type, source_id, event_type, idempotency_key, status,
    counter_account_id, category_account_id, reversal_of_entry_id, party_name,
    created_by, validated_by, validated_at
  ) VALUES (
    v_club,
    v_period,
    v_number,
    (p_payload->>'entry_date')::DATE,
    COALESCE(p_payload->>'description', 'Opération'),
    v_amount,
    COALESCE(p_payload->>'direction', 'in'),
    COALESCE(p_payload->>'source_type', 'manual'),
    NULLIF(p_payload->>'source_id', '')::UUID,
    COALESCE(p_payload->>'event_type', 'payment_received'),
    v_key,
    v_status,
    NULLIF(p_payload->>'counter_account_id', '')::UUID,
    NULLIF(p_payload->>'category_account_id', '')::UUID,
    NULLIF(p_payload->>'reversal_of_entry_id', '')::UUID,
    NULLIF(p_payload->>'party_name', ''),
    v_user,
    CASE WHEN v_status = 'validated' THEN v_user ELSE NULL END,
    CASE WHEN v_status = 'validated' THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'lines', '[]'::JSONB))
  LOOP
    v_order := v_order + 1;
    INSERT INTO public.accounting_entry_lines (
      club_id, entry_id, account_id, debit, credit, line_order
    ) VALUES (
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
    RAISE EXCEPTION 'Ecriture déséquilibrée';
  END IF;

  v_reversal := NULLIF(p_payload->>'reversal_of_entry_id', '')::UUID;
  IF v_reversal IS NOT NULL THEN
    UPDATE public.accounting_entries
    SET status = 'reversed', reversed_by_entry_id = v_id
    WHERE id = v_reversal AND club_id = v_club AND status = 'validated';
  END IF;

  INSERT INTO public.accounting_audit_log (club_id, entry_id, user_id, action, new_value)
  VALUES (
    v_club,
    v_id,
    v_user,
    COALESCE(p_payload->>'audit_action', 'create'),
    jsonb_build_object('status', v_status, 'amount', v_amount, 'key', v_key)
  );

  RETURN jsonb_build_object('id', v_id, 'entry_number', v_number, 'created', true);
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_post_entry(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accounting_post_entry(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.accounting_post_entry(JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.accounting_post_entry(JSONB) TO service_role;

-- --------------------------------------------
-- File d'attente : ne bloque jamais le métier
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.accounting_enqueue(
  p_club UUID,
  p_source_type TEXT,
  p_source_id UUID,
  p_event_type TEXT,
  p_direction TEXT,
  p_amount NUMERIC,
  p_fee NUMERIC,
  p_entry_date DATE,
  p_description TEXT,
  p_party TEXT,
  p_financial TEXT,
  p_category TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start DATE;
  v_ready BOOLEAN;
  v_status TEXT;
  v_count INTEGER;
  v_key TEXT;
  v_amount NUMERIC(14, 2);
BEGIN
  SELECT start_date, onboarding_completed_at IS NOT NULL
  INTO v_start, v_ready
  FROM public.accounting_settings
  WHERE club_id = p_club;

  IF NOT COALESCE(v_ready, FALSE) THEN
    RETURN;
  END IF;

  IF p_entry_date IS NOT NULL AND v_start IS NOT NULL AND p_entry_date < v_start THEN
    RETURN;
  END IF;

  v_amount := ROUND(COALESCE(p_amount, 0), 2);
  IF v_amount <= 0 THEN
    RETURN;
  END IF;

  IF p_event_type IN ('payment_received', 'payment_sent') THEN
    IF EXISTS (
      SELECT 1 FROM public.accounting_inbox
      WHERE club_id = p_club
        AND source_type = p_source_type
        AND source_id = p_source_id
        AND event_type = p_event_type
        AND status IN (
          'pending', 'awaiting_account', 'awaiting_category', 'awaiting_details',
          'blocked_closed_period', 'posted'
        )
    ) THEN
      RETURN;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.accounting_entries
      WHERE club_id = p_club
        AND source_type = p_source_type
        AND source_id = p_source_id
        AND event_type = p_event_type
        AND status IN ('pending', 'validated')
    ) THEN
      RETURN;
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.accounting_inbox
  WHERE club_id = p_club
    AND source_type = p_source_type
    AND source_id = p_source_id
    AND event_type = p_event_type;

  v_key := p_source_type || ':' || p_source_id::TEXT || ':' || p_event_type;
  IF v_count > 0 THEN
    v_key := v_key || ':' || (v_count + 1)::TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE club_id = p_club
      AND status = 'closed'
      AND p_entry_date BETWEEN starts_on AND ends_on
  ) THEN
    v_status := 'blocked_closed_period';
  ELSIF p_event_type = 'payment_reversed' THEN
    v_status := 'pending';
  ELSIF p_financial IS NULL AND p_category IS NULL THEN
    v_status := 'awaiting_details';
  ELSIF p_financial IS NULL THEN
    v_status := 'awaiting_account';
  ELSIF p_category IS NULL THEN
    v_status := 'awaiting_category';
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO public.accounting_inbox (
    club_id, idempotency_key, source_type, source_id, event_type, direction,
    amount, fee_amount, entry_date, description, party_name,
    financial_account_code, category_code, status
  ) VALUES (
    p_club, v_key, p_source_type, p_source_id, p_event_type, p_direction,
    v_amount, ROUND(COALESCE(p_fee, 0), 2), p_entry_date,
    COALESCE(p_description, ''), NULLIF(p_party, ''),
    NULLIF(p_financial, ''), NULLIF(p_category, ''), v_status
  )
  ON CONFLICT (club_id, idempotency_key) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.accounting_enqueue(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accounting_enqueue(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.accounting_document_is_paid(p_type TEXT, p_status TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_type = 'quote' THEN p_status IN ('accepte', 'paye')
    WHEN p_type = 'invoice' THEN p_status = 'paye'
    ELSE FALSE
  END;
$$;

CREATE OR REPLACE FUNCTION public.accounting_on_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now BOOLEAN;
  v_was BOOLEAN;
  v_source TEXT;
  v_category TEXT;
  v_financial TEXT;
  v_date DATE;
  v_party TEXT;
BEGIN
  v_now := public.accounting_document_is_paid(NEW.type, NEW.status);
  v_was := TG_OP = 'UPDATE' AND public.accounting_document_is_paid(OLD.type, OLD.status);
  IF v_now = v_was THEN
    RETURN NEW;
  END IF;

  v_source := CASE WHEN NEW.type = 'quote' THEN 'membership' ELSE 'invoice' END;
  v_date := COALESCE(NEW.date_paiement, (timezone('Europe/Zurich', NOW()))::DATE);
  v_category := CASE
    WHEN NEW.type = 'quote' THEN 'membership'
    WHEN NEW.sponsor_contract_id IS NOT NULL THEN 'sponsoring'
    WHEN COALESCE(NEW.notes, '') ILIKE '%buvette%' THEN 'buvette'
    ELSE NULL
  END;
  v_financial := CASE
    WHEN NEW.payment_method = 'stripe' OR NEW.stripe_payment_intent_id IS NOT NULL THEN 'stripe'
    ELSE NULL
  END;

  SELECT NULLIF(TRIM(COALESCE(c.nom, '')), '') INTO v_party
  FROM public.clients c
  WHERE c.id = NEW.client_id;

  IF v_party IS NULL AND NEW.sponsor_contract_id IS NOT NULL THEN
    SELECT NULLIF(TRIM(COALESCE(s.sponsor_name, '')), '') INTO v_party
    FROM public.sponsor_contracts s
    WHERE s.id = NEW.sponsor_contract_id;
  END IF;

  IF v_now AND NOT v_was THEN
    PERFORM public.accounting_enqueue(
      NEW.user_id, v_source, NEW.id, 'payment_received', 'in',
      COALESCE(NEW.total_ttc, 0), 0, v_date,
      COALESCE(NULLIF(TRIM(NEW.title), ''), NULLIF(TRIM(NEW.numero), ''), 'Paiement'),
      v_party, v_financial, v_category
    );
  ELSIF v_was AND NOT v_now THEN
    PERFORM public.accounting_enqueue(
      NEW.user_id, v_source, NEW.id, 'payment_reversed', 'reversal',
      COALESCE(NEW.total_ttc, 0), 0, (timezone('Europe/Zurich', NOW()))::DATE,
      'Annulation de paiement', v_party, v_financial, v_category
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'accounting_on_document: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_documents_enqueue ON public.documents;
CREATE TRIGGER accounting_documents_enqueue
  AFTER INSERT OR UPDATE OF status, date_paiement, payment_method, stripe_payment_intent_id
  ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_on_document();

CREATE OR REPLACE FUNCTION public.accounting_on_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now BOOLEAN;
  v_was BOOLEAN;
  v_date DATE;
BEGIN
  v_now := NEW.status = 'paye' AND NEW.deleted_at IS NULL;
  v_was := TG_OP = 'UPDATE' AND OLD.status = 'paye' AND OLD.deleted_at IS NULL;
  IF v_now = v_was THEN
    RETURN NEW;
  END IF;

  v_date := (timezone('Europe/Zurich', NOW()))::DATE;

  IF v_now AND NOT v_was THEN
    PERFORM public.accounting_enqueue(
      NEW.user_id, 'expense', NEW.id, 'payment_sent', 'out',
      COALESCE(NEW.amount, 0), 0, v_date,
      COALESCE(NEW.description, 'Dépense'),
      NULL, NULL, NULL
    );
  ELSIF v_was AND NOT v_now THEN
    PERFORM public.accounting_enqueue(
      NEW.user_id, 'expense', NEW.id, 'payment_reversed', 'reversal',
      COALESCE(NEW.amount, 0), 0, v_date,
      'Annulation de dépense', NULL, NULL, NULL
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'accounting_on_expense: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_expenses_enqueue ON public.expenses;
CREATE TRIGGER accounting_expenses_enqueue
  AFTER INSERT OR UPDATE OF status, deleted_at
  ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_on_expense();

CREATE OR REPLACE FUNCTION public.accounting_on_shop_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(14, 2);
  v_date DATE;
  v_party TEXT;
BEGIN
  v_amount := ROUND(COALESCE(NEW.total_cents, 0) / 100.0, 2);
  v_date := COALESCE((NEW.paid_at AT TIME ZONE 'Europe/Zurich')::DATE, (timezone('Europe/Zurich', NOW()))::DATE);
  v_party := NULLIF(TRIM(CONCAT_WS(' ', NEW.customer_first_name, NEW.customer_last_name)), '');

  IF NEW.payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'paid') THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'shop_order', NEW.id, 'payment_received', 'in',
      v_amount, 0, v_date,
      'Boutique', v_party, 'stripe', 'shop'
    );
  ELSIF TG_OP = 'UPDATE'
    AND OLD.payment_status = 'paid'
    AND NEW.payment_status = 'refunded' THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'shop_order', NEW.id, 'payment_reversed', 'reversal',
      v_amount, 0, (timezone('Europe/Zurich', NOW()))::DATE,
      'Remboursement boutique', v_party, 'stripe', 'shop'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'accounting_on_shop_order: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_shop_orders_enqueue ON public.shop_orders;
CREATE TRIGGER accounting_shop_orders_enqueue
  AFTER INSERT OR UPDATE OF payment_status, paid_at, total_cents
  ON public.shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_on_shop_order();

CREATE OR REPLACE FUNCTION public.accounting_on_supporter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(14, 2);
  v_date DATE;
BEGIN
  v_amount := ROUND(COALESCE(NEW.amount_paid_cents, 0) / 100.0, 2);
  v_date := COALESCE((NEW.activated_at AT TIME ZONE 'Europe/Zurich')::DATE, (timezone('Europe/Zurich', NOW()))::DATE);

  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'supporter', NEW.id, 'payment_received', 'in',
      v_amount, 0, v_date,
      'Carte supporter', NULLIF(TRIM(COALESCE(NEW.first_name, '')), ''),
      'stripe', 'supporters'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'cancelled' THEN
    PERFORM public.accounting_enqueue(
      NEW.club_id, 'supporter', NEW.id, 'payment_reversed', 'reversal',
      v_amount, 0, (timezone('Europe/Zurich', NOW()))::DATE,
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

DROP TRIGGER IF EXISTS accounting_supporters_enqueue ON public.supporters;
CREATE TRIGGER accounting_supporters_enqueue
  AFTER INSERT OR UPDATE OF status, amount_paid_cents, activated_at
  ON public.supporters
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_on_supporter();

CREATE OR REPLACE FUNCTION public.accounting_on_club_revenue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source TEXT;
  v_source_id UUID;
  v_category TEXT;
BEGIN
  v_source := COALESCE(NULLIF(NEW.source_type, ''), 'club_revenue');
  v_source_id := COALESCE(NEW.source_id, NEW.id);
  v_category := CASE
    WHEN NEW.source_type = 'support_sale' THEN 'support_sale'
    ELSE NULL
  END;

  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    PERFORM public.accounting_enqueue(
      NEW.user_id, v_source, v_source_id, 'payment_received', 'in',
      COALESCE(NEW.amount, 0), 0, COALESCE(NEW.revenue_date, (timezone('Europe/Zurich', NOW()))::DATE),
      COALESCE(NEW.name, 'Encaissement'), NULL, NULL, v_category
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    PERFORM public.accounting_enqueue(
      NEW.user_id, v_source, v_source_id, 'payment_reversed', 'reversal',
      COALESCE(NEW.amount, 0), 0, (timezone('Europe/Zurich', NOW()))::DATE,
      'Annulation d''encaissement', NULL, NULL, v_category
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'accounting_on_club_revenue: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accounting_club_revenues_enqueue ON public.club_revenues;
CREATE TRIGGER accounting_club_revenues_enqueue
  AFTER INSERT OR UPDATE OF deleted_at, amount, source_type, source_id
  ON public.club_revenues
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_on_club_revenue();

-- --------------------------------------------
-- RLS : lecture si view_accounting, aucune écriture client
-- --------------------------------------------
ALTER TABLE public.club_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS club_addons_select ON public.club_addons;
CREATE POLICY club_addons_select ON public.club_addons
  FOR SELECT USING (public.is_club_admin(club_id) OR public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_settings_select ON public.accounting_settings;
CREATE POLICY accounting_settings_select ON public.accounting_settings
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_periods_select ON public.accounting_periods;
CREATE POLICY accounting_periods_select ON public.accounting_periods
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_accounts_select ON public.accounting_accounts;
CREATE POLICY accounting_accounts_select ON public.accounting_accounts
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_mappings_select ON public.accounting_mappings;
CREATE POLICY accounting_mappings_select ON public.accounting_mappings
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_entries_select ON public.accounting_entries;
CREATE POLICY accounting_entries_select ON public.accounting_entries
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_entry_lines_select ON public.accounting_entry_lines;
CREATE POLICY accounting_entry_lines_select ON public.accounting_entry_lines
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_attachments_select ON public.accounting_attachments;
CREATE POLICY accounting_attachments_select ON public.accounting_attachments
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_inbox_select ON public.accounting_inbox;
CREATE POLICY accounting_inbox_select ON public.accounting_inbox
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

DROP POLICY IF EXISTS accounting_audit_select ON public.accounting_audit_log;
CREATE POLICY accounting_audit_select ON public.accounting_audit_log
  FOR SELECT USING (public.has_club_permission(club_id, 'view_accounting'));

-- Owner / admin : les nouvelles clés sont visibles via le RPC SQL.
CREATE OR REPLACE FUNCTION public.current_user_permissions(p_club_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN cm.role IN ('owner', 'admin') THEN jsonb_build_object(
        'view_members', true,
        'manage_members', true,
        'delete_members', true,
        'view_expenses', true,
        'manage_expenses', true,
        'delete_expenses', true,
        'view_invoices', true,
        'manage_invoices', true,
        'delete_invoices', true,
        'view_documents', true,
        'manage_documents', true,
        'delete_documents', true,
        'view_plannings', true,
        'manage_plannings', true,
        'view_meeting_minutes', true,
        'manage_meeting_minutes', true,
        'view_shop', true,
        'manage_shop', true,
        'view_supporters', true,
        'manage_supporters', true,
        'view_support_sales', true,
        'manage_support_sales', true,
        'view_visuals', true,
        'manage_visuals', true,
        'view_accounting', true,
        'manage_accounting', true,
        'access_settings', true,
        'manage_users', true
      )
      ELSE COALESCE(cm.permissions, '{}'::jsonb)
    END
  FROM public.club_memberships cm
  WHERE cm.club_id = p_club_id
    AND cm.user_id = auth.uid()
    AND cm.deleted_at IS NULL
    AND cm.status = 'active'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_permissions(UUID) TO authenticated;
