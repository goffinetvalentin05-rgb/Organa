import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const BUVETTE_MESSAGE_DRAFT_VERSION = 1 as const;

export type BuvetteMessageKind = "info" | "invoice";

/** Contenu rédigé uniquement — pas d’envoi auto, pas de destinataires. */
export type BuvetteMessageDraftData = {
  kind: BuvetteMessageKind;
  message: string;
  /** Uniquement pour facture — montant saisi avant envoi. */
  amount: string;
};

export function emptyBuvetteMessageDraftData(
  kind: BuvetteMessageKind = "info"
): BuvetteMessageDraftData {
  return {
    kind,
    message: "",
    amount: "",
  };
}

export function normalizeBuvetteMessageDraftData(
  raw: unknown
): BuvetteMessageDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const kind: BuvetteMessageKind = d.kind === "invoice" ? "invoice" : "info";
  return {
    kind,
    message: typeof d.message === "string" ? d.message : "",
    amount: typeof d.amount === "string" ? d.amount : "",
  };
}

export function isMeaningfulBuvetteMessageDraft(
  data: BuvetteMessageDraftData
): boolean {
  if (data.message.trim()) return true;
  if (data.kind === "invoice" && data.amount.trim()) return true;
  return false;
}

export const buvetteMessageDraftStore =
  createLocalDraftStore<BuvetteMessageDraftData>({
    version: BUVETTE_MESSAGE_DRAFT_VERSION,
    product: "sport",
    formType: "buvette-message",
    isMeaningful: isMeaningfulBuvetteMessageDraft,
    normalize: normalizeBuvetteMessageDraftData,
  });
