import type { LigneDocument } from "@/lib/utils/calculations";
import type { RecipientType } from "@/lib/quotes/recipients";
import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const QUOTE_CREATE_DRAFT_VERSION = 1 as const;

export type QuoteCreateDraftData = {
  recipientType: RecipientType;
  memberId: string;
  teamCategory: string;
  lignes: LigneDocument[];
  statut: "brouillon" | "envoye" | "accepte" | "refuse";
  dateEcheance: string;
  notes: string;
};

const DEFAULT_LIGNE = (): LigneDocument => ({
  id: "1",
  designation: "",
  quantite: 1,
  prixUnitaire: 0,
  tva: 7.7,
});

export function emptyQuoteCreateDraftData(): QuoteCreateDraftData {
  return {
    recipientType: "individual",
    memberId: "",
    teamCategory: "",
    lignes: [DEFAULT_LIGNE()],
    statut: "brouillon",
    dateEcheance: "",
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

export function normalizeQuoteCreateDraftData(
  raw: unknown
): QuoteCreateDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const lignesRaw = Array.isArray(d.lignes) ? d.lignes : null;
  if (!lignesRaw || lignesRaw.length === 0) return null;

  const lignes = lignesRaw
    .map((l, i) => normalizeLigne(l, i))
    .filter((l): l is LigneDocument => l !== null);
  if (lignes.length === 0) return null;

  const recipientType =
    d.recipientType === "team" ||
    d.recipientType === "all" ||
    d.recipientType === "individual"
      ? d.recipientType
      : "individual";

  const statut =
    d.statut === "envoye" ||
    d.statut === "accepte" ||
    d.statut === "refuse" ||
    d.statut === "brouillon"
      ? d.statut
      : "brouillon";

  return {
    recipientType,
    memberId: typeof d.memberId === "string" ? d.memberId : "",
    teamCategory: typeof d.teamCategory === "string" ? d.teamCategory : "",
    lignes,
    statut,
    dateEcheance: typeof d.dateEcheance === "string" ? d.dateEcheance : "",
    notes: typeof d.notes === "string" ? d.notes : "",
  };
}

export function isMeaningfulQuoteCreateDraft(data: QuoteCreateDraftData): boolean {
  if (data.memberId.trim()) return true;
  if (data.teamCategory.trim()) return true;
  if (data.dateEcheance.trim()) return true;
  if (data.notes.trim()) return true;
  if (data.recipientType !== "individual") return true;
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

export const quoteCreateDraftStore = createLocalDraftStore<QuoteCreateDraftData>({
  version: QUOTE_CREATE_DRAFT_VERSION,
  product: "sport",
  formType: "quote-create",
  isMeaningful: isMeaningfulQuoteCreateDraft,
  normalize: normalizeQuoteCreateDraftData,
});
