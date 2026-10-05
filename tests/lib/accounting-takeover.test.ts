import { describe, expect, it } from "vitest";
import { accumulatePnl, closingTransferLines, planOpenFollowingPeriod } from "@/lib/accounting/closePeriod";
import { linesAreBalanced } from "@/lib/accounting/engine";
import { coverageForPeriod } from "@/lib/accounting/onboarding";
import { officialIncomeBalances, buildBalanceSheet, buildIncomeStatement, type ReportAccount, type ReportEntry } from "@/lib/accounting/reports";
import {
  TAKEOVER_CSV_TEMPLATE,
  annualContinuity,
  chartTakeoverAccounts,
  importReplay,
  journalForSubmission,
  legacyNumberMap,
  parseTakeoverCsv,
  planOpenItemSettlement,
  planOpeningCorrection,
  planTakeover,
  takeoverInputFromBody,
  takeoverRpcPayload,
  type TakeoverJournalEntry,
} from "@/lib/accounting/takeover";

const accounts = chartTakeoverAccounts();

function plan(input: Omit<Parameters<typeof planTakeover>[0], "accounts">) {
  const result = planTakeover({ ...input, accounts });
  if (!result.ok) throw new Error(result.message);
  return result;
}

function books(input: {
  period: { startsOn: string; endsOn: string };
  opening?: ReturnType<typeof plan>;
  extra?: ReportEntry[];
  extraLines?: Record<string, Array<{ accountId: string; debit: number; credit: number }>>;
}) {
  const reportAccounts: ReportAccount[] = accounts.map((account) => ({
    id: account.code,
    number: account.number,
    name: account.name,
    accountType: account.accountType,
    accountClass: Number(account.number[0]) || 1,
  }));
  const entries: ReportEntry[] = [];
  const linesByEntry: Record<string, Array<{ accountId: string; debit: number; credit: number }>> = {};
  const opening = input.opening;
  if (opening?.openingLines.length) {
    entries.push({ id: "opening", entry_number: 1, entry_date: opening.openingDate, description: opening.openingDescription, status: "validated", source_type: "opening", event_type: "opening" });
    linesByEntry.opening = opening.openingLines.map((line) => ({ accountId: line.accountCode, debit: line.debit, credit: line.credit }));
  }
  opening?.journal.forEach((entry, index) => {
    const id = `j-${index}`;
    entries.push({ id, entry_number: index + 2, entry_date: entry.date, description: entry.label, status: "validated", reference: entry.piece, source_type: entry.sourceType || "import", event_type: "import" });
    linesByEntry[id] = entry.lines.map((line) => ({ accountId: line.code, debit: line.debit, credit: line.credit }));
  });
  if (opening?.rollup) {
    entries.push({ id: "rollup", entry_number: 50, entry_date: opening.rollup.date, description: opening.rollup.description, status: "validated", source_type: "history_rollup", event_type: "history_rollup" });
    linesByEntry.rollup = opening.rollup.lines.map((line) => ({ accountId: line.accountCode, debit: line.debit, credit: line.credit }));
  }
  for (const entry of input.extra ?? []) entries.push(entry);
  Object.assign(linesByEntry, input.extraLines);
  return { accounts: reportAccounts, entries, linesByEntry, period: { ...input.period, label: "test" } };
}

const year = { startsOn: "2027-01-01", endsOn: "2027-12-31" };
const season = { startsOn: "2026-07-01", endsOn: "2027-06-30" };

describe("reprise au 1er janvier", () => {
  it("équilibre trésorerie, dettes et fonds propres sans écrire au 2800 tout seul", () => {
    const opening = plan({
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-01-01",
      balances: [
        { code: "bank", amount: 8000 },
        { code: "creditors", amount: 2000 },
        { code: "equity", amount: 6000 },
      ],
    });
    expect(opening.equityProposalApplied).toBe(false);
    expect(linesAreBalanced(opening.openingLines)).toBe(true);
    expect(opening.journal).toEqual([]);
    const sheet = buildBalanceSheet(books({ period: year, opening }));
    expect(sheet.assetTotal).toBe(8000);
    expect(sheet.fundingTotal).toBe(8000);
    expect(sheet.gap).toBe(0);
    expect(buildIncomeStatement(books({ period: year, opening })).result).toBe(0);
  });

  it("propose les fonds propres calculés et attend une confirmation", () => {
    const refused = planTakeover({
      accounts,
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-01-01",
      balances: [{ code: "bank", amount: 1000 }, { code: "creditors", amount: 400 }],
    });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.equityProposal?.number).toBe("2800");
      expect(refused.equityProposal?.amount).toBe(600);
      expect(refused.message).toContain("Confirmez");
    }
    const accepted = plan({
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-01-01",
      confirmEquityProposal: true,
      balances: [{ code: "bank", amount: 1000 }, { code: "creditors", amount: 400 }],
    });
    expect(accepted.equityProposalApplied).toBe(true);
    expect(accepted.openingLines.find((line) => line.accountCode === "equity")?.credit).toBe(600);
  });
});

