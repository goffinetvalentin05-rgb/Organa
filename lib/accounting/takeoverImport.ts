import * as XLSX from "xlsx";
import {
  detectCsvDelimiter,
  headerIndex,
  parseAmount,
  parseTakeoverCsv,
  resolveImportAccount,
  toIsoDate,
  type ImportCellError,
  type TakeoverAccount,
  type TakeoverBalance,
  type TakeoverJournalEntry,
  type TakeoverMode,
} from "./takeover";

export type TakeoverTemplateInput = {
  mode: TakeoverMode;
  periodStart: string;
  periodEnd: string;
  takeoverDate: string;
};

export type TakeoverFileResult =
  | {
      ok: true;
      balances: TakeoverBalance[];
      journal: TakeoverJournalEntry[];
      cumulatives: TakeoverBalance[];
    }
  | {
      ok: false;
      message: string;
      errors: ImportCellError[];
      needsDelimiter?: boolean;
      headers?: string[];
      unknownAccounts?: string[];
    };

const ENTRY_HEADERS = ["date", "piece", "libelle", "compte", "debit", "credit", "origine", "remarque", "reference"];
const BALANCE_HEADERS = ["numero", "nom", "ancien_numero", "solde"];
const CUMUL_HEADERS = ["numero", "nom", "cumul"];

export function buildTakeoverWorkbook(input: TakeoverTemplateInput): Uint8Array {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(instructionRows(input)), "Instructions");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(balanceRows(input)), "Soldes");
  if (input.mode === "full_period" && input.takeoverDate > input.periodStart) {
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(entryRows(input)), "Ecritures");
  }
  if (input.mode === "from_date") {
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(cumulRows(input)), "Cumuls");
  }
  const bytes = XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Uint8Array(bytes);
}

export function buildTakeoverCsv(input: TakeoverTemplateInput): { name: string; text: string } {
  if (input.mode === "full_period" && input.takeoverDate > input.periodStart) {
    return { name: "modele-ecritures.csv", text: toCsv(entryRows(input)) };
  }
  if (input.mode === "from_date") {
    return { name: "modele-cumuls.csv", text: toCsv(cumulRows(input)) };
  }
  return { name: "modele-soldes.csv", text: toCsv(balanceRows(input)) };
}

export function readTakeoverFile(input: {
  filename: string;
  data: ArrayBuffer | Uint8Array | string;
  mode: TakeoverMode;
  accounts?: TakeoverAccount[];
  delimiter?: ";" | ",";
  columns?: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
  accountMap?: Record<string, string>;
}): TakeoverFileResult {
  const lower = input.filename.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) {
    return readWorkbook(input);
  }
  return readCsvFile(input);
}

function readWorkbook(input: {
  data: ArrayBuffer | Uint8Array | string;
  mode: TakeoverMode;
  accounts?: TakeoverAccount[];
  columns?: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
  accountMap?: Record<string, string>;
}): TakeoverFileResult {
  const bytes = typeof input.data === "string" ? new TextEncoder().encode(input.data) : new Uint8Array(input.data);
  const book = XLSX.read(bytes, { type: "array", cellDates: true });
  const balances: TakeoverBalance[] = [];
  const cumulatives: TakeoverBalance[] = [];
  let journal: TakeoverJournalEntry[] = [];
  for (const name of book.SheetNames) {
    const kind = sheetKind(name);
    if (!kind) continue;
    const rows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(book.Sheets[name], { header: 1, raw: true, defval: "" });
    if (kind === "balances" || kind === "cumulatives") {
      const parsed = readAmountSheet(name, rows, kind, input.accounts, input.accountMap);
      if (!parsed.ok) return parsed;
      if (kind === "balances") balances.push(...parsed.rows);
      else cumulatives.push(...parsed.rows);
    } else {
      const csv = toCsv(rows.map((row) => row.map((cell) => cell instanceof Date ? (toIsoDate(cell) || "") : cell)));
      const parsed = parseTakeoverCsv(csv, input.columns, { delimiter: ";", sheet: name, accounts: input.accounts, accountMap: input.accountMap });
      if (!parsed.ok) return parsed;
      journal = parsed.entries;
    }
  }
  return guardMode({ ok: true, balances, journal, cumulatives }, input.mode);
}

