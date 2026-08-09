import type {
  ImportMemberRow,
  ImportRowStatus,
  MemberImportFieldKey,
} from "@/lib/clients/importMembers";
import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const MEMBER_IMPORT_DRAFT_VERSION = 1 as const;

export type MemberImportDraftStep = "mapping" | "preview";

/** Brouillon sérialisable — jamais de File/Blob. */
export type MemberImportDraftData = {
  step: MemberImportDraftStep;
  loadedFileName: string | null;
  headers: string[];
  rows: string[][];
  columnMapping: Record<string, MemberImportFieldKey | "">;
  importRows: ImportMemberRow[];
};

const FIELD_KEYS = new Set<string>([
  "prenom",
  "nom",
  "email",
  "telephone",
  "adresse",
  "postal_code",
  "city",
  "role",
  "category",
  "date_of_birth",
  "avs_number",
  "",
]);

const ROW_STATUSES = new Set<ImportRowStatus>(["valid", "error", "duplicate"]);

export function emptyMemberImportDraftData(): MemberImportDraftData {
  return {
    step: "mapping",
    loadedFileName: null,
    headers: [],
    rows: [],
    columnMapping: {},
    importRows: [],
  };
}

function normalizeImportRow(raw: unknown): ImportMemberRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const status: ImportRowStatus =
    typeof r.status === "string" && ROW_STATUSES.has(r.status as ImportRowStatus)
      ? (r.status as ImportRowStatus)
      : "error";
  return {
    rowIndex: typeof r.rowIndex === "number" ? r.rowIndex : 0,
    prenom: typeof r.prenom === "string" ? r.prenom : "",
    nom: typeof r.nom === "string" ? r.nom : "",
    email: typeof r.email === "string" ? r.email : "",
    telephone: typeof r.telephone === "string" ? r.telephone : "",
    adresse: typeof r.adresse === "string" ? r.adresse : "",
    postal_code: typeof r.postal_code === "string" ? r.postal_code : "",
    city: typeof r.city === "string" ? r.city : "",
    role: typeof r.role === "string" ? r.role : "",
    category: typeof r.category === "string" ? r.category : "",
    date_of_birth: typeof r.date_of_birth === "string" ? r.date_of_birth : "",
    avs_number: typeof r.avs_number === "string" ? r.avs_number : "",
    status,
    errors: Array.isArray(r.errors)
      ? r.errors.filter((e): e is string => typeof e === "string")
      : [],
  };
}

export function normalizeMemberImportDraftData(
  raw: unknown
): MemberImportDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const headers = Array.isArray(d.headers)
    ? d.headers.filter((h): h is string => typeof h === "string")
    : [];
  const rows = Array.isArray(d.rows)
    ? d.rows
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) =>
          row.map((cell) => (typeof cell === "string" ? cell : String(cell ?? "")))
        )
    : [];

  const columnMapping: Record<string, MemberImportFieldKey | ""> = {};
  if (d.columnMapping && typeof d.columnMapping === "object") {
    for (const [key, value] of Object.entries(
      d.columnMapping as Record<string, unknown>
    )) {
      if (typeof value === "string" && FIELD_KEYS.has(value)) {
        columnMapping[key] = value as MemberImportFieldKey | "";
      } else {
        columnMapping[key] = "";
      }
    }
  }

  const importRows = Array.isArray(d.importRows)
    ? d.importRows
        .map(normalizeImportRow)
        .filter((r): r is ImportMemberRow => r !== null)
    : [];

  const step: MemberImportDraftStep =
    d.step === "preview" && importRows.length > 0 ? "preview" : "mapping";

  if (headers.length === 0 && importRows.length === 0) return null;

  return {
    step,
    loadedFileName:
      typeof d.loadedFileName === "string" ? d.loadedFileName : null,
    headers,
    rows,
    columnMapping,
    importRows,
  };
}

export function isMeaningfulMemberImportDraft(
  data: MemberImportDraftData
): boolean {
  if (data.headers.length > 0) return true;
  if (data.rows.length > 0) return true;
  if (data.importRows.length > 0) return true;
  if (Object.values(data.columnMapping).some((v) => v !== "")) return true;
  if (data.loadedFileName) return true;
  return false;
}

export const memberImportDraftStore = createLocalDraftStore<MemberImportDraftData>({
  version: MEMBER_IMPORT_DRAFT_VERSION,
  product: "sport",
  formType: "member-import",
  isMeaningful: isMeaningfulMemberImportDraft,
  normalize: normalizeMemberImportDraftData,
});
