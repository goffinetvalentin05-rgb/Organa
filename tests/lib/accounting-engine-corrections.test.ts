import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  accumulatePnl,
  closingTransferLines,
  inboxProcessingDecision,
  planFollowingPeriod,
  sameTransferLines,
  transferResultAmount,
  type CloseEntry,
  type CloseLine,
} from "@/lib/accounting/closePeriod";
import { fetchAllPages, SUPABASE_PAGE_SIZE } from "@/lib/accounting/paging";
import { buildBalanceSheet, buildIncomeStatement, PRIOR_UNCLOSED_RESULT } from "@/lib/accounting/reports";
import type { ReportAccount, ReportEntry, ReportMovement } from "@/lib/accounting/reports";

const retained = "retained";

function account(id: string, number: string, name: string, accountType: string, accountClass: number): ReportAccount {
  return { id, number, name, accountType, accountClass };
}

const clubAccounts: ReportAccount[] = [
  account("bank", "1020", "Compte courant", "asset", 1),
  account("equity", "2800", "Fortune de l’association", "equity", 2),
  account("retained", "2900", "Résultats reportés", "equity", 2),
  account("result", "2979", "Résultat de l’exercice", "equity", 2),
  account("revenue", "3000", "Cotisations membres", "revenue", 3),
  account("expense", "4100", "Équipements", "expense", 4),
];

const season = { id: "season", label: "2026–2027", startsOn: "2026-07-01", endsOn: "2027-06-30" };

function entry(id: string, date: string, status: string, source = "manual", event = "payment_received"): ReportEntry {
  return {
    id,
    entry_number: 1,
    entry_date: date,
    description: id,
    status,
    source_type: source,
    event_type: event,
    period_id: season.id,
  };
}

function books(entries: ReportEntry[], lines: Record<string, ReportMovement[]>, period = season) {
  return { accounts: clubAccounts, entries, linesByEntry: lines, period };
}

function equityLines(report: ReturnType<typeof buildBalanceSheet>) {
  return report.funding.find((group) => group.title === "Fonds propres")?.lines || [];
}

describe("données complètes", () => {
  it("assemble plus de 1 000 écritures et plusieurs milliers de lignes, ouverture comprise", async () => {
    const entryCount = 1200;
    const opening = entry("opening", "2026-07-01", "validated", "opening", "opening");
    const rest = Array.from({ length: entryCount - 1 }, (_, index) => entry(`m-${index}`, "2026-08-01", "validated"));
    const allEntries = [...rest, opening];
    const lines: Record<string, ReportMovement[]> = {
      opening: [
        { accountId: "bank", debit: 1000, credit: 0 },
        { accountId: "equity", debit: 0, credit: 1000 },
      ],
    };
    for (const item of rest) {
      lines[item.id] = [
        { accountId: "bank", debit: 1, credit: 0 },
        { accountId: "revenue", debit: 0, credit: 1 },
      ];
    }
    const lineRows = allEntries.flatMap((item) => (lines[item.id] || []).map((line) => ({ entryId: item.id, ...line })));
    expect(lineRows.length).toBeGreaterThan(2000);

    const loadedEntries = await fetchAllPages(async (from, to) => ({
      data: allEntries.slice(from, to + 1),
      error: null,
    }));
    const loadedLines = await fetchAllPages(async (from, to) => ({
      data: lineRows.slice(from, to + 1),
      error: null,
    }));
    expect(loadedEntries).toHaveLength(entryCount);
    expect(loadedLines).toHaveLength(lineRows.length);
    expect(loadedEntries.some((item) => item.id === "opening")).toBe(true);
    expect(SUPABASE_PAGE_SIZE).toBe(1000);

    const linesByEntry: Record<string, ReportMovement[]> = {};
    for (const line of loadedLines) {
      const list = linesByEntry[line.entryId] ?? [];
      list.push({ accountId: line.accountId, debit: line.debit, credit: line.credit });
      linesByEntry[line.entryId] = list;
    }
    const report = buildBalanceSheet(books(loadedEntries, linesByEntry));
    expect(report.assetTotal).toBe(1000 + (entryCount - 1));
    expect(report.gap).toBe(0);
    expect(equityLines(report).some((line) => line.number === "2800" && line.amount === 1000)).toBe(true);
  });
});