describe("reprise en cours d'année", () => {
  const history: TakeoverJournalEntry[] = [{
    date: "2027-03-01",
    piece: "FAC-1",
    label: "Cotisation",
    origin: "EXT-1",
    lines: [
      { code: "bank", debit: 500, credit: 0 },
      { code: "membership", debit: 0, credit: 500 },
    ],
  }];

  it("reprend l'ouverture de janvier et les écritures jusqu'en juin", () => {
    const opening = plan({
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 1000 }, { code: "equity", amount: 1000 }],
      journal: history,
    });
    expect(opening.openingDate).toBe("2027-01-01");
    const view = books({ period: year, opening });
    expect(buildIncomeStatement(view).productTotal).toBe(500);
    expect(buildBalanceSheet(view).assetTotal).toBe(1500);
    expect(buildBalanceSheet(view).gap).toBe(0);
    expect(officialIncomeBalances(view).get("membership")).toBe(500);
  });

  it("intègre les cumuls de juillet au résultat, au réalisé et à la clôture", () => {
    const opening = plan({
      mode: "from_date",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 1500 }, { code: "equity", amount: 1000 }],
      cumulatives: [{ code: "membership", amount: 500 }],
    });
    expect(opening.openingDate).toBe("2027-06-30");
    expect(opening.rollup?.description).toContain("agrégée");
    expect(opening.journal).toEqual([]);
    const view = books({ period: year, opening });
    const income = buildIncomeStatement(view);
    expect(income.productTotal).toBe(500);
    expect(income.result).toBe(500);
    expect(buildBalanceSheet(view).gap).toBe(0);
    expect(officialIncomeBalances(view).get("membership")).toBe(500);
    const balances = accumulatePnl(
      view.entries.map((entry) => ({ id: entry.id, status: entry.status, entryDate: entry.entry_date, sourceType: entry.source_type, eventType: entry.event_type })),
      view.linesByEntry,
      new Map(view.accounts.map((account) => [account.id, account.accountType])),
      year,
    );
    const transfer = closingTransferLines(balances, "retained");
    expect(transfer.find((line) => line.account_id === "membership")?.debit).toBe(500);
    expect(transfer.find((line) => line.account_id === "retained")?.credit).toBe(500);
  });

  it("annonce un résultat partiel quand les cumuls manquent", () => {
    const opening = plan({
      mode: "from_date",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 1500 }, { code: "equity", amount: 1500 }],
    });
    expect(opening.incomeAnnual).toBe(false);
    expect(opening.coverageNote).toContain("seulement");
    expect(opening.rollup).toBeNull();
    const income = buildIncomeStatement({
      ...books({ period: year, opening }),
      detailFrom: "2027-07-01",
      coverageNote: opening.coverageNote,
    });
    expect(income.from).toBe("2027-07-01");
    expect(income.result).toBe(0);
    expect(income.coverageNote).toContain("année entière");
  });

  it("refuse de compter deux fois les mêmes mouvements", () => {
    const mixed = planTakeover({
      accounts,
      mode: "from_date",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 1500 }, { code: "equity", amount: 1500 }],
      journal: history,
    });
    expect(mixed.ok).toBe(false);
    const cumulAndJournal = planTakeover({
      accounts,
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 1000 }, { code: "equity", amount: 1000 }],
      journal: history,
      cumulatives: [{ code: "membership", amount: 500 }],
    });
    expect(cumulAndJournal.ok).toBe(false);
    const previousYear = planTakeover({
      accounts,
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-01-01",
      balances: [{ code: "bank", amount: 1000 }, { code: "equity", amount: 1000 }],
      journal: history,
    });
    expect(previousYear.ok).toBe(false);
  });
});