function readCsvFile(input: {
  data: ArrayBuffer | Uint8Array | string;
  mode: TakeoverMode;
  accounts?: TakeoverAccount[];
  delimiter?: ";" | ",";
  columns?: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
  accountMap?: Record<string, string>;
}): TakeoverFileResult {
  const text = typeof input.data === "string" ? input.data : new TextDecoder("utf-8").decode(input.data);
  if (!input.delimiter && detectCsvDelimiter(text) === "ambiguous") {
    return {
      ok: false,
      needsDelimiter: true,
      message: "Le séparateur du CSV est ambigu. Choisissez le point-virgule ou la virgule.",
      errors: [{ sheet: "CSV", row: 1, column: "fichier", message: "Choisissez le point-virgule ou la virgule comme séparateur." }],
    };
  }
  const delimiter = input.delimiter || (detectCsvDelimiter(text) === "," ? "," : ";");
  const rows = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = splitLoose(rows[0] || "", delimiter);
  const journalish = headerIndex(headers, input.columns?.date || "date") >= 0 || headerIndex(headers, input.columns?.origine || "origine") >= 0;
  const cumulative = headerIndex(headers, "cumul") >= 0;
  if (journalish && !cumulative) {
    const parsed = parseTakeoverCsv(text, input.columns, { delimiter, sheet: "CSV", accounts: input.accounts, accountMap: input.accountMap });
    if (!parsed.ok) return parsed;
    return guardMode({ ok: true, balances: [], journal: parsed.entries, cumulatives: [] }, input.mode);
  }
  const table = rows.map((line) => splitLoose(line, delimiter));
  const parsed = readAmountSheet("CSV", table, cumulative ? "cumulatives" : "balances", input.accounts, input.accountMap);
  if (!parsed.ok) return parsed;
  return guardMode({
    ok: true,
    balances: cumulative ? [] : parsed.rows,
    journal: [],
    cumulatives: cumulative ? parsed.rows : [],
  }, input.mode);
}

function guardMode(result: Extract<TakeoverFileResult, { ok: true }>, mode: TakeoverMode): TakeoverFileResult {
  if (mode !== "full_period" && result.journal.length) {
    return {
      ok: false,
      message: "Cette méthode n'importe pas les anciennes écritures. Elles sont déjà comprises dans les soldes, ou il n'y a pas d'historique.",
      errors: [{ sheet: "Ecritures", row: 1, column: "fichier", message: "Retirez les écritures historiques pour ce choix." }],
    };
  }
  if (mode !== "from_date" && result.cumulatives.length) {
    return {
      ok: false,
      message: "Les cumuls de charges et de produits ne s'utilisent que pour continuer une comptabilité à partir d'une date.",
      errors: [{ sheet: "Cumuls", row: 1, column: "fichier", message: "Retirez les cumuls pour ce choix." }],
    };
  }
  if (mode === "full_period" && result.cumulatives.length) {
    return {
      ok: false,
      message: "La reprise de tout l'exercice utilise les écritures détaillées. Les cumuls compteraient une deuxième fois les produits et les charges.",
      errors: [{ sheet: "Cumuls", row: 1, column: "fichier", message: "Retirez les cumuls." }],
    };
  }
  return result;
}

function readAmountSheet(
  sheet: string,
  rows: unknown[][],
  kind: "balances" | "cumulatives",
  accounts?: TakeoverAccount[],
  accountMap?: Record<string, string>,
): { ok: true; rows: TakeoverBalance[] } | Extract<TakeoverFileResult, { ok: false }> {
  if (rows.length < 2) return { ok: true, rows: [] };
  const headers = rows[0].map((cell) => String(cell ?? ""));
  const numberAt = headerIndex(headers, "numero");
  const amountAt = headerIndex(headers, kind === "cumulatives" ? "cumul" : "solde");
  const legacyAt = headerIndex(headers, "ancien");
  if (numberAt < 0 || amountAt < 0) {
    return {
      ok: false,
      headers,
      message: `Feuille ${sheet} : associez les colonnes numéro et ${kind === "cumulatives" ? "cumul" : "solde"}.`,
      errors: [{ sheet, row: 1, column: numberAt < 0 ? "numero" : "solde", message: "Colonne obligatoire manquante." }],
    };
  }
  const parsed: TakeoverBalance[] = [];
  const unknown: string[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] || [];
    const number = String(row[numberAt] ?? "").trim();
    if (!number || number.toUpperCase().startsWith("EXEMPLE")) continue;
    const amount = parseAmount(row[amountAt]);
    if (amount === null) {
      return {
        ok: false,
        message: `Feuille ${sheet}, ligne ${index + 1}, colonne ${kind === "cumulatives" ? "cumul" : "solde"} : montant invalide. Utilisez 1'250.50 ou 1250,50.`,
        errors: [{ sheet, row: index + 1, column: kind === "cumulatives" ? "cumul" : "solde", message: "Montant invalide." }],
      };
    }
    if (!(amount > 0)) continue;
    const resolved = resolveImportAccount(number, accounts, accountMap);
    if (accounts && !resolved) unknown.push(number);
    const legacy = legacyAt >= 0 ? String(row[legacyAt] ?? "").trim() : "";
    parsed.push({ code: resolved || number, amount, legacyNumber: legacy || undefined });
  }
  if (unknown.length) {
    return {
      ok: false,
      unknownAccounts: [...new Set(unknown)],
      message: `Comptes inconnus : ${[...new Set(unknown)].join(", ")}. Associez-les au plan Obillz. Aucun n'est affecté automatiquement.`,
      errors: [...new Set(unknown)].map((number) => ({ sheet, row: 0, column: "numero", message: `Associez le compte ${number}.` })),
    };
  }
  return { ok: true, rows: parsed };
}