describe("bilan", () => {
  const opening = entry("opening", "2026-07-01", "validated", "opening", "opening");
  const revenue = entry("revenue", "2026-09-01", "validated");
  const expense = entry("expense", "2026-09-02", "validated", "expense", "payment_sent");
  const lines: Record<string, ReportMovement[]> = {
    opening: [
      { accountId: "bank", debit: 1000, credit: 0 },
      { accountId: "equity", debit: 0, credit: 1000 },
    ],
    revenue: [
      { accountId: "bank", debit: 200, credit: 0 },
      { accountId: "revenue", debit: 0, credit: 200 },
    ],
    expense: [
      { accountId: "expense", debit: 50, credit: 0 },
      { accountId: "bank", debit: 0, credit: 50 },
    ],
  };

  it("explique 1 150 d’actifs par la fortune et le résultat de 150", () => {
    const report = buildBalanceSheet(books([opening, revenue, expense], lines));
    const income = buildIncomeStatement(books([opening, revenue, expense], lines));
    expect(report.assetTotal).toBe(1150);
    expect(income.result).toBe(150);
    expect(equityLines(report)).toEqual(expect.arrayContaining([
      expect.objectContaining({ number: "2800", amount: 1000 }),
      expect.objectContaining({ number: "2979", amount: 150 }),
    ]));
    expect(report.fundingTotal).toBe(1150);
    expect(report.gap).toBe(0);
  });

  it("laisse un écart réel quand le mouvement n’est ni un fonds propre ni un résultat", () => {
    const orphan = entry("orphan", "2026-09-03", "validated");
    const report = buildBalanceSheet(books(
      [opening, orphan],
      {
        opening: lines.opening,
        orphan: [{ accountId: "bank", debit: 10, credit: 0 }],
      },
    ));
    expect(report.assetTotal).toBe(1010);
    expect(equityLines(report).some((line) => line.amount === 10)).toBe(false);
    expect(report.gap).toBe(10);
  });

  it("porte une perte, un produit débiteur et une charge créditrice dans les fonds propres", () => {
    const loss = buildBalanceSheet(books(
      [opening, expense],
      { opening: lines.opening, expense: lines.expense },
    ));
    expect(loss.assetTotal).toBe(950);
    expect(equityLines(loss).find((line) => line.number === "2979")?.amount).toBe(-50);
    expect(loss.gap).toBe(0);

    const debitRevenue = entry("returns", "2026-09-04", "validated");
    const debitReport = buildBalanceSheet(books(
      [opening, debitRevenue],
      {
        opening: lines.opening,
        returns: [
          { accountId: "revenue", debit: 30, credit: 0 },
          { accountId: "bank", debit: 0, credit: 30 },
        ],
      },
    ));
    expect(equityLines(debitReport).find((line) => line.number === "2979")?.amount).toBe(-30);
    expect(debitReport.gap).toBe(0);

    const creditExpense = entry("rebate", "2026-09-05", "validated");
    const creditReport = buildBalanceSheet(books(
      [opening, creditExpense],
      {
        opening: lines.opening,
        rebate: [
          { accountId: "bank", debit: 20, credit: 0 },
          { accountId: "expense", debit: 0, credit: 20 },
        ],
      },
    ));
    expect(equityLines(creditReport).find((line) => line.number === "2979")?.amount).toBe(20);
    expect(creditReport.gap).toBe(0);
  });

  it("inclut l’écriture extournée et sa contre-écriture, puis n’ajoute plus le résultat après report", () => {
    const original = entry("sale", "2026-09-10", "reversed");
    const reversal = entry("reversal", "2026-09-11", "validated", "manual", "reversal");
    const kept = entry("kept", "2026-09-12", "validated");
    const report = buildBalanceSheet(books(
      [opening, original, reversal, kept],
      {
        opening: lines.opening,
        sale: [
          { accountId: "bank", debit: 100, credit: 0 },
          { accountId: "revenue", debit: 0, credit: 100 },
        ],
        reversal: [
          { accountId: "revenue", debit: 100, credit: 0 },
          { accountId: "bank", debit: 0, credit: 100 },
        ],
        kept: lines.revenue,
      },
    ));
    expect(buildIncomeStatement(books(
      [opening, original, reversal, kept],
      {
        opening: lines.opening,
        sale: [
          { accountId: "bank", debit: 100, credit: 0 },
          { accountId: "revenue", debit: 0, credit: 100 },
        ],
        reversal: [
          { accountId: "revenue", debit: 100, credit: 0 },
          { accountId: "bank", debit: 0, credit: 100 },
        ],
        kept: lines.revenue,
      },
    )).result).toBe(200);
    expect(equityLines(report).find((line) => line.number === "2979")?.amount).toBe(200);

    const closed = entry("close", "2027-06-30", "validated", "period_close", "adjustment");
    const after = buildBalanceSheet(books(
      [opening, revenue, expense, closed],
      {
        ...lines,
        close: [
          { accountId: "revenue", debit: 200, credit: 0 },
          { accountId: "expense", debit: 0, credit: 50 },
          { accountId: "retained", debit: 0, credit: 150 },
        ],
      },
    ));
    expect(equityLines(after).find((line) => line.number === "2979")).toBeUndefined();
    expect(equityLines(after).find((line) => line.number === "2900")?.amount).toBe(150);
    expect(after.assetTotal).toBe(1150);
    expect(after.gap).toBe(0);
    expect(buildIncomeStatement(books(
      [opening, revenue, expense, closed],
      {
        ...lines,
        close: [
          { accountId: "revenue", debit: 200, credit: 0 },
          { accountId: "expense", debit: 0, credit: 50 },
          { accountId: "retained", debit: 0, credit: 150 },
        ],
      },
    )).result).toBe(150);
  });

  it("ajoute les résultats antérieurs non reportés sans les confondre avec l’exercice courant", () => {
    const oldRevenue = entry("old", "2026-05-01", "validated");
    const report = buildBalanceSheet(books([opening, oldRevenue, revenue], {
      opening: lines.opening,
      old: [
        { accountId: "bank", debit: 80, credit: 0 },
        { accountId: "revenue", debit: 0, credit: 80 },
      ],
      revenue: lines.revenue,
    }));
    expect(equityLines(report).find((line) => line.name === PRIOR_UNCLOSED_RESULT)?.amount).toBe(80);
    expect(equityLines(report).find((line) => line.number === "2979")?.amount).toBe(200);
    expect(report.assetTotal).toBe(1280);
    expect(report.gap).toBe(0);
  });
});

