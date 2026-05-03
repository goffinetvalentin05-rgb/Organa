export const MEMBER_FIELD_KEYS = [
  "email",
  "phone",
  "address",
  "birth_date",
  "category",
  "role",
  "avs_number",
] as const;

export type MemberFieldKey = (typeof MEMBER_FIELD_KEYS)[number];

export interface MemberFieldToggle {
  enabled: boolean;
  required: boolean;
}

export type MemberFieldsMerged = Record<MemberFieldKey, MemberFieldToggle>;

/** Comportement par défaut pour les clubs sans lignes en base (rétrocompat). */
export const DEFAULT_MEMBER_FIELDS: MemberFieldsMerged = {
  email: { enabled: true, required: false },
  phone: { enabled: true, required: false },
  address: { enabled: true, required: false },
  birth_date: { enabled: false, required: false },
  category: { enabled: true, required: false },
  role: { enabled: true, required: false },
  avs_number: { enabled: false, required: false },
};

export function mergeMemberFieldSettings(
  rows: { field_key: string; enabled: boolean; required: boolean }[] | null | undefined
): MemberFieldsMerged {
  const out: MemberFieldsMerged = { ...DEFAULT_MEMBER_FIELDS };
  for (const k of MEMBER_FIELD_KEYS) {
    out[k] = { ...DEFAULT_MEMBER_FIELDS[k] };
  }
  for (const row of rows || []) {
    if (!MEMBER_FIELD_KEYS.includes(row.field_key as MemberFieldKey)) continue;
    const k = row.field_key as MemberFieldKey;
    out[k] = { enabled: !!row.enabled, required: !!row.required };
  }
  return out;
}

/** Masque un numéro AVS pour affichage (ex. 756.XXXX.XXXX.90). */
export function maskAvsNumber(raw: string | null | undefined): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  const parts = s
    .split(".")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 4) {
    const last = parts[3].replace(/\D/g, "");
    const last2 = last.length >= 2 ? last.slice(-2) : parts[3].slice(-2).padStart(2, "X");
    return `${parts[0]}.XXXX.XXXX.${last2}`;
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 13) {
    return `${digits.slice(0, 3)}.XXXX.XXXX.${digits.slice(-2)}`;
  }
  if (digits.length >= 4) {
    return `${digits.slice(0, 2)}••••••${digits.slice(-2)}`;
  }
  return "XXX.XXXX.XXXX.XX";
}
