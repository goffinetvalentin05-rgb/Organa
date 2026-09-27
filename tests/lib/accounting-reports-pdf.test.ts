import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  buildAccountExtract,
  buildBalanceSheet,
  buildIncomeStatement,
  buildJournalReport,
  JOURNAL_SCOPE,
  LEDGER_SCOPE,
} from "@/lib/accounting/reports";
import { renderAccountingReportPdf } from "@/lib/pdf/AccountingReportPdf";
import type { ReportAccount, ReportEntry, ReportMovement, ReportPeriod } from "@/lib/accounting/reports";

const period: ReportPeriod = {
  id: "2026",
  label: "2026",
  startsOn: "2026-09-24",
  endsOn: "2026-12-31",
};

const accounts: ReportAccount[] = [
  { id: "caisse", number: "1000", name: "Caisse", accountType: "asset", accountClass: 1 },
  { id: "courant", number: "1020", name: "Compte courant", accountType: "asset", accountClass: 1 },
  { id: "epargne", number: "1021", name: "Compte épargne", accountType: "asset", accountClass: 1 },
  { id: "fortune", number: "2800", name: "Fortune de l’association", accountType: "equity", accountClass: 2 },
  { id: "cotisations", number: "3000", name: "Cotisations membres", accountType: "revenue", accountClass: 3 },
  { id: "admin", number: "6500", name: "Frais administratifs", accountType: "expense", accountClass: 6 },
];

const openingLines: Record<string, ReportMovement[]> = {
  opening: [
    { accountId: "courant", debit: 1000, credit: 0 },
    { accountId: "epargne", debit: 2000, credit: 0 },
    { accountId: "caisse", debit: 200, credit: 0 },
    { accountId: "fortune", debit: 0, credit: 3200 },
  ],
};

const openingEntry: ReportEntry = {
  id: "opening",
  entry_number: 1,
  entry_date: "2026-09-24",
  description: "Situation de départ",
  status: "validated",
  reference: null,
  party_name: null,
  source_type: "opening",
  event_type: "opening",
};

const screenshotBooks = {
  accounts,
  entries: [openingEntry],
  linesByEntry: openingLines,
  period,
};

const extendedEntries: ReportEntry[] = [
  openingEntry,
  {
    id: "cotisation",
    entry_number: 4,
    entry_date: "2026-10-15",
    description: "Cotisations octobre",
    status: "validated",
    reference: "F-14",
    party_name: "Membres",
    source_type: "manual",
  },
  {
    id: "frais",
    entry_number: 5,
    entry_date: "2026-10-20",
    description: "Frais de secrétariat",
    status: "validated",
    reference: "P-9",
    party_name: "",
    source_type: "manual",
  },
  {
    id: "attente",
    entry_number: 7,
    entry_date: "2026-10-02",
    description: "Écriture à contrôler",
    status: "pending",
    reference: "Pièce",
    party_name: "Remarque",
    source_type: "manual",
  },
  {
    id: "retiree",
    entry_number: 8,
    entry_date: "2026-10-01",
    description: "Écriture retirée",
    status: "voided",
    source_type: "manual",
  },
];

const extendedLines: Record<string, ReportMovement[]> = {
  ...openingLines,
  cotisation: [
    { accountId: "courant", debit: 500, credit: 0 },
    { accountId: "cotisations", debit: 0, credit: 500 },
  ],
  frais: [
    { accountId: "admin", debit: 80, credit: 0 },
    { accountId: "courant", debit: 0, credit: 80 },
  ],
  attente: [
    { accountId: "courant", debit: 20, credit: 0 },
    { accountId: "admin", debit: 0, credit: 20 },
  ],
  retiree: [
    { accountId: "caisse", debit: 15, credit: 0 },
    { accountId: "fortune", debit: 0, credit: 15 },
  ],
};

const extendedBooks = {
  accounts,
  entries: extendedEntries.filter((entry) => entry.entry_date >= period.startsOn),
  linesByEntry: extendedLines,
  period,
};

const club = { name: "Club de démonstration", logoUrl: null };
const generatedOn = "2026-09-27";

