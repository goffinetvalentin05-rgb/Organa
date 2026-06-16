import type { MemberFieldKey, MemberFieldsMerged } from "@/lib/member-fields/types";
import {
  isKnownCategorySlug,
  isKnownRoleSlug,
  MEMBER_CATEGORY_SLUGS,
  MEMBER_ROLE_SLUGS,
} from "@/lib/members/taxonomy";

/** Champs mappables lors de l'import (alignés sur le formulaire membre + prénom). */
export type MemberImportFieldKey =
  | "prenom"
  | "nom"
  | "email"
  | "telephone"
  | "adresse"
  | "postal_code"
  | "city"
  | "role"
  | "category"
  | "date_of_birth"
  | "avs_number";

export const CORE_IMPORT_FIELDS: MemberImportFieldKey[] = [
  "prenom",
  "nom",
  "email",
  "telephone",
  "adresse",
  "role",
  "category",
];

export const OPTIONAL_IMPORT_FIELDS: MemberImportFieldKey[] = [
  "postal_code",
  "city",
  "date_of_birth",
  "avs_number",
];

export type ImportRowStatus = "valid" | "error" | "duplicate";

export interface ParsedSpreadsheet {
  headers: string[];
  rows: string[][];
}

export interface ImportMemberRow {
  rowIndex: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  postal_code: string;
  city: string;
  role: string;
  category: string;
  date_of_birth: string;
  avs_number: string;
  status: ImportRowStatus;
  errors: string[];
}

export interface ImportPreviewSummary {
  total: number;
  valid: number;
  errors: number;
  duplicates: number;
}

export interface ExistingMemberForImport {
  nom: string | null;
  email: string | null;
}

const HEADER_ALIASES: Record<MemberImportFieldKey, string[]> = {
  prenom: ["prenom", "prénom", "first name", "firstname", "first_name", "given name"],
  nom: ["nom", "name", "last name", "lastname", "last_name", "family name", "nom de famille"],
  email: ["email", "e-mail", "mail", "courriel"],
  telephone: ["telephone", "téléphone", "tel", "phone", "mobile", "gsm", "portable"],
  adresse: ["adresse", "address", "rue", "street", "adresse complete", "adresse complète"],
  postal_code: ["code postal", "postal", "zip", "npa", "cp", "postal code", "postal_code"],
  city: ["localite", "localité", "ville", "city", "commune", "lieu"],
  role: ["role", "rôle", "fonction", "function", "position"],
  category: ["categorie", "catégorie", "category", "equipe", "équipe", "team", "statut"],
  date_of_birth: [
    "date de naissance",
    "naissance",
    "birth",
    "birthdate",
    "birth date",
    "dob",
    "date_naissance",
  ],
  avs_number: ["avs", "numero avs", "numéro avs", "no avs", "n° avs", "avs_number"],
};

const ROLE_LABEL_TO_SLUG: Record<string, string> = {
  joueur: "player",
  player: "player",
  entraineur: "coach",
  entraîneur: "coach",
  coach: "coach",
  president: "president",
  président: "president",
  "vice-president": "vice_president",
  "vice-président": "vice_president",
  vice_president: "vice_president",
  tresorier: "treasurer",
  trésorier: "treasurer",
  treasurer: "treasurer",
  secretaire: "secretary",
  secrétaire: "secretary",
  secretary: "secretary",
  benevole: "volunteer",
  bénévole: "volunteer",
  volunteer: "volunteer",
  parent: "parent",
  supporter: "supporter",
  sponsor: "sponsor",
  comite: "committee",
  comité: "committee",
  committee: "committee",
  staff: "staff",
  "staff / direction": "staff",
};

