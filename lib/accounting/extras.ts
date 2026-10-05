import { createAdminClient } from "@/lib/supabase/admin";
import { assessBudgetLines, planBudgetRevision, planBudgetValidation, type BudgetTarget } from "./budget";
import { assessAccountGroup, type AccountGroup } from "./groups";
import { roundChf } from "./money";

type Admin = ReturnType<typeof createAdminClient>;

export type StoredBudgetLine = {
  accountId: string | null;
  groupId: string | null;
  groupNumber: string | null;
  groupName: string | null;
  amount: number;
};

export type StoredBudget = {
  id: string;
  periodId: string;
  status: "draft" | "validated" | "superseded";
  version: number;
  supersedesId: string | null;
  note: string | null;
  validatedAt: string | null;
  lines: StoredBudgetLine[];
};

const MIGRATION_HINT = "Appliquez la migration 103 dans Supabase, puis réessayez. Aucune écriture comptable n’a été créée.";

export function isMissingTable(error: { message?: string; code?: string } | null, table: string): boolean {
  if (!error) return false;
  const message = error.message || "";
  if (!message.includes(table) && error.code !== "42P01" && error.code !== "PGRST205") return false;
  return error.code === "42P01"
    || error.code === "PGRST205"
    || /schema cache|does not exist|Could not find/i.test(message);
}