function extractPdfText(pdf: Buffer): string {
  const latin = pdf.toString("latin1");
  const chunks: Buffer[] = [];
  const marker = /(?<!end)stream\r?\n/g;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(latin))) {
    const start = match.index + match[0].length;
    const end = latin.indexOf("endstream", start);
    if (end < 0) break;
    let slice = Buffer.from(latin.slice(start, end), "latin1");
    if (slice[slice.length - 1] === 0x0a) slice = slice.subarray(0, -1);
    if (slice[slice.length - 1] === 0x0d) slice = slice.subarray(0, -1);
    try {
      chunks.push(zlib.inflateSync(slice));
    } catch {
      chunks.push(slice);
    }
  }
  const content = Buffer.concat(chunks).toString("latin1");
  const texts: string[] = [];
  const groups = content.match(/\[[^\]]*\]\s*TJ/g) || [];
  for (const group of groups) {
    const parts = [...group.matchAll(/<([0-9A-Fa-f]+)>/g)].map((item) => Buffer.from(item[1], "hex").toString("latin1"));
    if (parts.length) texts.push(parts.join(""));
  }
  const literal = /\((?:\\.|[^\\)])*\)/g;
  let found: RegExpExecArray | null;
  while ((found = literal.exec(content))) {
    texts.push(decodePdfLiteral(found[0].slice(1, -1)));
  }
  return texts.join("\n");
}

function decodePdfLiteral(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)));
}