const CATEGORY_LABEL_TO_SLUG: Record<string, string> = {
  "equipe premiere": "first_team",
  "équipe première": "first_team",
  "equipe reserve": "second_team",
  "équipe réserve": "second_team",
  seniors: "seniors",
  veterans: "veterans",
  vétérans: "veterans",
  feminines: "feminines",
  féminines: "feminines",
  juniors: "junior",
  junior: "junior",
  "juniors a": "juniors_a",
  "juniors b": "juniors_b",
  "juniors c": "juniors_c",
  "juniors d": "juniors_d",
  "juniors e": "juniors_e",
  "juniors f": "juniors_f",
  "ecole de football": "football_school",
  "école de football": "football_school",
  loisir: "leisure",
  leisure: "leisure",
  actifs: "actifs",
  passifs: "passifs",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

export function getAvailableImportFields(
  settings: MemberFieldsMerged
): MemberImportFieldKey[] {
  const fields: MemberImportFieldKey[] = ["prenom", "nom"];
  if (settings.email.enabled) fields.push("email");
  if (settings.phone.enabled) fields.push("telephone");
  if (settings.address.enabled) {
    fields.push("adresse", "postal_code", "city");
  }
  if (settings.role.enabled) fields.push("role");
  if (settings.category.enabled) fields.push("category");
  if (settings.birth_date.enabled) fields.push("date_of_birth");
  if (settings.avs_number.enabled) fields.push("avs_number");
  return fields;
}

export function guessColumnMapping(headers: string[]): Record<string, MemberImportFieldKey | ""> {
  const mapping: Record<string, MemberImportFieldKey | ""> = {};
  const used = new Set<MemberImportFieldKey>();

  for (const header of headers) {
    const norm = normalizeHeader(header);
    if (!norm) {
      mapping[header] = "";
      continue;
    }
    let matched: MemberImportFieldKey | "" = "";
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
      MemberImportFieldKey,
      string[],
    ][]) {
      if (used.has(field)) continue;
      if (aliases.some((a) => norm === normalizeHeader(a) || norm.includes(normalizeHeader(a)))) {
        matched = field;
        break;
      }
    }
    if (matched) used.add(matched);
    mapping[header] = matched;
  }
  return mapping;
}