describe("import", () => {
  it("relit une écriture composée et refuse un second lot", () => {
    const parsed = parseTakeoverCsv(TAKEOVER_CSV_TEMPLATE);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0].lines).toHaveLength(2);
    expect(parsed.entries[0].piece).toBe("FAC-12");
    const opening = plan({
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 0 }, { code: "equity", amount: 0 }],
      journal: parsed.entries,
    });
    expect(opening.journal[0].idempotencyKey).toBe("import:EXT-12");
    expect(importReplay({ fingerprint: opening.fingerprint, appliedFingerprints: [opening.fingerprint] })).toBe("already");
    expect(importReplay({ fingerprint: "autre", appliedFingerprints: [opening.fingerprint] })).toBe("refuse");
  });

  it("signale une date, un compte ou un écart", () => {
    expect(parseTakeoverCsv("date;piece;libelle;compte;debit;credit;origine\nhier;A;x;1020;10;0;O1").ok).toBe(false);
    expect(parseTakeoverCsv("date;piece;libelle;compte;debit;credit;origine\n2027-01-31;A;x;1020;10;0;O1\n2027-01-31;A;x;1020;0;9;O1").ok).toBe(false);
    const unknown = planTakeover({
      accounts,
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 10 }, { code: "equity", amount: 10 }],
      journal: [{ date: "2027-02-01", piece: "A", label: "x", origin: "O1", lines: [{ code: "9999", debit: 10, credit: 0 }, { code: "bank", debit: 0, credit: 10 }] }],
    });
    expect(unknown.ok).toBe(false);
  });

  it("garde la clé d'une opération déjà connue pour bloquer une deuxième intégration", () => {
    const opening = plan({
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-07-01",
      balances: [{ code: "bank", amount: 100 }, { code: "equity", amount: 100 }],
      journal: [{
        date: "2027-02-01",
        piece: "F-1",
        label: "Facture",
        origin: "EXT",
        sourceType: "invoice",
        sourceId: "11111111-1111-4111-8111-111111111111",
        lines: [
          { code: "bank", debit: 80, credit: 0 },
          { code: "membership", debit: 0, credit: 80 },
        ],
      }],
    });
    expect(opening.journal[0].idempotencyKey).toBe("invoice:11111111-1111-4111-8111-111111111111:payment_received");
  });
});

describe("sommes reprises et continuité", () => {
  it("solde une créance reprise sans deuxième produit", () => {
    const opening = plan({
      mode: "full_period",
      periodStart: year.startsOn,
      periodEnd: year.endsOn,
      takeoverDate: "2027-01-01",
      balances: [
        { code: "bank", amount: 1000 },
        { code: "debtors", amount: 200 },
        { code: "equity", amount: 1200 },
      ],
      openItems: [{ code: "debtors", label: "Sponsor Dupont", amount: 200, side: "receivable" }],
    });
    const settlement = planOpenItemSettlement({
      item: opening.openItems[0],
      financialCode: "bank",
      amount: 200,
    });
    expect(settlement.ok).toBe(true);
    if (!settlement.ok) return;
    expect(settlement.lines.some((line) => line.accountCode === "membership")).toBe(false);
    const view = books({
      period: year,
      opening,
      extra: [{ id: "pay", entry_number: 3, entry_date: "2027-02-01", description: "Règlement", status: "validated", source_type: "opening_settlement", event_type: "settlement" }],
      extraLines: { pay: settlement.lines.map((line) => ({ accountId: line.accountCode, debit: line.debit, credit: line.credit })) },
    });
    expect(buildIncomeStatement(view).result).toBe(0);
    const bank = view.linesByEntry.pay.find((line) => line.accountId === "bank");
    const debtors = view.linesByEntry.pay.find((line) => line.accountId === "debtors");
    expect(bank?.debit).toBe(200);
    expect(debtors?.credit).toBe(200);
  });

  it("ouvre l'année suivante sans deuxième ouverture, puis suit une correction", () => {
    const first = plan({
      mode: "full_period",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      takeoverDate: "2026-01-01",
      balances: [{ code: "bank", amount: 1000 }, { code: "equity", amount: 1000 }],
    });
    const next = { startsOn: "2027-01-01", endsOn: "2027-12-31" };
    expect(planOpenFollowingPeriod({ startsOn: "2026-01-01", endsOn: "2026-12-31" }, []).action).toBe("insert");
    expect(annualContinuity("open")).toMatchObject({ copyOpening: false, provisional: true });
    const corrected = plan({
      mode: "full_period",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      takeoverDate: "2026-01-01",
      balances: [{ code: "bank", amount: 1100 }, { code: "equity", amount: 1100 }],
    });
    expect(planOpeningCorrection({ openingEntryId: "opening", periodStatus: "open" })).toEqual({ ok: true, entryId: "opening" });
    expect(planOpeningCorrection({ openingEntryId: null, periodStatus: "open" }).ok).toBe(false);
    expect(planOpeningCorrection({ openingEntryId: "opening", periodStatus: "closed" }).ok).toBe(false);
    const before = buildBalanceSheet(books({ period: next, opening: first }));
    const after = buildBalanceSheet(books({ period: next, opening: corrected }));
    expect(before.assetTotal).toBe(1000);
    expect(after.assetTotal).toBe(1100);
    expect(buildIncomeStatement(books({ period: next, opening: corrected })).result).toBe(0);
    expect(coverageForPeriod({
      period: next,
      accountingStartDate: "2026-01-01",
      priorOpen: true,
    }).note).toContain("provisoires");
  });

  it("respecte un exercice juillet-juin", () => {
    const opening = plan({
      mode: "full_period",
      periodStart: season.startsOn,
      periodEnd: season.endsOn,
      takeoverDate: "2027-01-01",
      balances: [{ code: "bank", amount: 400 }, { code: "equity", amount: 400 }],
      journal: [{
        date: "2026-09-01",
        piece: "S-1",
        label: "Cotisation de saison",
        origin: "SAISON",
        lines: [
          { code: "bank", debit: 250, credit: 0 },
          { code: "membership", debit: 0, credit: 250 },
        ],
      }],
    });
    expect(opening.openingDate).toBe("2026-07-01");
    const view = books({ period: season, opening });
    expect(buildIncomeStatement(view).productTotal).toBe(250);
    expect(buildBalanceSheet(view).gap).toBe(0);
    expect(planOpenFollowingPeriod(season, []).action).toBe("insert");
  });
});

