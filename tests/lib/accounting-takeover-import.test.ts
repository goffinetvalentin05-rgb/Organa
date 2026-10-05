import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildBalanceSheet, buildIncomeStatement } from "@/lib/accounting/reports";
import { chartTakeoverAccounts, importReplay, planTakeover, toIsoDate } from "@/lib/accounting/takeover";
import { buildSimpleJournalWorkbook, buildTakeoverCsv, buildTakeoverWorkbook, classifySheet, readTakeoverFile, suggestColumnMap, SIMPLE_JOURNAL_HEADERS } from "@/lib/accounting/takeoverImport";

const accounts = chartTakeoverAccounts();
const year = { periodStart: "2027-01-01", periodEnd: "2027-12-31", takeoverDate: "2027-07-01" };
const season = { periodStart: "2026-07-01", periodEnd: "2027-06-30", takeoverDate: "2027-01-01" };

function plan(input: Omit<Parameters<typeof planTakeover>[0], "accounts">) {
  return planTakeover({ ...input, accounts });
}

function sheet(opening: Extract<ReturnType<typeof plan>, { ok: true }>) {
  const reportAccounts = accounts.map((account) => ({
    id: account.code,
    number: account.number,
    name: account.name,
    accountType: account.accountType,
    accountClass: Number(account.number[0]) || 1,
  }));
  const entries = [];
  const linesByEntry: Record<string, Array<{ accountId: string; debit: number; credit: number }>> = {};
  if (opening.openingLines.length) {
    entries.push({ id: "opening", entry_number: 1, entry_date: opening.openingDate, description: opening.openingDescription, status: "validated", source_type: "opening", event_type: "opening" });
    linesByEntry.opening = opening.openingLines.map((line) => ({ accountId: line.accountCode, debit: line.debit, credit: line.credit }));
  }
  opening.journal.forEach((entry, index) => {
    const id = `j-${index}`;
    entries.push({ id, entry_number: index + 2, entry_date: entry.date, description: entry.label, status: "validated", source_type: "import", event_type: "import" });
    linesByEntry[id] = entry.lines.map((line) => ({ accountId: line.code, debit: line.debit, credit: line.credit }));
  });
  if (opening.rollup) {
    entries.push({ id: "rollup", entry_number: 50, entry_date: opening.rollup.date, description: opening.rollup.description, status: "validated", source_type: "history_rollup", event_type: "history_rollup" });
    linesByEntry.rollup = opening.rollup.lines.map((line) => ({ accountId: line.accountCode, debit: line.debit, credit: line.credit }));
  }
  return { accounts: reportAccounts, entries, linesByEntry, period: { label: "test", startsOn: "2027-01-01", endsOn: "2027-12-31" } };
}

describe("départ sans historique", () => {
  it("refuse un départ nul tant qu'il n'est pas confirmé, sans créer de fonds propres", () => {
    const refused = plan({ mode: "fresh", ...year, takeoverDate: year.periodStart, balances: [] });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.message).toContain("nuls");
      expect(refused.equityProposal).toBeUndefined();
    }
    const confirmed = plan({ mode: "fresh", ...year, takeoverDate: year.periodStart, balances: [], confirmZeroOpening: true });
    expect(confirmed.ok).toBe(true);
    if (!confirmed.ok) return;
    expect(confirmed.openingLines).toEqual([]);
    expect(confirmed.equityProposalApplied).toBe(false);
    expect(confirmed.journal).toEqual([]);
  });

  it("reprend banque, créance, dette et fonds propres", () => {
    const opening = plan({
      mode: "fresh",
      ...year,
      takeoverDate: year.periodStart,
      balances: [
        { code: "bank", amount: 4000 },
        { code: "debtors", amount: 500 },
        { code: "creditors", amount: 1500 },
        { code: "equity", amount: 3000 },
      ],
    });
    expect(opening.ok).toBe(true);
    if (!opening.ok) return;
    const view = sheet(opening);
    view.period = { label: "test", startsOn: year.periodStart, endsOn: year.periodEnd };
    expect(buildBalanceSheet(view).assetTotal).toBe(4500);
    expect(buildBalanceSheet(view).gap).toBe(0);
    expect(buildIncomeStatement(view).result).toBe(0);
  });

  it("n'ajoute pas le 2800 tant que l'écart n'est pas confirmé", () => {
    const gap = plan({ mode: "fresh", ...year, takeoverDate: year.periodStart, balances: [{ code: "bank", amount: 1000 }] });
    expect(gap.ok).toBe(false);
    if (!gap.ok) expect(gap.equityProposal?.amount).toBe(1000);
  });
});

