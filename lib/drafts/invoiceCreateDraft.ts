import type { LigneDocument } from "@/lib/utils/calculations";
import type { RecipientType } from "@/lib/documents/recipient";
import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const INVOICE_CREATE_DRAFT_VERSION = 1 as const;

export type InvoiceCreateDraftData = {
  recipientType: RecipientType;
  clientId: string;
  sponsorContractId: string;
  extName: string;
  extContactName: string;
  extAddress: string;
  extPostalCode: string;
  extCity: string;
  extCountry: string;
  extEmail: string;
  extPhone: string;
  eventId: string;
  lignes: LigneDocument[];
  statut: "brouillon" | "envoye" | "paye" | "en-retard";
  dateEcheance: string;
  datePaiement: string;
  notes: string;
};

const DEFAULT_LIGNE = (): LigneDocument => ({
  id: "1",
  designation: "",
  quantite: 1,
  prixUnitaire: 0,
  tva: 7.7,
});

export function emptyInvoiceCreateDraftData(): InvoiceCreateDraftData {
  return {
    recipientType: "member",
    clientId: "",
    sponsorContractId: "",
    extName: "",
    extContactName: "",
    extAddress: "",
    extPostalCode: "",
    extCity: "",
    extCountry: "",
    extEmail: "",
    extPhone: "",
    eventId: "",
    lignes: [DEFAULT_LIGNE()],
    statut: "brouillon",
    dateEcheance: "",
    datePaiement: "",
    notes: "",
  };
}

function normalizeLigne(raw: unknown, index: number): LigneDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  const quantite =
    typeof l.quantite === "number" && Number.isFinite(l.quantite)
      ? l.quantite
      : typeof l.quantite === "string"
        ? Number(l.quantite) || 1
        : 1;
  const prixUnitaire =
    typeof l.prixUnitaire === "number" && Number.isFinite(l.prixUnitaire)
      ? l.prixUnitaire
      : typeof l.prixUnitaire === "string"
        ? Number(l.prixUnitaire) || 0
        : 0;
  const tva =
    typeof l.tva === "number" && Number.isFinite(l.tva)
      ? l.tva
      : typeof l.tva === "string"
        ? Number(l.tva) || 7.7
        : 7.7;

  return {
    id: typeof l.id === "string" && l.id.trim() ? l.id.trim() : `restored-${index + 1}`,
    designation: typeof l.designation === "string" ? l.designation : "",
    description: typeof l.description === "string" ? l.description : undefined,
    quantite,
    prixUnitaire,
    tva,
  };
}

export function normalizeInvoiceCreateDraftData(
  raw: unknown
): InvoiceCreateDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const lignesRaw = Array.isArray(d.lignes) ? d.lignes : null;
  if (!lignesRaw || lignesRaw.length === 0) return null;

  const lignes = lignesRaw
    .map((l, i) => normalizeLigne(l, i))
    .filter((l): l is LigneDocument => l !== null);
  if (lignes.length === 0) return null;

  const recipientType: RecipientType =
    d.recipientType === "sponsor" ||
    d.recipientType === "external" ||
    d.recipientType === "member"
      ? d.recipientType
      : "member";

  const statut =
    d.statut === "envoye" ||
    d.statut === "paye" ||
    d.statut === "en-retard" ||
    d.statut === "brouillon"
      ? d.statut
      : "brouillon";

  return {
    recipientType,
    clientId: typeof d.clientId === "string" ? d.clientId : "",
    sponsorContractId: typeof d.sponsorContractId === "string" ? d.sponsorContractId : "",
    extName: typeof d.extName === "string" ? d.extName : "",
    extContactName: typeof d.extContactName === "string" ? d.extContactName : "",
    extAddress: typeof d.extAddress === "string" ? d.extAddress : "",
    extPostalCode: typeof d.extPostalCode === "string" ? d.extPostalCode : "",
    extCity: typeof d.extCity === "string" ? d.extCity : "",
    extCountry: typeof d.extCountry === "string" ? d.extCountry : "",
    extEmail: typeof d.extEmail === "string" ? d.extEmail : "",
    extPhone: typeof d.extPhone === "string" ? d.extPhone : "",
    eventId: typeof d.eventId === "string" ? d.eventId : "",
    lignes,
    statut,
    dateEcheance: typeof d.dateEcheance === "string" ? d.dateEcheance : "",
    datePaiement: typeof d.datePaiement === "string" ? d.datePaiement : "",
    notes: typeof d.notes === "string" ? d.notes : "",
  };
}

export function isMeaningfulInvoiceCreateDraft(data: InvoiceCreateDraftData): boolean {
  if (data.clientId.trim()) return true;
  if (data.sponsorContractId.trim()) return true;
  if (data.eventId.trim()) return true;
  if (data.extName.trim()) return true;
  if (data.extContactName.trim()) return true;
  if (data.extAddress.trim()) return true;
  if (data.extPostalCode.trim()) return true;
  if (data.extCity.trim()) return true;
  if (data.extCountry.trim()) return true;
  if (data.extEmail.trim()) return true;
  if (data.extPhone.trim()) return true;
  if (data.dateEcheance.trim()) return true;
  if (data.datePaiement.trim()) return true;
  if (data.notes.trim()) return true;
  if (data.recipientType !== "member") return true;
  if (data.statut !== "brouillon") return true;
  if (data.lignes.length > 1) return true;
  return data.lignes.some(
    (l) =>
      l.designation.trim() !== "" ||
      l.quantite !== 1 ||
      l.prixUnitaire !== 0 ||
      (l.tva != null && l.tva !== 7.7) ||
      Boolean(l.description?.trim())
  );
}

export const invoiceCreateDraftStore = createLocalDraftStore<InvoiceCreateDraftData>({
  version: INVOICE_CREATE_DRAFT_VERSION,
  product: "sport",
  formType: "invoice-create",
  isMeaningful: isMeaningfulInvoiceCreateDraft,
  normalize: normalizeInvoiceCreateDraftData,
});