describe("clôture", () => {
  const period = season;
  const types = new Map([["revenue", "revenue"], ["expense", "expense"]]);

  function closeEntries(rows: Array<[string, string, string, string?]>): CloseEntry[] {
    return rows.map(([id, status, source, event]) => ({
      id,
      status,
      entryDate: "2026-09-01",
      periodId: period.id,
      sourceType: source,
      eventType: event || "payment_received",
    }));
  }

  function linesFor(spec: Record<string, CloseLine[]>): Record<string, CloseLine[]> {
    return spec;
  }

  it("solde un bénéfice, une perte, un résultat nul, un produit débiteur et une charge créditrice", () => {
    const profit = closingTransferLines([
      { accountId: "revenue", accountType: "revenue", debit: 0, credit: 200 },
      { accountId: "expense", accountType: "expense", debit: 50, credit: 0 },
    ], retained);
    expect(transferResultAmount(profit, retained)).toBe(150);
    expect(profit).toEqual([
      { account_id: "revenue", debit: 200, credit: 0 },
      { account_id: "expense", debit: 0, credit: 50 },
      { account_id: retained, debit: 0, credit: 150 },
    ]);

    const loss = closingTransferLines([
      { accountId: "expense", accountType: "expense", debit: 50, credit: 0 },
    ], retained);
    expect(transferResultAmount(loss, retained)).toBe(-50);
    expect(loss).toContainEqual({ account_id: retained, debit: 50, credit: 0 });

    const zero = closingTransferLines([
      { accountId: "revenue", accountType: "revenue", debit: 0, credit: 100 },
      { accountId: "expense", accountType: "expense", debit: 100, credit: 0 },
    ], retained);
    expect(transferResultAmount(zero, retained)).toBe(0);
    expect(zero).toHaveLength(2);
    expect(zero.reduce((sum, line) => sum + line.debit, 0)).toBe(100);
    expect(zero.reduce((sum, line) => sum + line.credit, 0)).toBe(100);

    const debitProduct = closingTransferLines([
      { accountId: "revenue", accountType: "revenue", debit: 30, credit: 0 },
    ], retained);
    expect(debitProduct).toEqual([
      { account_id: "revenue", debit: 0, credit: 30 },
      { account_id: retained, debit: 30, credit: 0 },
    ]);

    const creditCharge = closingTransferLines([
      { accountId: "expense", accountType: "expense", debit: 0, credit: 20 },
    ], retained);
    expect(creditCharge).toEqual([
      { account_id: "expense", debit: 20, credit: 0 },
      { account_id: retained, debit: 0, credit: 20 },
    ]);
  });

  it("prend l’extourne avec sa contre-écriture et remplace un ancien report différent", () => {
    const entries = closeEntries([
      ["sale", "reversed", "invoice"],
      ["reversal", "validated", "invoice", "reversal"],
      ["kept", "validated", "invoice"],
      ["old-close", "validated", "period_close", "adjustment"],
      ["pending", "pending", "invoice"],
      ["voided", "voided", "invoice"],
    ]);
    entries[3].sourceId = period.id;
    const lines = linesFor({
      sale: [{ accountId: "revenue", debit: 0, credit: 100 }],
      reversal: [{ accountId: "revenue", debit: 100, credit: 0 }],
      kept: [{ accountId: "revenue", debit: 0, credit: 200 }, { accountId: "expense", debit: 50, credit: 0 }],
      "old-close": [
        { accountId: "revenue", debit: 100, credit: 0 },
        { accountId: retained, debit: 0, credit: 100 },
      ],
      pending: [{ accountId: "revenue", debit: 0, credit: 999 }],
      voided: [{ accountId: "revenue", debit: 0, credit: 999 }],
    });
    const proposed = closingTransferLines(accumulatePnl(entries, lines, types, period), retained);
    expect(transferResultAmount(proposed, retained)).toBe(150);
    expect(sameTransferLines(lines["old-close"], proposed)).toBe(false);
    expect(proposed).toEqual([
      { account_id: "revenue", debit: 200, credit: 0 },
      { account_id: "expense", debit: 0, credit: 50 },
      { account_id: retained, debit: 0, credit: 150 },
    ]);
    const unchanged = closingTransferLines([
      { accountId: "revenue", accountType: "revenue", debit: 0, credit: 100 },
    ], retained);
    expect(sameTransferLines(lines["old-close"], unchanged)).toBe(true);
  });
});