function instructionRows(input: TakeoverTemplateInput): string[][] {
  const exampleDate = exampleJournalDate(input) || input.periodStart;
  return [
    ["Reprise comptable Obillz"],
    ["Exercice", `${input.periodStart} au ${input.periodEnd}`],
    ["Date de reprise", input.takeoverDate],
    ["Méthode", methodLabel(input.mode)],
    [],
    ["Obligatoire pour une écriture : date, compte, origine, et un montant au débit ou au crédit."],
    ["Facultatif : pièce, libellé, remarque, référence."],
    ["Plusieurs lignes avec la même origine forment une seule écriture, même composée."],
    ["Les lignes dont l'origine commence par EXEMPLE ne sont pas importées. Supprimez ce mot pour reprendre l'exemple."],
    ["Dates acceptées : date Excel, aaaa-mm-jj ou jj.mm.aaaa."],
    ["Montants acceptés : 1250.50, 1250,50 ou 1'250.50."],
    ["Séparateur CSV : point-virgule. Si le fichier mélange point-virgule et virgule, Obillz demande lequel utiliser."],
    ["Un compte inconnu n'est jamais affecté tout seul : associez-le à un compte Obillz."],
    [],
    ["Exemple d'écriture composée, à adapter aux dates de votre exercice."],
    ["origine", "date", "compte", "debit", "credit", "libelle"],
    ["EXEMPLE-1", exampleDate, "1020", "120.00", "0", "Cotisation encaissée"],
    ["EXEMPLE-1", exampleDate, "3000", "0", "120.00", "Cotisation encaissée"],
  ];
}

function balanceRows(input: TakeoverTemplateInput): string[][] {
  return [
    BALANCE_HEADERS,
    ["EXEMPLE", input.mode === "from_date" ? "Solde juste avant la reprise" : "Solde de départ", "", ""],
  ];
}

function cumulRows(input: TakeoverTemplateInput): string[][] {
  return [
    CUMUL_HEADERS,
    ["EXEMPLE", `Cumul du ${input.periodStart} jusqu'à la veille du ${input.takeoverDate}`, ""],
  ];
}

function entryRows(input: TakeoverTemplateInput): string[][] {
  const date = exampleJournalDate(input) || input.periodStart;
  return [
    ENTRY_HEADERS,
    [date, "FAC-1", "Cotisation encaissée", "1020", "120.00", "0", "EXEMPLE-1", "", ""],
    [date, "FAC-1", "Cotisation encaissée", "3000", "0", "120.00", "EXEMPLE-1", "", ""],
  ];
}

function exampleJournalDate(input: TakeoverTemplateInput): string | null {
  if (input.takeoverDate <= input.periodStart) return null;
  return input.periodStart;
}

function methodLabel(mode: TakeoverMode): string {
  if (mode === "fresh") return "Nouvelle comptabilité sans historique";
  if (mode === "full_period") return "Reprendre tout l'exercice";
  return "Continuer à partir d'une date";
}

function sheetKind(name: string): "balances" | "journal" | "cumulatives" | null {
  const value = name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (value.includes("instruction")) return null;
  if (value.includes("ecriture")) return "journal";
  if (value.includes("cumul")) return "cumulatives";
  if (value.includes("solde")) return "balances";
  return null;
}

function toCsv(rows: unknown[][]): string {
  const lines = rows.map((row) => row.map((cell) => {
    const text = String(cell ?? "");
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(";"));
  return `\uFEFF${lines.join("\n")}`;
}

function splitLoose(line: string, delimiter: string): string[] {
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""));
}
