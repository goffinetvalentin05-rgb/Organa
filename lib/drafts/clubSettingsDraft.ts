import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const CLUB_SETTINGS_DRAFT_VERSION = 1 as const;

/**
 * Champs métier sûrs uniquement.
 * Exclus volontairement : resendApiKey, resendApiKeyTouched, tokens, File logo.
 */
export type ClubSettingsDraftData = {
  nomEntreprise: string;
  adresse: string;
  email: string;
  telephone: string;
  styleEnTete: "simple" | "moderne" | "classique";
  emailExpediteur: string;
  nomExpediteur: string;
  emailCustomEnabled: boolean;
  iban: string;
  bankName: string;
  conditionsPaiement: string;
  primaryColor: string;
  currency: string;
  invoiceColor: string;
  branding: string;
  qrCreditorName: string;
  qrCreditorStreet: string;
  qrCreditorBuildingNum: string;
  qrCreditorZip: string;
  qrCreditorCity: string;
  qrCreditorCountry: string;
};

export function emptyClubSettingsDraftData(): ClubSettingsDraftData {
  return {
    nomEntreprise: "",
    adresse: "",
    email: "",
    telephone: "",
    styleEnTete: "moderne",
    emailExpediteur: "",
    nomExpediteur: "",
    emailCustomEnabled: false,
    iban: "",
    bankName: "",
    conditionsPaiement: "",
    primaryColor: "",
    currency: "",
    invoiceColor: "",
    branding: "",
    qrCreditorName: "",
    qrCreditorStreet: "",
    qrCreditorBuildingNum: "",
    qrCreditorZip: "",
    qrCreditorCity: "",
    qrCreditorCountry: "CH",
  };
}

const STYLE_VALUES = new Set(["simple", "moderne", "classique"]);

export function normalizeClubSettingsDraftData(
  raw: unknown
): ClubSettingsDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  // Refuse explicitement toute clé secrète si présente dans un ancien draft.
  if ("resendApiKey" in d || "resendApiKeyTouched" in d) {
    // On ignore ces champs plutôt que de rejeter tout le draft.
  }

  const styleEnTete =
    typeof d.styleEnTete === "string" && STYLE_VALUES.has(d.styleEnTete)
      ? (d.styleEnTete as ClubSettingsDraftData["styleEnTete"])
      : "moderne";

  return {
    nomEntreprise: typeof d.nomEntreprise === "string" ? d.nomEntreprise : "",
    adresse: typeof d.adresse === "string" ? d.adresse : "",
    email: typeof d.email === "string" ? d.email : "",
    telephone: typeof d.telephone === "string" ? d.telephone : "",
    styleEnTete,
    emailExpediteur: typeof d.emailExpediteur === "string" ? d.emailExpediteur : "",
    nomExpediteur: typeof d.nomExpediteur === "string" ? d.nomExpediteur : "",
    emailCustomEnabled: Boolean(d.emailCustomEnabled),
    iban: typeof d.iban === "string" ? d.iban : "",
    bankName: typeof d.bankName === "string" ? d.bankName : "",
    conditionsPaiement:
      typeof d.conditionsPaiement === "string" ? d.conditionsPaiement : "",
    primaryColor: typeof d.primaryColor === "string" ? d.primaryColor : "",
    currency: typeof d.currency === "string" ? d.currency : "",
    invoiceColor: typeof d.invoiceColor === "string" ? d.invoiceColor : "",
    branding: typeof d.branding === "string" ? d.branding : "",
    qrCreditorName: typeof d.qrCreditorName === "string" ? d.qrCreditorName : "",
    qrCreditorStreet:
      typeof d.qrCreditorStreet === "string" ? d.qrCreditorStreet : "",
    qrCreditorBuildingNum:
      typeof d.qrCreditorBuildingNum === "string" ? d.qrCreditorBuildingNum : "",
    qrCreditorZip: typeof d.qrCreditorZip === "string" ? d.qrCreditorZip : "",
    qrCreditorCity: typeof d.qrCreditorCity === "string" ? d.qrCreditorCity : "",
    qrCreditorCountry:
      typeof d.qrCreditorCountry === "string" ? d.qrCreditorCountry : "CH",
  };
}

export function isMeaningfulClubSettingsDraft(
  data: ClubSettingsDraftData
): boolean {
  return Object.entries(data).some(([key, value]) => {
    if (key === "styleEnTete") return value !== "moderne";
    if (key === "emailCustomEnabled") return value === true;
    if (key === "qrCreditorCountry") return value !== "CH" && value !== "";
    if (typeof value === "string") return value.trim().length > 0;
    return false;
  });
}

/** Garantit qu’aucune clé secrète n’est sérialisée. */
export function toClubSettingsDraftPayload(
  form: Record<string, unknown>
): ClubSettingsDraftData {
  const normalized = normalizeClubSettingsDraftData(form);
  return normalized ?? emptyClubSettingsDraftData();
}

export const clubSettingsDraftStore = createLocalDraftStore<ClubSettingsDraftData>({
  version: CLUB_SETTINGS_DRAFT_VERSION,
  product: "sport",
  formType: "club-settings",
  isMeaningful: isMeaningfulClubSettingsDraft,
  normalize: normalizeClubSettingsDraftData,
});