describe("parcours sans anciennes écritures et anciens numéros", () => {
  const loaded: TakeoverJournalEntry[] = [{
    date: "2026-02-01",
    piece: "A",
    label: "Apport",
    origin: "1",
    lines: [
      { code: "1020", debit: 500, credit: 0 },
      { code: "2850", debit: 0, credit: 500 },
    ],
  }];

  it("n'envoie plus les écritures chargées après le passage au parcours sans historique", () => {
    expect(journalForSubmission("full_period", loaded)).toHaveLength(1);
    expect(journalForSubmission("fresh", loaded)).toEqual([]);
    const input = takeoverInputFromBody({
      takeoverMode: "fresh",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      takeoverDate: "2026-01-01",
      confirmZeroOpening: true,
      journal: loaded,
      cumulatives: [{ code: "membership", amount: 40 }],
      legacyNumbers: { equity: "2850" },
      balances: [
        { code: "bank", amount: 200, legacyNumber: "1999" },
        { code: "equity", amount: 200 },
      ],
    });
    if ("error" in input) throw new Error(input.error);
    expect(input.journal).toEqual([]);
    expect(input.cumulatives).toEqual([]);
    expect(input.balances.every((row) => row.legacyNumber === undefined)).toBe(true);
    const planned = planTakeover(input);
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.journal).toEqual([]);
    expect(takeoverRpcPayload("club", "user", input, planned).journal).toEqual([]);
  });

  it("affecte l'ancien numéro au compte Obillz et refuse un doublon", () => {
    const duplicate = legacyNumberMap(accounts, { equity: "2850", retained: "2850" });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.message).toContain("2850");

    const input = takeoverInputFromBody({
      takeoverMode: "full_period",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      takeoverDate: "2026-07-01",
      balances: [
        { code: "bank", amount: 500 },
        { code: "equity", amount: 500 },
      ],
      legacyNumbers: { equity: "2850" },
      journal: loaded,
    });
    if ("error" in input) throw new Error(input.error);
    expect(input.journal?.[0].lines[1].code).toBe("equity");
    const planned = planTakeover(input);
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.journal[0].lines[1].code).toBe("equity");

    const refused = takeoverInputFromBody({
      takeoverMode: "full_period",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      takeoverDate: "2026-07-01",
      legacyNumbers: { equity: "2850", retained: "2850" },
      journal: [],
    });
    expect("error" in refused && refused.error).toContain("2850");
  });
});
