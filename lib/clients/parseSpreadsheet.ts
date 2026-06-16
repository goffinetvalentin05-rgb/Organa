import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParsedSpreadsheet } from "@/lib/clients/importMembers";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"];

export function isAcceptedImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function rowsFromAoA(aoa: unknown[][]): ParsedSpreadsheet {
  if (!aoa.length) {
    return { headers: [], rows: [] };
  }
  const headerRow = (aoa[0] || []).map((c) => String(c ?? "").trim());
  const dataRows = aoa
    .slice(1)
    .map((row) => (row || []).map((c) => String(c ?? "").trim()))
    .filter((row) => row.some((c) => c.trim() !== ""));

  return { headers: headerRow, rows: dataRows };
}

function parseCsv(text: string): ParsedSpreadsheet {
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: "greedy",
  });
  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === "Quotes" || e.type === "FieldMismatch");
    if (fatal) {
      throw new Error("INVALID_CSV");
    }
  }
  return rowsFromAoA(result.data as unknown[][]);
}

function parseXlsx(buffer: ArrayBuffer): ParsedSpreadsheet {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }
  const sheet = workbook.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];
  return rowsFromAoA(aoa);
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  if (!isAcceptedImportFile(file)) {
    throw new Error("INVALID_FORMAT");
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    const text = await file.text();
    if (!text.trim()) throw new Error("EMPTY_FILE");
    const parsed = parseCsv(text);
    if (!parsed.headers.some((h) => h.trim())) throw new Error("NO_COLUMNS");
    if (parsed.rows.length === 0) throw new Error("NO_ROWS");
    return parsed;
  }

  if (name.endsWith(".xlsx")) {
    const buffer = await file.arrayBuffer();
    if (!buffer.byteLength) throw new Error("EMPTY_FILE");
    const parsed = parseXlsx(buffer);
    if (!parsed.headers.some((h) => h.trim())) throw new Error("NO_COLUMNS");
    if (parsed.rows.length === 0) throw new Error("NO_ROWS");
    return parsed;
  }

  throw new Error("INVALID_FORMAT");
}

export function downloadCsvTemplate(headers: string[], filename = "modele-import-membres.csv") {
  const csv = Papa.unparse([headers]);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
