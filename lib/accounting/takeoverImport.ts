import * as XLSX from "xlsx";
import {
  detectCsvDelimiter,
  headerIndex,
  normalizeHeader,
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

const ENTRY_HEADERS = ["date", "piece", "libelle", "compte", "debit", "credit", "origine", "remarque", "reference"] as const;
const BALANCE_HEADERS = ["numero", "nom", "ancien_numero", "solde"];
const CUMUL_HEADERS = ["numero", "nom", "cumul"];

export type SheetRole = "journal" | "balances" | "cumulatives" | "ignored" | "ambiguous";

export type WorkbookSheet = { name: string; role: SheetRole };

export type TakeoverFileResult =
  | {
      ok: true;
      balances: TakeoverBalance[];
      journal: TakeoverJournalEntry[];
      cumulatives: TakeoverBalance[];
      sheets: WorkbookSheet[];
      ambiguousSheets: string[];
      ignoredSheets: string[];
      headers: string[];
      preview: string[][];
      suggestedColumns: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
      headerRow: number;
      previewSheet: string | null;
    }
  | {
      ok: false;
      message: string;
      errors: ImportCellError[];
      needsDelimiter?: boolean;
      headers?: string[];
      unknownAccounts?: string[];
      sheets?: WorkbookSheet[];
      ambiguousSheets?: string[];
      ignoredSheets?: string[];
      preview?: string[][];
      suggestedColumns?: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
      headerRow?: number;
      previewSheet?: string | null;
    };

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

export function classifySheet(name: string): SheetRole {
  const value = name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (/(instruction|guide|aide|consigne|readme)/.test(value)) return "ignored";
  if (value.includes("ecriture")) return "journal";
  if (value.includes("cumul")) return "cumulatives";
  if (value.includes("solde")) return "balances";
  return "ambiguous";
}

export function visibleHeaders(headers: string[]): string[] {
  const seen = new Set<string>();
  const visible: string[] = [];
  for (const header of headers) {
    const text = header.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    visible.push(text);
  }
  return visible;
}

export const SIMPLE_JOURNAL_HEADERS = ["Date", "N° écr.", "Pièce", "Libellé", "Débit", "Crédit", "Montant", "Remarque"] as const;

const SIMPLE_FIELDS = ["date", "number", "piece", "label", "debit", "credit", "amount", "remark"] as const;
type SimpleField = (typeof SIMPLE_FIELDS)[number];

const SIMPLE_ALIASES: Record<SimpleField, string[]> = {
  date: ["date"],
  number: ["necr", "n", "numero", "numeroecriture"],
  piece: ["piece"],
  label: ["libelle"],
  debit: ["debit", "comptedebit"],
  credit: ["credit", "comptecredit"],
  amount: ["montant"],
  remark: ["remarque"],
};

export function buildSimpleJournalWorkbook(): Uint8Array {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([[...SIMPLE_JOURNAL_HEADERS]]);
  sheet["!cols"] = [16, 12, 16, 36, 16, 16, 14, 28].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(book, sheet, "Ecritures");
  const bytes = XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Uint8Array(bytes);
}

export function buildSimpleJournalCsv(): { name: string; text: string } {
  return { name: "modele-ecritures.csv", text: toCsv([[...SIMPLE_JOURNAL_HEADERS]]) };
}

export function detectJournalLayout(headers: string[]): "simple" | "lines" | "unknown" {
  const normalized = headers.map((header) => normalizeHeader(header));
  const has = (name: string) => normalized.includes(name);
  if (has("origine") || (has("compte") && has("debit") && !has("montant"))) return "lines";
  if (has("montant") && has("date") && (has("debit") || has("comptedebit")) && (has("credit") || has("comptecredit"))) return "simple";
  return "unknown";
}

export function suggestSimpleColumns(headers: string[]): Partial<Record<SimpleField, string>> {
  const map: Partial<Record<SimpleField, string>> = {};
  for (const field of SIMPLE_FIELDS) {
    const at = simpleColumnAt(headers, field);
    if (at >= 0) map[field] = headers[at].trim();
  }
  return map;
}

function simpleColumnAt(headers: string[], field: SimpleField, chosen?: string): number {
  if (chosen) {
    const exact = headers.findIndex((header) => header.trim() === chosen);
    if (exact >= 0) return exact;
  }
  const aliases = SIMPLE_ALIASES[field];
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

function accountToken(raw: string): string {
  const text = raw.trim();
  const leading = /^(\d{3,6})\b/.exec(text);
  return leading ? leading[1] : text;
}

export function parseSimpleJournal(
  rows: unknown[][],
  options: {
    sheet?: string;
    headerRow?: number;
    accounts?: TakeoverAccount[];
    accountMap?: Record<string, string>;
    columns?: Partial<Record<SimpleField, string>>;
  } = {},
): { ok: true; entries: TakeoverJournalEntry[] } | Extract<TakeoverFileResult, { ok: false }> {
  const sheet = options.sheet || "Ecritures";
  const headerRow = options.headerRow && options.headerRow > 0 ? options.headerRow : 1;
  const headers = ((rows[0] || []) as unknown[]).map((cell) => String(cell ?? ""));
  const at = (field: SimpleField) => simpleColumnAt(headers, field, options.columns?.[field]);
  const missing = (["date", "debit", "credit", "amount"] as const).filter((field) => at(field) < 0);
  if (missing.length) {
    const labels: Record<SimpleField, string> = { date: "Date", number: "N° écr.", piece: "Pièce", label: "Libellé", debit: "Débit", credit: "Crédit", amount: "Montant", remark: "Remarque" };
    return {
      ok: false,
      headers: visibleHeaders(headers),
      message: "Ce fichier ne correspond pas au modèle Obillz. Ouvrez « Mon fichier vient directement d'un autre logiciel » pour indiquer ses colonnes.",
      errors: missing.map((field) => ({ sheet, row: headerRow, column: labels[field], message: `La colonne ${labels[field]} est introuvable.` })),
    };
  }
  const entries: TakeoverJournalEntry[] = [];
  const errors: ImportCellError[] = [];
  const unknown: string[] = [];
  const seen = new Map<string, number>();
  const cell = (row: unknown[], field: SimpleField) => String(row[at(field)] ?? "").trim();
  for (let index = 1; index < rows.length; index += 1) {
    const row = (rows[index] || []) as unknown[];
    if (row.every((value) => String(value ?? "").trim() === "")) continue;
    const lineNo = headerRow + index;
    const date = toIsoDate(row[at("date")]);
    if (!date) errors.push({ sheet, row: lineNo, column: "Date", message: "Cette date n'est pas valable. Écrivez 15.01.2026 ou utilisez une date Excel." });
    const amount = parseAmount(row[at("amount")]);
    if (amount === null || !(amount > 0)) errors.push({ sheet, row: lineNo, column: "Montant", message: "Indiquez le montant de l'écriture, par exemple 1 200.00." });
    const debitToken = accountToken(cell(row, "debit"));
    const creditToken = accountToken(cell(row, "credit"));
    if (!debitToken) errors.push({ sheet, row: lineNo, column: "Débit", message: "Indiquez le numéro du compte au débit, par exemple 1020." });
    if (!creditToken) errors.push({ sheet, row: lineNo, column: "Crédit", message: "Indiquez le numéro du compte au crédit, par exemple 3000." });
    if (debitToken && debitToken === creditToken) errors.push({ sheet, row: lineNo, column: "Crédit", message: "Le compte au débit et le compte au crédit doivent être différents." });
    const number = cell(row, "number");
    const origin = number || `ligne ${lineNo}`;
    if (seen.has(origin)) errors.push({ sheet, row: lineNo, column: "N° écr.", message: `Le numéro ${number} est déjà utilisé à la ligne ${seen.get(origin)}.` });
    else seen.set(origin, lineNo);
    const debitCode = debitToken ? resolveImportAccount(debitToken, options.accounts, options.accountMap) : null;
    const creditCode = creditToken ? resolveImportAccount(creditToken, options.accounts, options.accountMap) : null;
    if (options.accounts && debitToken && !debitCode) unknown.push(debitToken);
    if (options.accounts && creditToken && !creditCode) unknown.push(creditToken);
    if (!date || amount === null || !(amount > 0) || !debitCode || !creditCode || debitToken === creditToken) continue;
    entries.push({
      date,
      piece: cell(row, "piece"),
      label: cell(row, "label"),
      origin,
      entryNumber: number || undefined,
      remark: cell(row, "remark") || undefined,
      lines: [
        { code: debitCode, debit: amount, credit: 0 },
        { code: creditCode, debit: 0, credit: amount },
      ],
    });
  }
  const distinctUnknown = [...new Set(unknown)];
  if (distinctUnknown.length) {
    return {
      ok: false,
      unknownAccounts: distinctUnknown,
      headers: visibleHeaders(headers),
      message: `Comptes inconnus : ${distinctUnknown.join(", ")}. Indiquez le compte Obillz correspondant. Aucun n'est choisi automatiquement.`,
      errors: distinctUnknown.map((number) => ({ sheet, row: 0, column: "Compte", message: `Le compte ${number} n'est pas dans le plan Obillz.` })),
    };
  }
  if (errors.length) {
    const first = errors[0];
    return { ok: false, headers: visibleHeaders(headers), message: `Ligne ${first.row}, colonne ${first.column} : ${first.message}`, errors };
  }
  return { ok: true, entries };
}

export function suggestColumnMap(headers: string[]): Partial<Record<(typeof ENTRY_HEADERS)[number], string>> {
  const map: Partial<Record<(typeof ENTRY_HEADERS)[number], string>> = {};
  for (const field of ENTRY_HEADERS) {
    const at = headerIndex(headers, field);
    if (at >= 0 && headers[at]?.trim()) map[field] = headers[at].trim();
  }
  return map;
}

export function readTakeoverFile(input: {
  filename: string;
  data: ArrayBuffer | Uint8Array | string;
  mode: TakeoverMode;
  accounts?: TakeoverAccount[];
  delimiter?: ";" | ",";
  columns?: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
  accountMap?: Record<string, string>;
  sheet?: string;
  headerRow?: number;
  asRole?: "journal" | "balances" | "cumulatives";
  layout?: "auto" | "simple" | "lines";
  simpleColumns?: Partial<Record<"date" | "number" | "piece" | "label" | "debit" | "credit" | "amount" | "remark", string>>;
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
  sheet?: string;
  headerRow?: number;
  asRole?: "journal" | "balances" | "cumulatives";
  layout?: "auto" | "simple" | "lines";
  simpleColumns?: Partial<Record<"date" | "number" | "piece" | "label" | "debit" | "credit" | "amount" | "remark", string>>;
}): TakeoverFileResult {
  const bytes = typeof input.data === "string" ? new TextEncoder().encode(input.data) : new Uint8Array(input.data);
  const book = XLSX.read(bytes, { type: "array", cellDates: true });
  const sheets = book.SheetNames.map((name) => ({ name, role: input.sheet === name && input.asRole ? input.asRole : classifySheet(name) }));
  const ambiguousSheets = sheets.filter((item) => classifySheet(item.name) === "ambiguous").map((item) => item.name);
  const ignoredSheets = sheets.filter((item) => classifySheet(item.name) === "ignored").map((item) => item.name);
  const context = { sheets, ambiguousSheets, ignoredSheets };
  const chosen = input.sheet ? sheets.filter((item) => item.name === input.sheet) : sheets.filter((item) => item.role === "journal" || item.role === "balances" || item.role === "cumulatives");
  if (input.sheet && !book.Sheets[input.sheet]) {
    return { ok: false, message: `Feuille « ${input.sheet} » introuvable.`, errors: [{ sheet: input.sheet, row: 1, column: "fichier", message: "Choisissez une feuille du classeur." }], ...context };
  }
  if (input.sheet && classifySheet(input.sheet) === "ignored" && !input.asRole) {
    return { ok: false, message: `La feuille « ${input.sheet} » contient des explications. Elle n'est pas importée. Choisissez la feuille des écritures.`, errors: [{ sheet: input.sheet, row: 1, column: "fichier", message: "Cette feuille est ignorée." }], ...context };
  }
  if (input.sheet && classifySheet(input.sheet) === "ambiguous" && !input.asRole) {
    return { ok: false, message: `La feuille « ${input.sheet} » n'est pas reconnue. Confirmez qu'elle contient les écritures à importer.`, errors: [{ sheet: input.sheet, row: 1, column: "fichier", message: "Confirmez cette feuille avant de l'importer." }], ...context };
  }

  const balances: TakeoverBalance[] = [];
  const cumulatives: TakeoverBalance[] = [];
  let journal: TakeoverJournalEntry[] = [];
  let headers: string[] = [];
  let preview: string[][] = [];
  let headerRow = input.headerRow || 1;
  let previewSheet: string | null = null;
  for (const item of chosen) {
    const rows = sheetRows(book.Sheets[item.name]);
    const role = item.role === "ignored" || item.role === "ambiguous" ? (input.asRole || "journal") : item.role;
    const located = locateHeader(rows, role, input.headerRow);
    if (!located.headers.length) {
      return {
        ok: false,
        message: `Feuille ${item.name}, ligne ${located.headerRow} : aucun en-tête détecté. Indiquez la ligne des titres de colonnes.`,
        errors: [{ sheet: item.name, row: located.headerRow, column: "en-têtes", message: "Aucun titre de colonne sur cette ligne." }],
        ...context,
        headerRow: located.headerRow,
        previewSheet: item.name,
      };
    }
    const sliced = rows.slice(located.headerRow - 1);
    if (role === "balances" || role === "cumulatives") {
      const parsed = readAmountSheet(item.name, sliced, role, input.accounts, input.accountMap);
      if (!parsed.ok) return { ...parsed, ...context, headers: located.headers, preview: previewOf(sliced), headerRow: located.headerRow, previewSheet: item.name };
      if (role === "balances") balances.push(...parsed.rows);
      else cumulatives.push(...parsed.rows);
    } else {
      const parsed = readJournalMatrix(sliced, { ...input, sheetName: item.name, headerRow: located.headerRow });
      if (!parsed.ok) return { ...parsed, headers: located.headers, ...context, preview: previewOf(sliced), headerRow: located.headerRow, previewSheet: item.name, suggestedColumns: suggestColumnMap(located.headers) };
      journal = parsed.entries;
    }
    if (!previewSheet || role === "journal") {
      headers = located.headers;
      preview = previewOf(sliced);
      headerRow = located.headerRow;
      previewSheet = item.name;
    }
  }
  const guarded = guardMode({ ok: true, balances, journal, cumulatives }, input.mode);
  if (!guarded.ok) return { ...guarded, ...context };
  return { ...guarded, ...context, headers, preview, suggestedColumns: suggestColumnMap(headers), headerRow, previewSheet };
}

function readCsvFile(input: {
  data: ArrayBuffer | Uint8Array | string;
  mode: TakeoverMode;
  accounts?: TakeoverAccount[];
  delimiter?: ";" | ",";
  columns?: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
  accountMap?: Record<string, string>;
  headerRow?: number;
  layout?: "auto" | "simple" | "lines";
  simpleColumns?: Partial<Record<"date" | "number" | "piece" | "label" | "debit" | "credit" | "amount" | "remark", string>>;
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
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const table = lines.map((line) => splitLoose(line, delimiter));
  const headerRow = input.headerRow && input.headerRow > 0 ? input.headerRow : 1;
  const sliced = table.slice(headerRow - 1);
  const headers = visibleHeaders((sliced[0] || []).map((cell) => String(cell ?? "")));
  const blank = {
    sheets: [] as WorkbookSheet[],
    ambiguousSheets: [] as string[],
    ignoredSheets: [] as string[],
    headers,
    preview: previewOf(sliced),
    suggestedColumns: suggestColumnMap(headers),
    headerRow,
    previewSheet: "CSV" as string | null,
  };
  if (!headers.length) {
    return { ok: false, message: `Ligne ${headerRow} : aucun en-tête détecté. Indiquez la ligne des titres de colonnes.`, errors: [{ sheet: "CSV", row: headerRow, column: "en-têtes", message: "Aucun titre de colonne sur cette ligne." }], ...blank, headers: undefined };
  }
  const journalish = headerIndex(headers, input.columns?.date || "date") >= 0 || headerIndex(headers, input.columns?.origine || "origine") >= 0;
  const cumulative = headerIndex(headers, "cumul") >= 0;
  if ((journalish && !cumulative) || detectJournalLayout(headers) === "simple" || input.layout === "simple") {
    const parsed = readJournalMatrix(sliced, { ...input, sheetName: "CSV", headerRow });
    if (!parsed.ok) return { ...parsed, ...blank, headers };
    const guarded = guardMode({ ok: true, balances: [], journal: parsed.entries, cumulatives: [] }, input.mode);
    if (!guarded.ok) return { ...guarded, ...blank };
    return { ...guarded, ...blank };
  }
  const parsed = readAmountSheet("CSV", sliced, cumulative ? "cumulatives" : "balances", input.accounts, input.accountMap);
  if (!parsed.ok) return { ...parsed, ...blank };
  const guarded = guardMode({
    ok: true,
    balances: cumulative ? [] : parsed.rows,
    journal: [],
    cumulatives: cumulative ? parsed.rows : [],
  }, input.mode);
  if (!guarded.ok) return { ...guarded, ...blank };
  return { ...guarded, ...blank };
}

function readJournalMatrix(
  rows: unknown[][],
  input: {
    columns?: Partial<Record<(typeof ENTRY_HEADERS)[number], string>>;
    simpleColumns?: Partial<Record<"date" | "number" | "piece" | "label" | "debit" | "credit" | "amount" | "remark", string>>;
    accounts?: TakeoverAccount[];
    accountMap?: Record<string, string>;
    layout?: "auto" | "simple" | "lines";
    sheetName: string;
    headerRow: number;
  },
): { ok: true; entries: TakeoverJournalEntry[] } | Extract<TakeoverFileResult, { ok: false }> {
  const headers = ((rows[0] || []) as unknown[]).map((cell) => String(cell ?? ""));
  const layout = input.layout && input.layout !== "auto" ? input.layout : detectJournalLayout(headers);
  if (layout === "unknown") {
    return {
      ok: false,
      headers: visibleHeaders(headers),
      message: "Ce fichier ne correspond pas au modèle Obillz. Ouvrez « Mon fichier vient directement d'un autre logiciel » pour indiquer ses colonnes.",
      errors: [{ sheet: input.sheetName, row: input.headerRow, column: "en-têtes", message: "Les colonnes Date, Débit, Crédit et Montant sont introuvables." }],
    };
  }
  if (layout === "simple") {
    if (rows.length < 2) return { ok: true, entries: [] };
    return parseSimpleJournal(rows, { sheet: input.sheetName, headerRow: input.headerRow, accounts: input.accounts, accountMap: input.accountMap, columns: input.simpleColumns });
  }
  const csv = toCsv(rows.map((row, rowIndex) => row.map((cell, index) => rowIndex === 0 ? cell : formatCell(cell, String(rows[0]?.[index] ?? "")))));
  return parseTakeoverCsv(csv, input.columns, { delimiter: ";", sheet: input.sheetName, accounts: input.accounts, accountMap: input.accountMap });
}

function guardMode(
  result: { ok: true; balances: TakeoverBalance[]; journal: TakeoverJournalEntry[]; cumulatives: TakeoverBalance[] },
  mode: TakeoverMode,
): { ok: true; balances: TakeoverBalance[]; journal: TakeoverJournalEntry[]; cumulatives: TakeoverBalance[] } | Extract<TakeoverFileResult, { ok: false }> {
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
    ["Début des nouvelles opérations dans Obillz", input.takeoverDate],
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
    [...ENTRY_HEADERS],
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

function sheetRows(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
}

function locateHeader(rows: unknown[][], role: "journal" | "balances" | "cumulatives", requested?: number): { headerRow: number; headers: string[] } {
  if (requested && requested > 0) {
    const headers = visibleHeaders(((rows[requested - 1] || []) as unknown[]).map((cell) => String(cell ?? "")));
    return { headerRow: requested, headers };
  }
  const limit = Math.min(rows.length, 15);
  for (let index = 0; index < limit; index += 1) {
    const headers = visibleHeaders(((rows[index] || []) as unknown[]).map((cell) => String(cell ?? "")));
    const recognized = role === "journal"
      ? headerIndex(headers, "date") >= 0 || headerIndex(headers, "origine") >= 0
      : headerIndex(headers, role === "cumulatives" ? "cumul" : "numero") >= 0;
    if (recognized) return { headerRow: index + 1, headers };
  }
  const fallback = visibleHeaders(((rows[0] || []) as unknown[]).map((cell) => String(cell ?? "")));
  return { headerRow: 1, headers: fallback };
}

function formatCell(cell: unknown, header = ""): string {
  if (cell instanceof Date) return toIsoDate(cell) || "";
  if (typeof cell === "number" && headerIndex([header], "date") >= 0) return toIsoDate(cell) || String(cell);
  return String(cell ?? "");
}

function previewOf(rows: unknown[][]): string[][] {
  const headers = ((rows[0] || []) as unknown[]).map((cell) => String(cell ?? ""));
  return rows.slice(1, 6).map((row) => (row || []).map((cell, index) => formatCell(cell, headers[index])));
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