describe("exercice suivant", () => {
  it("prolonge une saison juillet–juin d’une année", () => {
    const plan = planFollowingPeriod({ startsOn: "2026-07-01", endsOn: "2027-06-30" }, null);
    expect(plan).toEqual({
      action: "insert",
      startsOn: "2027-07-01",
      endsOn: "2028-06-30",
      label: "2027–2028",
    });
  });

  it("ne rouvre pas un exercice suivant déjà clôturé et n’en change pas les dates", () => {
    const existing = { startsOn: "2027-07-01", endsOn: "2027-12-31", status: "closed" };
    expect(planFollowingPeriod({ startsOn: "2026-07-01", endsOn: "2027-06-30" }, existing)).toEqual({ action: "keep" });
  });
});

describe("consultation et file", () => {
  it("refuse une écriture automatique sans accès au module, et exige un utilisateur pour une action humaine", () => {
    expect(inboxProcessingDecision({
      actor: "system",
      onboarded: true,
      canWrite: false,
      userId: null,
    })).toEqual({ ok: false, silent: true, reason: "Comptabilité inactive" });
    expect(inboxProcessingDecision({
      actor: "user",
      onboarded: true,
      canWrite: true,
      userId: null,
    })).toMatchObject({ ok: false, silent: false });
    expect(inboxProcessingDecision({
      actor: "user",
      onboarded: true,
      canWrite: true,
      userId: "gestionnaire",
    }).ok).toBe(true);
  });
});

