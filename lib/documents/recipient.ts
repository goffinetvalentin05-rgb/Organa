export type RecipientType = "member" | "sponsor" | "external";

export type ExternalRecipientData = {
  name: string;
  contactName?: string;
  address: string;
  postalCode: string;
  city: string;
  country?: string;
  email?: string;
  phone?: string;
};

export type ResolvedRecipient = {
  type: RecipientType;
  name: string;
  contactName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  clientId?: string | null;
  sponsorContractId?: string | null;
};

type ClientLike = {
  id?: string;
  nom?: string | null;
  name?: string | null;
  email?: string | null;
  telephone?: string | null;
  phone?: string | null;
  adresse?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
};

type SponsorLike = {
  id?: string;
  sponsor_name?: string | null;
  sponsorName?: string | null;
  title?: string | null;
};

export type DocumentRecipientSource = {
  recipient_type?: string | null;
  client_id?: string | null;
  sponsor_contract_id?: string | null;
  recipient_data?: unknown;
  external_recipient_name?: string | null;
  external_recipient_contact_name?: string | null;
  external_recipient_address?: string | null;
  external_recipient_zip?: string | null;
  external_recipient_city?: string | null;
  external_recipient_country?: string | null;
  external_recipient_email?: string | null;
  external_recipient_phone?: string | null;
  client?: ClientLike | ClientLike[] | null;
  sponsor?: SponsorLike | SponsorLike[] | null;
};

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return "";
}

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function parseExternalRecipientData(
  raw: unknown
): ExternalRecipientData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = firstString(r.name);
  const address = firstString(r.address);
  const postalCode = firstString(r.postalCode, r.postal_code);
  const city = firstString(r.city);
  if (!name || !address || !postalCode || !city) return null;
  return {
    name,
    contactName: firstString(r.contactName, r.contact_name) || undefined,
    address,
    postalCode,
    city,
    country: firstString(r.country) || undefined,
    email: firstString(r.email) || undefined,
    phone: firstString(r.phone, r.telephone) || undefined,
  };
}

/** Lit le destinataire externe depuis les colonnes DB ou le JSONB legacy. */
export function parseExternalRecipientFromDocument(
  doc: DocumentRecipientSource | Record<string, unknown>
): ExternalRecipientData | null {
  const d = doc as DocumentRecipientSource;
  const name = firstString(d.external_recipient_name);
  if (name) {
    const address = firstString(d.external_recipient_address);
    const postalCode = firstString(d.external_recipient_zip);
    const city = firstString(d.external_recipient_city);
    if (address && postalCode && city) {
      return {
        name,
        contactName: firstString(d.external_recipient_contact_name) || undefined,
        address,
        postalCode,
        city,
        country: firstString(d.external_recipient_country) || undefined,
        email: firstString(d.external_recipient_email) || undefined,
        phone: firstString(d.external_recipient_phone) || undefined,
      };
    }
  }
  return parseExternalRecipientData(d.recipient_data);
}

export function externalRecipientToDbColumns(
  data: ExternalRecipientData
): Record<string, string | null> {
  return {
    external_recipient_name: data.name,
    external_recipient_contact_name: data.contactName ?? null,
    external_recipient_address: data.address,
    external_recipient_zip: data.postalCode,
    external_recipient_city: data.city,
    external_recipient_country: data.country ?? null,
    external_recipient_email: data.email ?? null,
    external_recipient_phone: data.phone ?? null,
  };
}

export function clearExternalRecipientDbColumns(): Record<string, null> {
  return {
    external_recipient_name: null,
    external_recipient_contact_name: null,
    external_recipient_address: null,
    external_recipient_zip: null,
    external_recipient_city: null,
    external_recipient_country: null,
    external_recipient_email: null,
    external_recipient_phone: null,
  };
}

export function buildInvoiceRecipientDbFields(input: {
  type: RecipientType;
  clientId?: string | null;
  sponsorContractId?: string | null;
  external?: ExternalRecipientData | null;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    recipient_type: input.type,
    client_id: null,
    sponsor_contract_id: null,
    recipient_data: null,
    ...clearExternalRecipientDbColumns(),
  };

  if (input.type === "member") {
    base.client_id = input.clientId ?? null;
    return base;
  }

  if (input.type === "sponsor") {
    base.sponsor_contract_id = input.sponsorContractId ?? null;
    return base;
  }

  if (input.external) {
    Object.assign(base, externalRecipientToDbColumns(input.external));
    base.recipient_data = input.external;
  }

  return base;
}