export function parseDateOfBirth(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${mm}-${dd}`;
  }

  const serial = Number(s);
  if (!Number.isNaN(serial) && serial > 20000 && serial < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + Math.floor(serial));
    return epoch.toISOString().slice(0, 10);
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

export function resolveRoleValue(raw: string): string {
  const s = raw.trim();
  if (!s) return "player";
  if (isKnownRoleSlug(s)) return s;
  const norm = normalizeHeader(s);
  if (ROLE_LABEL_TO_SLUG[norm]) return ROLE_LABEL_TO_SLUG[norm];
  for (const slug of MEMBER_ROLE_SLUGS) {
    if (normalizeHeader(slug) === norm) return slug;
  }
  return s;
}

export function resolveCategoryValue(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (isKnownCategorySlug(s)) return s;
  const norm = normalizeHeader(s);
  if (CATEGORY_LABEL_TO_SLUG[norm]) return CATEGORY_LABEL_TO_SLUG[norm];
  for (const slug of MEMBER_CATEGORY_SLUGS) {
    if (normalizeHeader(slug) === norm) return slug;
  }
  return s;
}

export function buildCombinedNom(prenom: string, nom: string): string {
  return [prenom.trim(), nom.trim()].filter(Boolean).join(" ").trim();
}

export function memberIdentityKey(prenom: string, nom: string, email: string): string {
  const mail = email.trim().toLowerCase();
  if (mail) return `email:${mail}`;
  return `name:${buildCombinedNom(prenom, nom).toLowerCase()}`;
}

export function rowToMemberBody(row: ImportMemberRow): Record<string, unknown> {
  return {
    nom: buildCombinedNom(row.prenom, row.nom),
    email: row.email.trim() || null,
    telephone: row.telephone.trim() || null,
    adresse: row.adresse.trim() || null,
    postal_code: row.postal_code.trim() || null,
    city: row.city.trim() || null,
    role: resolveRoleValue(row.role),
    category: resolveCategoryValue(row.category),
    date_of_birth: row.date_of_birth.trim() || null,
    avs_number: row.avs_number.trim() || null,
  };
}

export function buildImportRows(
  parsed: ParsedSpreadsheet,
  columnMapping: Record<string, MemberImportFieldKey | "">,
  existing: ExistingMemberForImport[]
): ImportMemberRow[] {
  const rows: ImportMemberRow[] = [];

  parsed.rows.forEach((cells, idx) => {
    const rowIndex = idx + 2;
    const values: Partial<Record<MemberImportFieldKey, string>> = {};

    parsed.headers.forEach((header, colIdx) => {
      const target = columnMapping[header];
      if (!target) return;
      const prev = values[target] || "";
      const next = cellStr(cells[colIdx] ?? "");
      values[target] = prev ? `${prev} ${next}`.trim() : next;
    });

    const prenom = values.prenom || "";
    const nom = values.nom || "";
    const email = values.email || "";
    const errors: string[] = [];

    if (!prenom.trim()) errors.push("missing_prenom");
    if (!nom.trim()) errors.push("missing_nom");

    const dobRaw = values.date_of_birth || "";
    let date_of_birth = "";
    if (dobRaw) {
      const parsedDob = parseDateOfBirth(dobRaw);
      if (parsedDob) date_of_birth = parsedDob;
      else errors.push("invalid_birth_date");
    }

    rows.push({
      rowIndex,
      prenom,
      nom,
      email,
      telephone: values.telephone || "",
      adresse: values.adresse || "",
      postal_code: values.postal_code || "",
      city: values.city || "",
      role: values.role || "",
      category: values.category || "",
      date_of_birth,
      avs_number: values.avs_number || "",
      status: "valid",
      errors,
    });
  });

  return finalizeImportRows(rows, existing);
}

/** Marque erreurs et doublons sur des lignes déjà extraites (côté client ou API). */
export function finalizeImportRows(
  rows: ImportMemberRow[],
  existing: ExistingMemberForImport[]
): ImportMemberRow[] {
  const existingKeys = new Set<string>();
  for (const m of existing) {
    const email = (m.email || "").trim().toLowerCase();
    if (email) {
      existingKeys.add(`email:${email}`);
    } else if (m.nom?.trim()) {
      existingKeys.add(`name:${m.nom.trim().toLowerCase()}`);
    }
  }

  const seenInFile = new Set<string>();
  return rows.map((row) => {
    const errors = [...row.errors];
    if (!row.prenom.trim()) {
      if (!errors.includes("missing_prenom")) errors.push("missing_prenom");
    }
    if (!row.nom.trim()) {
      if (!errors.includes("missing_nom")) errors.push("missing_nom");
    }

    if (errors.length > 0) {
      return { ...row, errors, status: "error" as const };
    }

    const key = memberIdentityKey(row.prenom, row.nom, row.email);
    if (existingKeys.has(key) || seenInFile.has(key)) {
      return { ...row, errors, status: "duplicate" as const };
    }
    seenInFile.add(key);
    return { ...row, errors, status: "valid" as const };
  });
}

export function summarizeImportRows(rows: ImportMemberRow[]): ImportPreviewSummary {
  let valid = 0;
  let errors = 0;
  let duplicates = 0;
  for (const r of rows) {
    if (r.status === "valid") valid++;
    else if (r.status === "error") errors++;
    else if (r.status === "duplicate") duplicates++;
  }
  return { total: rows.length, valid, errors, duplicates };
}

export function buildCsvTemplateHeaders(
  settings: MemberFieldsMerged,
  fieldLabels: Record<MemberFieldKey, string>
): string[] {
  const headers = ["Prénom", "Nom"];
  if (settings.email.enabled) headers.push("Email");
  if (settings.phone.enabled) headers.push("Téléphone");
  if (settings.address.enabled) {
    headers.push("Adresse", "Code postal", "Localité");
  }
  if (settings.role.enabled) headers.push("Rôle");
  if (settings.category.enabled) headers.push("Catégorie");
  if (settings.birth_date.enabled) headers.push(fieldLabels.birth_date || "Date de naissance");
  if (settings.avs_number.enabled) headers.push(fieldLabels.avs_number || "Numéro AVS");
  return headers;
}

export function importFieldLabelKey(field: MemberImportFieldKey): string {
  const map: Partial<Record<MemberImportFieldKey, string>> = {
    prenom: "dashboard.clients.import.fields.prenom",
    nom: "dashboard.clients.import.fields.nom",
    email: "dashboard.clients.fields.email",
    telephone: "dashboard.clients.fields.phone",
    adresse: "dashboard.clients.fields.address",
    postal_code: "dashboard.clients.import.fields.postalCode",
    city: "dashboard.clients.import.fields.city",
    role: "dashboard.clients.fields.role",
    category: "dashboard.clients.fields.category",
    date_of_birth: "dashboard.clients.fields.dateOfBirth",
    avs_number: "dashboard.clients.fields.avsNumber",
  };
  return map[field] || field;
}

export const MAX_IMPORT_ROWS = 500;