const rpcCalls: string[] = [];
const rpcArgs: unknown[] = [];
const inboxWrites: string[] = [];
let addonActive = true;
let closeRpcFails = false;
const manyEntries = Array.from({ length: 1199 }, (_, index) => ({
  id: `id-${String(index + 1).padStart(4, "0")}`,
  entry_number: index + 2,
  entry_date: "2026-08-01",
  description: "Mouvement",
  amount: 1,
  direction: "in",
  source_type: "manual",
  source_id: null,
  event_type: "payment_received",
  status: "validated",
  party_name: null,
  reference: null,
  counter_account_id: null,
  category_account_id: null,
  reversal_of_entry_id: null,
  reversed_by_entry_id: null,
  period_id: "season",
  created_at: "2026-08-01T00:00:00Z",
  validated_at: "2026-08-01T00:00:00Z",
  entry_number_manual: false,
}));
manyEntries.push({
  id: "id-2000",
  entry_number: 1,
  entry_date: "2026-07-01",
  description: "Situation de départ",
  amount: 1000,
  direction: "opening",
  source_type: "opening",
  source_id: null,
  event_type: "opening",
  status: "validated",
  party_name: null,
  reference: null,
  counter_account_id: null,
  category_account_id: null,
  reversal_of_entry_id: null,
  reversed_by_entry_id: null,
  period_id: "season",
  created_at: "2026-07-01T00:00:00Z",
  validated_at: "2026-07-01T00:00:00Z",
  entry_number_manual: false,
});
const manyLines = manyEntries.flatMap((item) => item.source_type === "opening"
  ? [
    { entry_id: item.id, account_id: "bank", debit: 1000, credit: 0, line_order: 1 },
    { entry_id: item.id, account_id: "equity", debit: 0, credit: 1000, line_order: 2 },
  ]
  : [
    { entry_id: item.id, account_id: "bank", debit: 1, credit: 0, line_order: 1 },
    { entry_id: item.id, account_id: "revenue", debit: 0, credit: 1, line_order: 2 },
  ]);

function query(table: string) {
  const api = {
    select() { return api; },
    eq() { return api; },
    in() { return api; },
    order() { return api; },
    range(from: number, to: number) {
      const source = table === "accounting_entries" ? manyEntries : table === "accounting_entry_lines" ? manyLines : [];
      return Promise.resolve({ data: source.slice(from, to + 1), error: null });
    },
    maybeSingle() {
      if (table === "club_addons") {
        return Promise.resolve({
          data: addonActive ? { status: "active", current_period_end: null } : null,
          error: null,
        });
      }
      if (table === "accounting_settings") {
        return Promise.resolve({
          data: {
            onboarding_completed_at: "2026-07-01T00:00:00Z",
            start_date: "2026-07-01",
            auto_validate: false,
            start_mode: "from_today",
            history_import_status: "not_requested",
            numbering_notice: null,
          },
          error: null,
        });
      }
      if (table === "profiles") return Promise.resolve({ data: { is_founder: false }, error: null });
      return Promise.resolve({ data: null, error: null });
    },
    update() {
      inboxWrites.push(table);
      return api;
    },
    insert() {
      inboxWrites.push(table);
      return Promise.resolve({ error: null });
    },
    then(resolve: (value: { data: unknown; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
      const data = table === "accounting_accounts"
        ? clubAccounts.map((item) => ({
          id: item.id,
          number: item.number,
          name: item.name,
          account_type: item.accountType,
          account_class: item.accountClass,
          system_code: item.id === "equity" ? "equity" : item.id === "retained" ? "retained" : item.id === "result" ? "result" : item.id === "bank" ? "bank" : null,
          is_active: true,
          is_system: true,
        }))
        : table === "accounting_periods"
          ? [{ id: "season", label: "2026–2027", starts_on: "2026-07-01", ends_on: "2027-06-30", status: "open" }]
          : [];
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    },
  };
  return api;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { getUserById: async () => ({ data: { user: { email: "lecteur@club.example" } }, error: null }) } },
    rpc: async (name: string, args?: unknown) => {
      rpcCalls.push(name);
      rpcArgs.push(args ?? null);
      if (name === "accounting_close_period" && closeRpcFails) {
        return { data: null, error: { message: "Écriture de report déséquilibrée" } };
      }
      return { data: null, error: null };
    },
    from: (table: string) => query(table),
  }),
}));