export function inferRecipientType(doc: DocumentRecipientSource): RecipientType {
  if (
    doc.recipient_type === "member" ||
    doc.recipient_type === "sponsor" ||
    doc.recipient_type === "external"
  ) {
    return doc.recipient_type;
  }
  if (doc.client_id) return "member";
  if (doc.sponsor_contract_id) return "sponsor";
  if (parseExternalRecipientFromDocument(doc)) return "external";
  return "member";
}

export function formatRecipientAddress(r: {
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
}): string {
  const lines: string[] = [];
  if (r.address) lines.push(r.address);
  const cityLine = [r.postalCode, r.city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (r.country) lines.push(r.country);
  return lines.join("\n");
}

export function resolveDocumentRecipient(
  doc: DocumentRecipientSource
): ResolvedRecipient {
  const type = inferRecipientType(doc);

  if (type === "external") {
    const ext = parseExternalRecipientFromDocument(doc);
    return {
      type: "external",
      name: ext?.name || "Destinataire",
      contactName: ext?.contactName,
      address: ext?.address,
      postalCode: ext?.postalCode,
      city: ext?.city,
      country: ext?.country,
      email: ext?.email,
      phone: ext?.phone,
      clientId: null,
      sponsorContractId: null,
    };
  }

  if (type === "sponsor") {
    const sponsor = pickOne(doc.sponsor);
    const name =
      firstString(sponsor?.sponsor_name, sponsor?.sponsorName) ||
      "Sponsor";
    const contactName = firstString(sponsor?.title) || undefined;
    return {
      type: "sponsor",
      name,
      contactName: contactName !== name ? contactName : undefined,
      clientId: null,
      sponsorContractId: doc.sponsor_contract_id ?? null,
    };
  }

  const client = pickOne(doc.client);
  return {
    type: "member",
    name:
      firstString(client?.nom, client?.name) || "Membre",
    email: firstString(client?.email) || undefined,
    phone:
      firstString(client?.telephone, client?.phone) || undefined,
    address:
      firstString(client?.adresse, client?.address) || undefined,
    postalCode: firstString(client?.postal_code) || undefined,
    city: firstString(client?.city) || undefined,
    clientId: doc.client_id ?? client?.id ?? null,
    sponsorContractId: null,
  };
}

export function validateInvoiceRecipientInput(input: {
  recipientType?: string;
  clientId?: string;
  sponsorContractId?: string;
  recipientData?: unknown;
}): { ok: true; type: RecipientType } | { ok: false; error: string } {
  const type = (input.recipientType || "member") as RecipientType;

  if (type !== "member" && type !== "sponsor" && type !== "external") {
    return { ok: false, error: "Type de destinataire invalide" };
  }

  if (type === "member") {
    if (!input.clientId) {
      return { ok: false, error: "Membre requis" };
    }
    return { ok: true, type };
  }

  if (type === "sponsor") {
    if (!input.sponsorContractId) {
      return { ok: false, error: "Sponsor requis" };
    }
    return { ok: true, type };
  }

  const ext = parseExternalRecipientData(input.recipientData);
  if (!ext) {
    return {
      ok: false,
      error:
        "Informations du destinataire externe incomplètes (nom, adresse, NPA et localité requis)",
    };
  }

  return { ok: true, type };
}

export function recipientToApi(recipient: ResolvedRecipient) {
  return {
    type: recipient.type,
    name: recipient.name,
    contactName: recipient.contactName ?? null,
    address: recipient.address ?? null,
    postalCode: recipient.postalCode ?? null,
    city: recipient.city ?? null,
    country: recipient.country ?? null,
    email: recipient.email ?? null,
    phone: recipient.phone ?? null,
    clientId: recipient.clientId ?? null,
    sponsorContractId: recipient.sponsorContractId ?? null,
    formattedAddress: formatRecipientAddress(recipient) || null,
  };
}