describe("reprise et cumuls", () => {
  it("couvre un milieu d'année avec historique, soldes et cumuls, puis un résultat partiel", () => {
    const history = plan({
      mode: "full_period",
      ...year,
      balances: [{ code: "bank", amount: 1000 }, { code: "equity", amount: 1000 }],
      journal: [{
        date: "2027-03-01",
        piece: "F1",
        label: "Cotisation",
        origin: "EXT-1",
        lines: [{ code: "bank", debit: 200, credit: 0 }, { code: "membership", debit: 0, credit: 200 }],
      }],
    });
    expect(history.ok).toBe(true);
    if (!history.ok) return;
    const historyView = sheet(history);
    expect(buildIncomeStatement(historyView).result).toBe(200);
    expect(buildBalanceSheet(historyView).assetTotal).toBe(1200);

    const withCumul = plan({
      mode: "from_date",
      ...year,
      balances: [{ code: "bank", amount: 1500 }, { code: "equity", amount: 1000 }],
      cumulatives: [{ code: "membership", amount: 500 }],
    });
    expect(withCumul.ok).toBe(true);
    if (!withCumul.ok) return;
    const cumulView = sheet(withCumul);
    expect(buildIncomeStatement(cumulView).result).toBe(500);
    expect(buildBalanceSheet(cumulView).gap).toBe(0);
    const equity = Object.values(cumulView.linesByEntry).flat().reduce((sum, line) => sum + (line.accountId === "equity" ? line.credit - line.debit : 0), 0);
    expect(equity).toBe(1000);

    const partial = plan({
      mode: "from_date",
      ...year,
      balances: [{ code: "bank", amount: 1500 }, { code: "equity", amount: 1500 }],
    });
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(partial.coverageNote).toContain("seulement");
    expect(buildIncomeStatement({ ...sheet(partial), detailFrom: "2027-07-01", coverageNote: partial.coverageNote }).result).toBe(0);
  });

  it("aligne l'exemple Excel sur un exercice juillet-juin", () => {
    const bytes = buildTakeoverWorkbook({ mode: "full_period", ...season });
    const book = XLSX.read(bytes, { type: "array" });
    const instructions = XLSX.utils.sheet_to_json<string[]>(book.Sheets.Instructions, { header: 1, defval: "" });
    expect(JSON.stringify(instructions)).toContain("2026-07-01");
    expect(book.SheetNames).toContain("Ecritures");
    expect(book.SheetNames).not.toContain("Cumuls");
  });
});

