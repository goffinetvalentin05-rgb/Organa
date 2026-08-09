import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const ASSOCIATION_SETTINGS_DRAFT_VERSION = 1 as const;

/**
 * product = association — isolation stricte vs sport.
 * Exclus : pendingFile (File), previewUrl blob, secrets/auth.
 */
export type AssociationSettingsDraftData = {
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
  logo_url: string | null;
  /** true si un File logo était sélectionné (non persisté). */
  logoPendingReselect: boolean;
};

export function emptyAssociationSettingsDraftData(): AssociationSettingsDraftData {
  return {
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    company_address_line2: "",
    company_postal_code: "",
    company_city: "",
    company_region: "",
    company_country: "",
    website: "",
    description: "",
    iban: "",
    bank_name: "",
    logo_url: null,
    logoPendingReselect: false,
  };
}

export function normalizeAssociationSettingsDraftData(
  raw: unknown
): AssociationSettingsDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  return {
    company_name: typeof d.company_name === "string" ? d.company_name : "",
    company_email: typeof d.company_email === "string" ? d.company_email : "",
    company_phone: typeof d.company_phone === "string" ? d.company_phone : "",
    company_address: typeof d.company_address === "string" ? d.company_address : "",
    company_address_line2:
      typeof d.company_address_line2 === "string" ? d.company_address_line2 : "",
    company_postal_code:
      typeof d.company_postal_code === "string" ? d.company_postal_code : "",
    company_city: typeof d.company_city === "string" ? d.company_city : "",
    company_region: typeof d.company_region === "string" ? d.company_region : "",
    company_country: typeof d.company_country === "string" ? d.company_country : "",
    website: typeof d.website === "string" ? d.website : "",
    description: typeof d.description === "string" ? d.description : "",
    iban: typeof d.iban === "string" ? d.iban : "",
    bank_name: typeof d.bank_name === "string" ? d.bank_name : "",
    logo_url: typeof d.logo_url === "string" ? d.logo_url : null,
    logoPendingReselect: Boolean(d.logoPendingReselect),
  };
}

export function isMeaningfulAssociationSettingsDraft(
  data: AssociationSettingsDraftData
): boolean {
  if (data.company_name.trim()) return true;
  if (data.company_email.trim()) return true;
  if (data.company_phone.trim()) return true;
  if (data.company_address.trim()) return true;
  if (data.company_address_line2.trim()) return true;
  if (data.company_postal_code.trim()) return true;
  if (data.company_city.trim()) return true;
  if (data.company_region.trim()) return true;
  if (data.company_country.trim()) return true;
  if (data.website.trim()) return true;
  if (data.description.trim()) return true;
  if (data.iban.trim()) return true;
  if (data.bank_name.trim()) return true;
  if (data.logo_url?.trim()) return true;
  if (data.logoPendingReselect) return true;
  return false;
}

export const associationSettingsDraftStore =
  createLocalDraftStore<AssociationSettingsDraftData>({
    version: ASSOCIATION_SETTINGS_DRAFT_VERSION,
    product: "association",
    formType: "association-settings",
    isMeaningful: isMeaningfulAssociationSettingsDraft,
    normalize: normalizeAssociationSettingsDraftData,
  });
