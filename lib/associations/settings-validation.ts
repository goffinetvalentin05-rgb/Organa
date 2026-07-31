/**
 * Validation pure des paramètres Associations (pas de Zod dans le projet).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DANGEROUS_PROTO = /^(javascript|data|vbscript|file):/i;
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const POSTAL_RE = /^[A-Za-z0-9\s\-]+$/;

export type AssociationSettingsInput = {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_address_line2: string;
  company_postal_code: string;
  company_city: string;
  company_region: string;
  company_country: string;
  website: string;
  description: string;
  iban: string;
  bank_name: string;
};

export type AssociationSettingsValidated = {
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  company_address_line2: string | null;
  company_postal_code: string | null;
  company_city: string | null;
  company_region: string | null;
  company_country: string | null;
  public_page_website_url: string | null;
  public_page_description: string | null;
  iban: string | null;
  bank_name: string | null;
};

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

/** Champ texte facultatif : refuse non-string / caractères de contrôle / trop long. */
export function optionalTextField(
  value: unknown,
  max: number,
  label: string
): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") {
    throw new Error(`${label} invalide`);
  }
  if (CONTROL_CHARS_RE.test(value)) {
    throw new Error(`${label} contient des caractères non autorisés`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new Error(`${label} est trop long (max. ${max} caractères)`);
  }
  return trimmed;
}

export function normalizeWebsite(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (DANGEROUS_PROTO.test(v)) {
    throw new Error("URL du site internet non autorisée");
  }
  let url = v;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("URL du site internet invalide");
    }
    return parsed.toString();
  } catch {
    throw new Error("URL du site internet invalide");
  }
}

export function normalizeIban(raw: string): string | null {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (!compact) return null;
  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(compact)) {
    throw new Error("IBAN invalide");
  }
  if (compact.length < 15 || compact.length > 34) {
    throw new Error("IBAN : longueur incorrecte");
  }
  return compact;
}

export function formatIbanDisplay(iban: string | null | undefined): string {
  if (!iban) return "";
  const compact = iban.replace(/\s+/g, "").toUpperCase();
  return compact.replace(/(.{4})/g, "$1 ").trim();
}

export function validateAssociationSettings(
  body: unknown
): AssociationSettingsValidated {
  const src =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const company_name = clean(src.company_name, 120);
  if (!company_name) {
    throw new Error("Le nom de l’association est obligatoire");
  }
  if (company_name.length < 2) {
    throw new Error("Le nom de l’association est trop court");
  }

  const company_email = clean(src.company_email, 160);
  if (company_email && !EMAIL_RE.test(company_email)) {
    throw new Error("Adresse email de contact invalide");
  }

  const company_phone = clean(src.company_phone, 40);
  if (company_phone && company_phone.length < 6) {
    throw new Error("Numéro de téléphone trop court");
  }

  const company_address = optionalTextField(
    src.company_address,
    500,
    "Rue et numéro"
  );
  const company_address_line2 = optionalTextField(
    src.company_address_line2,
    200,
    "Complément d’adresse"
  );
  const company_postal_code = optionalTextField(
    src.company_postal_code,
    20,
    "NPA / Code postal"
  );
  if (company_postal_code && !POSTAL_RE.test(company_postal_code)) {
    throw new Error(
      "NPA / Code postal : lettres, chiffres, espaces et tirets uniquement"
    );
  }
  const company_city = optionalTextField(src.company_city, 120, "Localité");
  const company_region = optionalTextField(
    src.company_region,
    120,
    "Canton / Région"
  );
  const company_country = optionalTextField(src.company_country, 120, "Pays");

  const description = clean(src.description, 2000);
  const websiteRaw = clean(src.website, 300);
  const bank_name = clean(src.bank_name, 120);
  const ibanRaw = clean(src.iban, 42);

  return {
    company_name,
    company_email: company_email || null,
    company_phone: company_phone || null,
    company_address: company_address || null,
    company_address_line2: company_address_line2 || null,
    company_postal_code: company_postal_code || null,
    company_city: company_city || null,
    company_region: company_region || null,
    company_country: company_country || null,
    public_page_website_url: normalizeWebsite(websiteRaw),
    public_page_description: description || null,
    iban: normalizeIban(ibanRaw),
    bank_name: bank_name || null,
  };
}