describe("fichiers xlsx et csv", () => {
  const dir = mkdtempSync(join(tmpdir(), "obillz-reprise-"));

  it("relit un classeur et un CSV réellement écrits, y compris une écriture composée", () => {
    const workbookPath = join(dir, "reprise.xlsx");
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ["date", "piece", "libelle", "compte", "debit", "credit", "origine", "remarque", "reference"],
      ["15.01.2027", "FAC-1", "Cotisation", "1020", "1'200.50", "0", "LOT-1", "accueil", "REF-9"],
      ["15.01.2027", "FAC-1", "Cotisation", "3000", "0", "1200,50", "LOT-1", "", ""],
    ]), "Ecritures");
    XLSX.writeFile(book, workbookPath);
    const read = readTakeoverFile({
      filename: "reprise.xlsx",
      data: readFileSync(workbookPath),
      mode: "full_period",
      accounts,
    });
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.journal).toHaveLength(1);
    expect(read.journal[0].lines).toHaveLength(2);
    expect(read.journal[0].lines[0].debit).toBe(1200.5);
    expect(read.journal[0].remark).toBe("accueil");
    expect(read.journal[0].reference).toBe("REF-9");

    const csvPath = join(dir, "ecritures.csv");
    writeFileSync(csvPath, buildTakeoverCsv({ mode: "full_period", ...year }).text, "utf8");
    const template = readTakeoverFile({
      filename: "ecritures.csv",
      data: readFileSync(csvPath, "utf8"),
      mode: "full_period",
      accounts,
    });
    expect(template.ok).toBe(true);
    if (!template.ok) return;
    expect(template.journal).toEqual([]);

    const accented = "Date;Pièce;Libellé;Compte;Débit;Crédit;Origine\n2027-02-02;A;Matériel;4000;80;0;LOT-2\n2027-02-02;A;Matériel;2000;0;80;LOT-2";
    const accents = readTakeoverFile({ filename: "accents.csv", data: accented, mode: "full_period", accounts });
    expect(accents.ok).toBe(true);
    if (!accents.ok) return;
    expect(accents.journal[0].lines[0].code).toBe("sports_equipment");
  });

  it("signale un compte inconnu, une date invalide, un déséquilibre, et un séparateur ambigu", () => {
    const unknown = readTakeoverFile({
      filename: "inconnu.csv",
      data: "date;compte;debit;credit;origine\n2027-02-01;9999;10;0;O1\n2027-02-01;1020;0;10;O1",
      mode: "full_period",
      accounts,
    });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.unknownAccounts).toContain("9999");
      expect(unknown.message).toContain("9999");
    }

    const mapped = readTakeoverFile({
      filename: "inconnu.csv",
      data: "date;compte;debit;credit;origine\n2027-02-01;9999;10;0;O1\n2027-02-01;1020;0;10;O1",
      mode: "full_period",
      accounts,
      accountMap: { "9999": "4000" },
    });
    expect(mapped.ok).toBe(true);
    if (mapped.ok) expect(mapped.journal[0].lines[0].code).toBe("sports_equipment");

    const badDate = readTakeoverFile({
      filename: "date.csv",
      data: "date;compte;debit;credit;origine\n32.01.2027;1020;10;0;O1\n32.01.2027;3000;0;10;O1",
      mode: "full_period",
      accounts,
    });
    expect(badDate.ok).toBe(false);
    if (!badDate.ok) expect(badDate.errors[0].column).toBe("date");

    const unbalanced = readTakeoverFile({
      filename: "ecart.csv",
      data: "date;compte;debit;credit;origine\n2027-02-01;1020;10;0;O1\n2027-02-01;3000;0;9;O1",
      mode: "full_period",
      accounts,
    });
    expect(unbalanced.ok).toBe(false);
    if (!unbalanced.ok) expect(unbalanced.message).toContain("équilibr");

    const ambiguous = readTakeoverFile({
      filename: "melange.csv",
      data: "date,piece;libelle;compte;debit;credit;origine\n2027-02-01;A;x;1020;10;0;O1",
      mode: "full_period",
      accounts,
    });
    expect(ambiguous.ok).toBe(false);
    if (!ambiguous.ok) expect(ambiguous.needsDelimiter).toBe(true);
  });

  it("ne garde aucune écriture quand la lecture échoue, et reconnaît un second import identique", () => {
    const failed = readTakeoverFile({
      filename: "echec.csv",
      data: "date;compte;debit;credit;origine\n2027-02-01;1020;10;0;O1",
      mode: "full_period",
      accounts,
    });
    expect(failed.ok).toBe(false);
    expect("journal" in failed && failed.ok).toBe(false);

    const first = plan({
      mode: "full_period",
      ...year,
      balances: [{ code: "bank", amount: 100 }, { code: "equity", amount: 100 }],
      journal: [{ date: "2027-02-01", piece: "A", label: "x", origin: "O1", lines: [{ code: "bank", debit: 10, credit: 0 }, { code: "membership", debit: 0, credit: 10 }] }],
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(importReplay({ fingerprint: first.fingerprint, appliedFingerprints: [first.fingerprint] })).toBe("already");
    expect(toIsoDate(44927)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ignore la feuille Guide et soldes et lit Ecritures, y compris les fichiers fournis", () => {
    expect(classifySheet("Guide et soldes")).toBe("ignored");
    expect(classifySheet("Ecritures")).toBe("journal");
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ["", "", ""],
      ["Obillz — exemple fictif de reprise 2026"],
      ["Date de reprise", "06.10.2026"],
    ]), "Guide et soldes");
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ["date", "piece", "libelle", "compte", "debit", "credit", "origine"],
      ["15.01.2026", "COT-001", "Cotisations encaissées en banque", "1020", 1200, 0, "TEST-1"],
      ["15.01.2026", "COT-001", "Cotisations encaissées en banque", "3000", 0, 1200, "TEST-1"],
    ]), "Ecritures");
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Export libre"], ["pas un journal"]]), "Annexe");
    const path = join(dir, "guide-et-ecritures.xlsx");
    XLSX.writeFile(book, path);
    const read = readTakeoverFile({ filename: "reprise.xlsx", data: readFileSync(path), mode: "full_period", accounts });
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.ignoredSheets).toContain("Guide et soldes");
    expect(read.ambiguousSheets).toContain("Annexe");
    expect(read.previewSheet).toBe("Ecritures");
    expect(read.journal).toHaveLength(1);
    expect(read.journal[0].date).toBe("2026-01-15");
    expect(read.journal[0].lines).toHaveLength(2);
    expect(suggestColumnMap(read.headers).date).toBe("date");
    expect(suggestColumnMap(read.headers).origine).toBe("origine");
    expect(read.headers.every((header) => header.trim())).toBe(true);

    const forced = readTakeoverFile({ filename: "reprise.xlsx", data: readFileSync(path), mode: "full_period", accounts, sheet: "Annexe" });
    expect(forced.ok).toBe(false);
    if (!forced.ok) expect(forced.message).toContain("pas reconnue");

    const blank = readTakeoverFile({ filename: "vide.csv", data: "\n\n", mode: "full_period", accounts, headerRow: 1 });
    expect(blank.ok).toBe(false);
    if (!blank.ok) {
      expect(blank.message).toContain("aucun en-tête");
      expect(blank.headers || []).toEqual([]);
    }

    const providedBook = "C:/Users/Goffi/Downloads/obillz-test-reprise-2026.xlsx";
    if (existsSync(providedBook)) {
      const provided = readTakeoverFile({ filename: "obillz-test-reprise-2026.xlsx", data: readFileSync(providedBook), mode: "full_period", accounts });
      expect(provided.ok).toBe(true);
      if (provided.ok) {
        expect(provided.ignoredSheets).toContain("Guide et soldes");
        expect(provided.previewSheet).toBe("Ecritures");
        expect(provided.journal.length).toBeGreaterThan(0);
        expect(provided.journal[0].date).toBe("2026-01-15");
        expect(provided.journal.every((entry) => entry.date <= "2026-10-05")).toBe(true);
        expect(provided.suggestedColumns.origine).toBe("origine");
        expect(provided.headers.filter((header) => !header.trim())).toEqual([]);
      }
    }

    const providedCsv = "C:/Users/Goffi/Downloads/modele-reprise-comptable.csv";
    if (existsSync(providedCsv)) {
      const csv = readTakeoverFile({ filename: "modele-reprise-comptable.csv", data: readFileSync(providedCsv, "utf8"), mode: "full_period", accounts });
      expect(csv.ok).toBe(true);
      if (csv.ok) {
        expect(csv.suggestedColumns.date).toBe("date");
        expect(csv.suggestedColumns.compte).toBe("compte");
        expect(csv.suggestedColumns.origine).toBe("origine");
        expect(csv.journal.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("modèle simple, une ligne par écriture", () => {
  const rows = [
    ["15.01.2026", "1", "COT-1", "Cotisations encaissées", "1020", "3000", "1200.00", ""],
    ["20.01.2026", "2", "COT-2", "Cotisations en espèces", "1000", "3000", "200.00", ""],
    ["02.02.2026", "3", "FAC-1", "Matériel", "4000", "1020", "350.00", ""],
    ["10.02.2026", "4", "FAC-2", "Fournitures", "4000", "1000", "80.00", ""],
    ["01.03.2026", "5", "COT-3", "Cotisation", "1020", "3000", "500.00", ""],
    ["15.03.2026", "6", "FAC-3", "Location", "4000", "1020", "200.00", ""],
    ["01.04.2026", "7", "COT-4", "Don", "1020", "3000", "150.00", ""],
    ["10.04.2026", "8", "FAC-4", "Assurance", "4000", "1020", "90.00", ""],
    ["02.05.2026", "9", "COT-5", "Cotisation", "1000", "3000", "75.00", ""],
    ["20.05.2026", "10", "FAC-5", "Repas", "4000", "1000", "40.00", "accueil"],
  ];

  it("relit dix écritures simples depuis Excel et CSV, et bloque une date invalide", () => {
    const fixtureDir = join(process.cwd(), "tests/fixtures/accounting-import");
    mkdirSync(fixtureDir, { recursive: true });
    const blank = XLSX.read(buildSimpleJournalWorkbook(), { type: "array" });
    expect(blank.SheetNames).toEqual(["Ecritures"]);
    const blankRows = XLSX.utils.sheet_to_json<string[]>(blank.Sheets.Ecritures, { header: 1, defval: "" });
    expect(blankRows).toEqual([[...SIMPLE_JOURNAL_HEADERS]]);

    const book = XLSX.utils.book_new();
    const grid = XLSX.utils.aoa_to_sheet([[...SIMPLE_JOURNAL_HEADERS], ...rows]);
    rows.forEach((_, index) => {
      const dateCell = grid[XLSX.utils.encode_cell({ r: index + 1, c: 0 })];
      const amountCell = grid[XLSX.utils.encode_cell({ r: index + 1, c: 6 })];
      if (dateCell) dateCell.z = "dd.mm.yyyy";
      if (amountCell) amountCell.z = "#,##0.00";
    });
    grid["!cols"] = [16, 12, 16, 36, 16, 16, 14, 28].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(book, grid, "Ecritures");
    const xlsxPath = join(fixtureDir, "ecritures-simples.xlsx");
    XLSX.writeFile(book, xlsxPath);
    const csvPath = join(fixtureDir, "ecritures-simples.csv");
    const csv = `\uFEFF${[SIMPLE_JOURNAL_HEADERS.join(";"), ...rows.map((row) => row.join(";"))].join("\n")}`;
    writeFileSync(csvPath, csv, "utf8");
    writeFileSync(join(fixtureDir, "resultats-attendus.json"), JSON.stringify({
      ecritures: 10,
      totalMontants: 2885,
      produits: 2125,
      charges: 760,
      resultat: 1365,
    }, null, 2));

    const fromXlsx = readTakeoverFile({ filename: "ecritures-simples.xlsx", data: readFileSync(xlsxPath), mode: "full_period", accounts });
    const fromCsv = readTakeoverFile({ filename: "ecritures-simples.csv", data: readFileSync(csvPath, "utf8"), mode: "full_period", accounts });
    for (const read of [fromXlsx, fromCsv]) {
      expect(read.ok).toBe(true);
      if (!read.ok) return;
      expect(read.journal).toHaveLength(10);
      expect(read.journal[0].date).toBe("2026-01-15");
      expect(read.journal[0].label).toBe("Cotisations encaissées");
      expect(read.journal[0].entryNumber).toBe("1");
      expect(read.journal[0].lines).toEqual([
        { code: "bank", debit: 1200, credit: 0 },
        { code: "membership", debit: 0, credit: 1200 },
      ]);
      expect(read.journal[9].remark).toBe("accueil");
      const planned = plan({
        mode: "full_period",
        periodStart: "2026-01-01",
        periodEnd: "2026-12-31",
        takeoverDate: "2026-07-01",
        balances: [],
        journal: read.journal,
      });
      expect(planned.ok).toBe(true);
      if (!planned.ok) return;
      const income = buildIncomeStatement({
        ...sheet(planned),
        period: { label: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31" },
      });
      expect(income.productTotal).toBe(2125);
      expect(income.chargeTotal).toBe(760);
      expect(income.result).toBe(1365);
      const balance = buildBalanceSheet({
        ...sheet(planned),
        period: { label: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31" },
      });
      expect(balance.gap).toBe(0);
      expect(balance.assetTotal).toBe(1365);
      expect(importReplay({ fingerprint: planned.fingerprint, appliedFingerprints: [planned.fingerprint] })).toBe("already");
    }

    const invalid = readTakeoverFile({
      filename: "ecritures-simples.csv",
      data: `${SIMPLE_JOURNAL_HEADERS.join(";")}\nhier;1;COT-1;Test;1020;3000;10;`,
      mode: "full_period",
      accounts,
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.message).toContain("Ligne 2");
  });
});
