-- Budget par exercice et rubriques facultatives du plan.
-- N'altère aucune écriture, aucun compte et aucun total existant.
-- Le budget n'insère rien dans accounting_entries.

CREATE TABLE IF NOT EXISTS public.accounting_account_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounting_account_groups_number_chk CHECK (number ~ '^[0-9]{3,6}$'),
  CONSTRAINT accounting_account_groups_unique UNIQUE (club_id, number)
);

CREATE TABLE IF NOT EXISTS public.accounting_account_group_members (
  group_id UUID NOT NULL REFERENCES public.accounting_account_groups(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, account_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_group_member_once
  ON public.accounting_account_group_members (club_id, account_id);

CREATE TABLE IF NOT EXISTS public.accounting_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.accounting_periods(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'validated', 'superseded')),
  version INTEGER NOT NULL CHECK (version >= 1),
  supersedes_id UUID REFERENCES public.accounting_budgets(id) ON DELETE SET NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounting_budgets_version_unique UNIQUE (club_id, period_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_budgets_one_draft
  ON public.accounting_budgets (club_id, period_id)
  WHERE status = 'draft';

CREATE UNIQUE INDEX IF NOT EXISTS accounting_budgets_one_validated
  ON public.accounting_budgets (club_id, period_id)
  WHERE status = 'validated';

CREATE TABLE IF NOT EXISTS public.accounting_budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.accounting_budgets(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  group_id UUID REFERENCES public.accounting_account_groups(id) ON DELETE SET NULL,
  group_number TEXT,
  group_name TEXT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  CONSTRAINT accounting_budget_lines_target CHECK (
    (account_id IS NOT NULL AND group_id IS NULL AND group_number IS NULL)
    OR (account_id IS NULL AND group_id IS NOT NULL)
    OR (account_id IS NULL AND group_id IS NULL AND group_number IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS accounting_budget_lines_account
  ON public.accounting_budget_lines (budget_id, account_id)
  WHERE account_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS accounting_budget_lines_group
  ON public.accounting_budget_lines (budget_id, group_id)
  WHERE group_id IS NOT NULL;

ALTER TABLE public.accounting_account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_account_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_budget_lines ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.accounting_account_groups FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.accounting_account_group_members FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.accounting_budgets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.accounting_budget_lines FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_account_groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_account_group_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_budgets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_budget_lines TO service_role;

COMMENT ON TABLE public.accounting_account_groups IS
  'Rubrique de totalisation. Ne reçoit pas d''écriture et ne modifie pas les soldes.';
COMMENT ON TABLE public.accounting_budgets IS
  'Budget de charges et de produits. Ne crée aucune écriture comptable.';
