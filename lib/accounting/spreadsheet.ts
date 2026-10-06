import { formatSwissDate } from "./format";

/**
 * Cellules CSV ouvertes dans Excel.
 * Un texte dont le premier caractère utile est =, +, - ou @ devient une formule.
 * Les espaces et caractères de contrôle qui précèdent ce signe comptent aussi.
 * Un montant numérique, y compris négatif, reste un nombre.
 */

const LEADING_NOISE = /^[\u0000-\u001F\u007F\uFEFF\u200B-\u200D\u2028\u2029\s]+/;
const FORMULA_START = /^[=+\-@]/;
const PLAIN_AMOUNT = /^-?\d+(?:\.\d+)?$/;

function usefulText(value: string): string {
  return value.replace(LEADING_NOISE, "");
}

/** Montant simple, avec espaces ou apostrophes de milliers, virgule ou point décimal. */
export function isPlainAmount(value: string): boolean {
  const compact = usefulText(value)
    .replace(/[\s\u00A0\u202F'\u2019]/g, "")
    .replace(",", ".");
  return PLAIN_AMOUNT.test(compact);
}

export function neutralizeSpreadsheetText(value: string): string {
  const useful = usefulText(value);
  if (!useful || isPlainAmount(useful)) return value;
  if (FORMULA_START.test(useful)) return `'${value}`;
  return value;
}

export function quoteCsvField(value: string | number | null | undefined): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "\"\"";
    return `"${String(value)}"`;
  }
  const text = neutralizeSpreadsheetText(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

const JOURNAL_HEADER = ["Date", "N°", "Pièce", "Libellé", "Débit", "Crédit", "Montant", "Remarque", "Statut"];

type JournalCsvRow = {
  date: string;
  number: number;
  piece: string;
  label: string;
  debit: string;
  credit: string;
  amount: number;
  remark: string;
  status: string;
};

/** CSV du journal. Le montant reste un nombre. Les textes sont neutralisés. */
export function buildJournalCsv(rows: JournalCsvRow[]): string {
  const body = rows.map((row) => [
    formatSwissDate(row.date),
    row.number,
    row.piece,
    row.label,
    row.debit,
    row.credit,
    row.amount,
    row.remark,
    row.status,
  ].map((cell) => quoteCsvField(cell)).join(","));
  return [JOURNAL_HEADER.map((cell) => quoteCsvField(cell)).join(","), ...body].join("\n");
}