describe("rapports comptables", () => {
  it("établit le bilan de la capture : 3 200 d’actifs et 3 200 de fonds propres", () => {
    const report = buildBalanceSheet(screenshotBooks);
    expect(report.assetTotal).toBe(3200);
    expect(report.fundingTotal).toBe(3200);
    expect(report.gap).toBe(0);
    expect(report.assets.flatMap((group) => group.lines).map((line) => line.number)).toEqual(["1000", "1020", "1021"]);
    expect(report.funding.find((group) => group.title === "Fonds propres")?.total).toBe(3200);
    expect(report.funding.find((group) => group.title === "Fonds étrangers (dettes)")?.total).toBe(0);
  });

  it("limite le compte de résultat aux charges et aux produits", () => {
    const report = buildIncomeStatement(extendedBooks);
    const numbers = [...report.charges, ...report.products].flatMap((group) => group.lines.map((line) => line.number));
    expect(numbers).toEqual(["6500", "3000"]);
    expect(report.chargeTotal).toBe(80);
    expect(report.productTotal).toBe(500);
    expect(report.result).toBe(420);
    expect(report.outcome).toEqual({ label: "Bénéfice de l'exercice", amount: 420 });
    expect(numbers).not.toContain("1000");
    expect(numbers).not.toContain("2800");
    const balance = buildBalanceSheet(extendedBooks);
    const equity = balance.funding.find((group) => group.title === "Fonds propres");
    expect(equity?.lines.some((line) => line.number === "2979" && line.amount === report.result)).toBe(true);
    expect(balance.assetTotal).toBe(3620);
    expect(balance.fundingTotal).toBe(3620);
    expect(balance.gap).toBe(0);
  });

  it("détaille chaque ligne d’une écriture composée et annonce les statuts inclus", () => {
    const journalBooks = {
      accounts,
      entries: extendedEntries.filter((entry) => entry.entry_date >= period.startsOn && entry.entry_date <= period.endsOn),
      linesByEntry: extendedLines,
      period,
    };
    const report = buildJournalReport(journalBooks);
    const opening = report.rows.filter((row) => row.entryId === "opening");
    expect(opening).toHaveLength(3);
    expect(opening.map((row) => row.debit)).toEqual([
      "1020 Compte courant",
      "1021 Compte épargne",
      "1000 Caisse",
    ]);
    expect(report.scope).toBe(JOURNAL_SCOPE);
    expect(report.rows.some((row) => row.status === "Écartée" || row.entryId === "retiree")).toBe(false);
    expect(report.rows.some((row) => row.status === "À vérifier" && row.entryId === "attente")).toBe(true);
    expect(report.lineCount).toBe(report.rows.length);
    const keys = report.rows.map((row) => `${row.entryId}:${row.lineIndex}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ignore une écriture composée retirée, même si ses lignes existent encore", () => {
    const report = buildJournalReport({
      accounts,
      entries: [
        ...extendedEntries,
        {
          id: "composee-retiree",
          entry_number: 9,
          entry_date: "2026-10-05",
          description: "Composée retirée",
          status: "voided",
          period_id: period.id,
          source_type: "manual",
        },
      ],
      linesByEntry: {
        ...extendedLines,
        "composee-retiree": [
          { accountId: "caisse", debit: 10, credit: 0 },
          { accountId: "courant", debit: 20, credit: 0 },
          { accountId: "fortune", debit: 0, credit: 30 },
        ],
      },
      period,
    });
    expect(report.rows.some((row) => row.entryId === "composee-retiree" || row.label === "Composée retirée")).toBe(false);
    expect(report.lineCount).toBe(report.rows.length);
  });

  it("n’extrait que le compte choisi", () => {
    const report = buildAccountExtract({ ...extendedBooks, accountId: "courant" });
    expect("error" in report).toBe(false);
    if ("error" in report) return;
    expect(report.accountNumber).toBe("1020");
    expect(report.opening).toBe(0);
    expect(report.movements.map((row) => row.debit || row.credit)).toEqual([1000, 500, 80]);
    expect(report.closing).toBe(1420);
    expect(report.scope).toBe(LEDGER_SCOPE);
    expect(report.movements.some((row) => row.counterpart.includes("Caisse") || row.label.includes("Caisse"))).toBe(false);
  });
});

describe("PDF des rapports", () => {
  it("écrit quatre PDF dont le texte correspond au type demandé", async () => {
    const balance = buildBalanceSheet(screenshotBooks);
    const income = buildIncomeStatement(extendedBooks);
    const journal = buildJournalReport({
      accounts,
      entries: extendedEntries.filter((entry) => entry.entry_date >= period.startsOn && entry.entry_date <= period.endsOn),
      linesByEntry: extendedLines,
      period,
    });
    const ledger = buildAccountExtract({ ...extendedBooks, accountId: "courant" });
    if ("error" in ledger) throw new Error(ledger.error);

    const [balancePdf, incomePdf, journalPdf, ledgerPdf] = await Promise.all([
      renderAccountingReportPdf({ kind: "balance", report: balance, club, generatedOn }),
      renderAccountingReportPdf({ kind: "result", report: income, club, generatedOn }),
      renderAccountingReportPdf({ kind: "journal", report: journal, club, generatedOn }),
      renderAccountingReportPdf({ kind: "ledger", report: ledger, club, generatedOn }),
    ]);

    const balanceText = extractPdfText(balancePdf);
    const incomeText = extractPdfText(incomePdf);
    const journalText = extractPdfText(journalPdf);
    const ledgerText = extractPdfText(ledgerPdf);

    expect(balanceText).toContain("Bilan");
    expect(balanceText).toContain("Actifs");
    expect(balanceText).toContain("Fonds propres");
    expect(balanceText).toContain("3'200.00");
    expect(balanceText).not.toContain("Compte de résultat");
    expect(balanceText).not.toContain("Produits validés");
    expect(balanceText).toContain("Club de démonstration");
    expect(balanceText).toMatch(/\d+ \/ \d+/);

    expect(incomeText).toContain("Compte de résultat");
    expect(incomeText).toContain("Charges");
    expect(incomeText).toContain("Produits");
    expect(incomeText).toContain("Cotisations membres");
    expect(incomeText).toContain("Frais administratifs");
    expect(incomeText).not.toContain("Caisse");
    expect(incomeText).not.toContain("Fortune");
    expect(incomeText).toContain("Total des produits");
    expect(incomeText).toContain("Total des charges");
    expect(incomeText).toContain("Bénéfice de l'exercice");
    expect(incomeText).toContain("420.00");

    expect(journalText).toContain("Journal");
    expect(journalText).toContain(JOURNAL_SCOPE);
    expect(journalText).toContain("Situation de départ");
    expect(journalText).toContain("même écriture");
    expect(journalText).toContain("1000");
    expect(journalText).toContain("Caisse");
    expect(journalText).toContain("Compte courant");
    expect(journalText).toContain("Compte épargne");
    expect(journalText).toContain("Fortune");
    expect(journalText.match(/même écriture/g)?.length).toBe(2);
    expect(journalText).not.toContain("Écriture retirée");
    expect(journalText).not.toContain("Écartée");
    expect(journalText).toContain("À vérifier");
    expect(journalText).toContain("Écriture à contrôler");

    expect(ledgerText).toContain("Extrait de compte");
    expect(ledgerText).toContain("1020");
    expect(ledgerText).toContain("Compte courant");
    expect(ledgerText).toContain("Solde initial");
    expect(ledgerText).toContain("Solde final");
    expect(ledgerText).toContain("1'420.00");
    expect(ledgerText).toContain("Cotisations octobre");
    expect(ledgerText).not.toContain("Caisse");
    expect(ledgerText).not.toContain("Compte épargne");

    const directory = path.join(process.cwd(), "tmp", "rapports-comptables");
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, "bilan.pdf"), balancePdf);
    writeFileSync(path.join(directory, "compte-de-resultat.pdf"), incomePdf);
    writeFileSync(path.join(directory, "journal.pdf"), journalPdf);
    writeFileSync(path.join(directory, "extrait-1020.pdf"), ledgerPdf);
  });
});