async function audit(
  admin: Admin,
  clubId: string,
  action: string,
  userId: string,
  oldValue: unknown,
  newValue: unknown,
) {
  await admin.from("accounting_audit_log").insert({
    club_id: clubId,
    entry_id: null,
    user_id: userId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

function throwIfMissing(error: { message?: string; code?: string } | null, table: string): void {
  if (!error) return;
  if (isMissingTable(error, table)) throw new Error(MIGRATION_HINT);
  throw new Error(error.message || "Erreur comptable");
}

export async function groupUsesNumber(admin: Admin, clubId: string, number: string): Promise<boolean> {
  const { data, error } = await admin
    .from("accounting_account_groups")
    .select("id")
    .eq("club_id", clubId)
    .eq("number", number)
    .maybeSingle();
  if (error) {
    if (isMissingTable(error, "accounting_account_groups")) return false;
    throw new Error(error.message);
  }
  return Boolean(data);
}

export async function loadAccountingExtras(admin: Admin, clubId: string): Promise<{
  groups: AccountGroup[];
  budgets: StoredBudget[];
  ready: boolean;
}> {
  const groupsResult = await admin
    .from("accounting_account_groups")
    .select("id, number, name")
    .eq("club_id", clubId)
    .order("number");
  if (groupsResult.error) {
    if (isMissingTable(groupsResult.error, "accounting_account_groups")) {
      return { groups: [], budgets: [], ready: false };
    }
    throw new Error(groupsResult.error.message);
  }

  const membersResult = await admin
    .from("accounting_account_group_members")
    .select("group_id, account_id")
    .eq("club_id", clubId);
  if (membersResult.error) {
    if (isMissingTable(membersResult.error, "accounting_account_group_members")) {
      return { groups: [], budgets: [], ready: false };
    }
    throw new Error(membersResult.error.message);
  }

  const budgetsResult = await admin
    .from("accounting_budgets")
    .select("id, period_id, status, version, supersedes_id, note, validated_at")
    .eq("club_id", clubId)
    .order("version");
  if (budgetsResult.error) {
    if (isMissingTable(budgetsResult.error, "accounting_budgets")) {
      return { groups: [], budgets: [], ready: false };
    }
    throw new Error(budgetsResult.error.message);
  }

  const linesResult = await admin
    .from("accounting_budget_lines")
    .select("budget_id, account_id, group_id, group_number, group_name, amount")
    .eq("club_id", clubId);
  if (linesResult.error) {
    if (isMissingTable(linesResult.error, "accounting_budget_lines")) {
      return { groups: [], budgets: [], ready: false };
    }
    throw new Error(linesResult.error.message);
  }

  const members = new Map<string, string[]>();
  for (const row of membersResult.data ?? []) {
    const list = members.get(String(row.group_id)) ?? [];
    list.push(String(row.account_id));
    members.set(String(row.group_id), list);
  }
  const groups: AccountGroup[] = (groupsResult.data ?? []).map((row) => ({
    id: String(row.id),
    number: String(row.number),
    name: String(row.name),
    accountIds: members.get(String(row.id)) ?? [],
  }));

  const linesByBudget = new Map<string, StoredBudgetLine[]>();
  for (const row of linesResult.data ?? []) {
    const list = linesByBudget.get(String(row.budget_id)) ?? [];
    list.push({
      accountId: row.account_id ? String(row.account_id) : null,
      groupId: row.group_id ? String(row.group_id) : null,
      groupNumber: row.group_number ? String(row.group_number) : null,
      groupName: row.group_name ? String(row.group_name) : null,
      amount: roundChf(Number(row.amount)),
    });
    linesByBudget.set(String(row.budget_id), list);
  }
  const budgets: StoredBudget[] = (budgetsResult.data ?? []).map((row) => ({
    id: String(row.id),
    periodId: String(row.period_id),
    status: row.status as StoredBudget["status"],
    version: Number(row.version),
    supersedesId: row.supersedes_id ? String(row.supersedes_id) : null,
    note: row.note ? String(row.note) : null,
    validatedAt: row.validated_at ? String(row.validated_at) : null,
    lines: linesByBudget.get(String(row.id)) ?? [],
  }));

  return { groups, budgets, ready: true };
}

async function loadClubGroups(admin: Admin, clubId: string): Promise<AccountGroup[]> {
  const extras = await loadAccountingExtras(admin, clubId);
  if (!extras.ready) throw new Error(MIGRATION_HINT);
  return extras.groups;
}

export async function saveAccountGroup(params: {
  clubId: string;
  userId: string;
  groupId?: string;
  number: string;
  name: string;
  accountIds: string[];
}) {
  const admin = createAdminClient();
  const { data: accounts, error: accountsError } = await admin
    .from("accounting_accounts")
    .select("id, number")
    .eq("club_id", params.clubId);
  if (accountsError) throw new Error(accountsError.message);
  const groups = await loadClubGroups(admin, params.clubId);
  const assessed = assessAccountGroup({
    group: {
      id: params.groupId,
      number: params.number,
      name: params.name,
      accountIds: params.accountIds,
    },
    accounts: (accounts ?? []).map((account) => ({ id: String(account.id), number: String(account.number) })),
    otherGroups: groups.filter((group) => group.id !== params.groupId),
  });
  if (!assessed.ok) throw new Error(assessed.message);

  const previous = params.groupId ? groups.find((group) => group.id === params.groupId) : undefined;
  if (params.groupId && !previous) throw new Error("Rubrique introuvable");

  let groupId = params.groupId;
  if (groupId) {
    const { error } = await admin
      .from("accounting_account_groups")
      .update({ number: assessed.number, name: assessed.name, updated_at: new Date().toISOString() })
      .eq("id", groupId)
      .eq("club_id", params.clubId);
    throwIfMissing(error, "accounting_account_groups");
    const removed = await admin
      .from("accounting_account_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("club_id", params.clubId);
    throwIfMissing(removed.error, "accounting_account_group_members");
  } else {
    const { data, error } = await admin
      .from("accounting_account_groups")
      .insert({ club_id: params.clubId, number: assessed.number, name: assessed.name })
      .select("id")
      .maybeSingle();
    throwIfMissing(error, "accounting_account_groups");
    groupId = data?.id ? String(data.id) : "";
    if (!groupId) throw new Error("La rubrique n’a pas été créée.");
  }

  const { error: memberError } = await admin.from("accounting_account_group_members").insert(
    assessed.accountIds.map((accountId) => ({
      group_id: groupId,
      account_id: accountId,
      club_id: params.clubId,
    })),
  );
  throwIfMissing(memberError, "accounting_account_group_members");
  await audit(admin, params.clubId, "group_save", params.userId, previous ?? null, {
    id: groupId,
    number: assessed.number,
    name: assessed.name,
    accountIds: assessed.accountIds,
  });
}

export async function removeAccountGroup(clubId: string, userId: string, groupId: string) {
  const admin = createAdminClient();
  const groups = await loadClubGroups(admin, clubId);
  const group = groups.find((item) => item.id === groupId);
  if (!group) throw new Error("Rubrique introuvable");

  const { data: used, error: usedError } = await admin
    .from("accounting_budget_lines")
    .select("budget_id")
    .eq("club_id", clubId)
    .eq("group_id", groupId);
  throwIfMissing(usedError, "accounting_budget_lines");
  const budgetIds = [...new Set((used ?? []).map((row) => String(row.budget_id)))];
  if (budgetIds.length) {
    const { data: budgets, error } = await admin
      .from("accounting_budgets")
      .select("id, status")
      .eq("club_id", clubId)
      .in("id", budgetIds);
    throwIfMissing(error, "accounting_budgets");
    if ((budgets ?? []).some((budget) => budget.status === "draft" || budget.status === "validated")) {
      throw new Error("Cette rubrique figure dans un budget en cours. Retirez-la du brouillon, ou révisez le budget validé, avant de la supprimer.");
    }
  }

  const { error } = await admin
    .from("accounting_account_groups")
    .delete()
    .eq("id", groupId)
    .eq("club_id", clubId);
  throwIfMissing(error, "accounting_account_groups");
  await audit(admin, clubId, "group_remove", userId, group, null);
}

async function clubAccounts(admin: Admin, clubId: string) {
  const { data, error } = await admin
    .from("accounting_accounts")
    .select("id, number, name, account_type")
    .eq("club_id", clubId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((account) => ({
    id: String(account.id),
    number: String(account.number),
    name: String(account.name),
    accountType: String(account.account_type),
  }));
}

async function replaceBudgetLines(admin: Admin, clubId: string, budgetId: string, lines: BudgetTarget[], groups: AccountGroup[]) {
  const removed = await admin.from("accounting_budget_lines").delete().eq("budget_id", budgetId).eq("club_id", clubId);
  throwIfMissing(removed.error, "accounting_budget_lines");
  if (!lines.length) return;
  const { error } = await admin.from("accounting_budget_lines").insert(lines.map((line) => {
    const group = line.groupId ? groups.find((item) => item.id === line.groupId) : undefined;
    return {
      budget_id: budgetId,
      club_id: clubId,
      account_id: line.accountId,
      group_id: line.groupId,
      group_number: line.groupId ? (group?.number ?? line.number ?? null) : null,
      group_name: line.groupId ? (group?.name ?? line.name ?? null) : null,
      amount: line.amount,
    };
  }));
  throwIfMissing(error, "accounting_budget_lines");
}

export async function saveBudgetDraft(params: {
  clubId: string;
  userId: string;
  periodId: string;
  lines: BudgetTarget[];
}) {
  const admin = createAdminClient();
  const { data: period, error: periodError } = await admin
    .from("accounting_periods")
    .select("id")
    .eq("id", params.periodId)
    .eq("club_id", params.clubId)
    .maybeSingle();
  if (periodError) throw new Error(periodError.message);
  if (!period) throw new Error("Exercice introuvable");

  const extras = await loadAccountingExtras(admin, params.clubId);
  if (!extras.ready) throw new Error(MIGRATION_HINT);
  const accounts = await clubAccounts(admin, params.clubId);
  const assessed = assessBudgetLines({ lines: params.lines, accounts, groups: extras.groups });
  if (!assessed.ok) throw new Error(assessed.message);

  const current = extras.budgets.filter((budget) => budget.periodId === params.periodId && budget.status !== "superseded");
  const draft = current.find((budget) => budget.status === "draft");
  const validated = current.find((budget) => budget.status === "validated");
  if (!draft && validated) {
    throw new Error("Ce budget est validé. Révisez-le pour préparer une nouvelle version.");
  }

  let budgetId = draft?.id;
  if (!budgetId) {
    const version = Math.max(0, ...extras.budgets.filter((budget) => budget.periodId === params.periodId).map((budget) => budget.version)) + 1;
    const { data, error } = await admin
      .from("accounting_budgets")
      .insert({
        club_id: params.clubId,
        period_id: params.periodId,
        status: "draft",
        version,
        created_by: params.userId,
      })
      .select("id")
      .maybeSingle();
    throwIfMissing(error, "accounting_budgets");
    budgetId = data?.id ? String(data.id) : "";
    if (!budgetId) throw new Error("Le brouillon n’a pas été créé.");
  } else {
    const { error } = await admin
      .from("accounting_budgets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", budgetId)
      .eq("club_id", params.clubId)
      .eq("status", "draft");
    throwIfMissing(error, "accounting_budgets");
  }

  await replaceBudgetLines(admin, params.clubId, budgetId, assessed.lines, extras.groups);
  await audit(admin, params.clubId, "budget_save", params.userId, draft?.lines ?? null, {
    budgetId,
    periodId: params.periodId,
    lines: assessed.lines,
  });
}

export async function validateBudget(clubId: string, userId: string, budgetId: string) {
  const admin = createAdminClient();
  const extras = await loadAccountingExtras(admin, clubId);
  if (!extras.ready) throw new Error(MIGRATION_HINT);
  const budget = extras.budgets.find((item) => item.id === budgetId);
  if (!budget) throw new Error("Budget introuvable");
  const plan = planBudgetValidation(budget.status);
  if (!plan.ok) throw new Error(plan.message);

  const previous = extras.budgets.find((item) => item.periodId === budget.periodId && item.status === "validated");
  if (previous) {
    const { error } = await admin
      .from("accounting_budgets")
      .update({ status: "superseded", updated_at: new Date().toISOString() })
      .eq("id", previous.id)
      .eq("club_id", clubId)
      .eq("status", "validated");
    throwIfMissing(error, "accounting_budgets");
  }

  const { error } = await admin
    .from("accounting_budgets")
    .update({
      status: "validated",
      validated_by: userId,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId)
    .eq("club_id", clubId)
    .eq("status", "draft");
  throwIfMissing(error, "accounting_budgets");
  await audit(admin, clubId, "budget_validate", userId, { id: budgetId, status: "draft" }, {
    id: budgetId,
    status: "validated",
    periodId: budget.periodId,
    lines: budget.lines,
  });
}

export async function reviseBudget(clubId: string, userId: string, budgetId: string, note: string) {
  const admin = createAdminClient();
  const extras = await loadAccountingExtras(admin, clubId);
  if (!extras.ready) throw new Error(MIGRATION_HINT);
  const budget = extras.budgets.find((item) => item.id === budgetId);
  if (!budget) throw new Error("Budget introuvable");
  const hasOpenDraft = extras.budgets.some((item) => item.periodId === budget.periodId && item.status === "draft");
  const plan = planBudgetRevision({ status: budget.status, note, hasOpenDraft });
  if (!plan.ok) throw new Error(plan.message);

  const version = Math.max(...extras.budgets.filter((item) => item.periodId === budget.periodId).map((item) => item.version)) + 1;
  const { data, error } = await admin
    .from("accounting_budgets")
    .insert({
      club_id: clubId,
      period_id: budget.periodId,
      status: "draft",
      version,
      supersedes_id: budget.id,
      note: plan.note,
      created_by: userId,
    })
    .select("id")
    .maybeSingle();
  throwIfMissing(error, "accounting_budgets");
  const nextId = data?.id ? String(data.id) : "";
  if (!nextId) throw new Error("La révision n’a pas été créée.");

  const lines: BudgetTarget[] = budget.lines
    .filter((line) => line.accountId || line.groupId)
    .map((line) => ({
      accountId: line.accountId,
      groupId: line.groupId,
      amount: line.amount,
      number: line.groupNumber ?? undefined,
      name: line.groupName ?? undefined,
    }));
  await replaceBudgetLines(admin, clubId, nextId, lines, extras.groups);
  await audit(admin, clubId, "budget_revise", userId, {
    id: budget.id,
    version: budget.version,
    lines: budget.lines,
  }, {
    id: nextId,
    version,
    note: plan.note,
    supersedesId: budget.id,
    lines,
  });
}