describe("lecture du journal", () => {
  beforeEach(() => {
    rpcCalls.length = 0;
    inboxWrites.length = 0;
    addonActive = true;
  });

  it("charge toutes les pages, conserve l’ouverture, et ne crée aucune écriture", async () => {
    const { loadWorkspace } = await import("@/lib/accounting/service");
    const workspace = await loadWorkspace("club-lecture");
    expect(workspace.entries).toHaveLength(1200);
    expect(workspace.entries.some((item) => item.source_type === "opening")).toBe(true);
    expect(Object.values(workspace.linesByEntry).reduce((sum, lines) => sum + lines.length, 0)).toBe(manyLines.length);
    const report = buildBalanceSheet({
      accounts: workspace.accounts.map((item) => ({
        id: item.id,
        number: item.number,
        name: item.name,
        accountType: item.accountType,
        accountClass: item.accountClass,
      })),
      entries: workspace.entries.map((item) => ({
        id: String(item.id),
        entry_number: Number(item.entry_number),
        entry_date: String(item.entry_date),
        description: String(item.description),
        status: String(item.status),
        source_type: String(item.source_type),
        event_type: String(item.event_type),
      })),
      linesByEntry: workspace.linesByEntry,
      period: { id: "season", label: "2026–2027", startsOn: "2026-07-01", endsOn: "2027-06-30" },
    });
    expect(report.assetTotal).toBe(1000 + 1199);
    expect(report.gap).toBe(0);
    expect(rpcCalls).toEqual([]);
    expect(inboxWrites).toEqual([]);
  });

  it("n’écrit rien pour un traitement système quand le module n’est pas actif", async () => {
    addonActive = false;
    const { processAccountingInbox } = await import("@/lib/accounting/service");
    const result = await processAccountingInbox("club-lecture", null, "system");
    expect(result).toEqual({ posted: 0, created: 0, already: 0, voided: 0, held: [] });
    expect(rpcCalls).toEqual([]);
    expect(inboxWrites).toEqual([]);
  });
});

describe("clôture atomique", () => {
  beforeEach(() => {
    rpcCalls.length = 0;
    rpcArgs.length = 0;
    inboxWrites.length = 0;
    addonActive = true;
    closeRpcFails = false;
  });

  it("refuse une clôture sans confirmation et n'appelle pas la base", async () => {
    const { closePeriod } = await import("@/lib/accounting/service");
    await expect(closePeriod({
      clubId: "club-lecture",
      userId: "gestionnaire",
      periodId: "season",
      transferResult: false,
      confirmed: false,
    })).rejects.toThrow(/confirmation/);
    expect(rpcCalls).toEqual([]);
    expect(inboxWrites).toEqual([]);
  });

  it("passe le report et l'exercice suivant dans un seul appel, sans écriture séparée", async () => {
    const { closePeriod } = await import("@/lib/accounting/service");
    await closePeriod({
      clubId: "club-lecture",
      userId: "gestionnaire",
      periodId: "season",
      transferResult: true,
      confirmed: true,
    });
    expect(rpcCalls.filter((name) => name === "accounting_close_period")).toEqual(["accounting_close_period"]);
    expect(rpcCalls).not.toContain("accounting_void_journal_entry");
    expect(inboxWrites).not.toContain("accounting_periods");
    expect(inboxWrites).not.toContain("accounting_entries");
    const payload = rpcArgs.find((args) => args && typeof args === "object" && "p_next_start" in (args as object)) as {
      p_transfer: boolean;
      p_next_start: string;
      p_next_end: string;
      p_lines: Array<{ account_id: string; debit: number; credit: number }>;
    };
    expect(payload.p_transfer).toBe(true);
    expect(payload.p_next_start).toBe("2027-07-01");
    expect(payload.p_next_end).toBe("2028-06-30");
    const debit = payload.p_lines.reduce((sum, line) => sum + line.debit, 0);
    const credit = payload.p_lines.reduce((sum, line) => sum + line.credit, 0);
    expect(debit).toBe(credit);
    expect(debit).toBeGreaterThan(0);
  });

  it("n'enregistre rien dans l'exercice si l'appel de clôture échoue", async () => {
    closeRpcFails = true;
    const { closePeriod } = await import("@/lib/accounting/service");
    await expect(closePeriod({
      clubId: "club-lecture",
      userId: "gestionnaire",
      periodId: "season",
      transferResult: true,
      confirmed: true,
    })).rejects.toThrow(/déséquilibrée/);
    expect(inboxWrites).not.toContain("accounting_periods");
    expect(inboxWrites).not.toContain("accounting_entries");
  });
});
