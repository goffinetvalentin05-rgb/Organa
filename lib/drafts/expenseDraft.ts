import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const EXPENSE_DRAFT_VERSION = 1 as const;

export type ExpenseDraftData = {
  label: string;
  amount: string;
  date: string;
  status: "a_payer" | "paye";
  notes: string;
  eventId: string;
  /** URL déjà en base (édition) — pas de File. */
  attachmentUrl: string;
  /**
   * true si l’utilisateur avait choisi un fichier local non persisté.
   * Après refresh, le File doit être resélectionné.
   */
  attachmentPending: boolean;
};

export function emptyExpenseDraftData(): ExpenseDraftData {
  return {
    label: "",
    amount: "",
    date: "",
    status: "a_payer",
    notes: "",
    eventId: "",
    attachmentUrl: "",
    attachmentPending: false,
  };
}

export function normalizeExpenseDraftData(raw: unknown): ExpenseDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  // Refuse toute sérialisation File/Blob accidentelle
  if (d.pieceJointe != null && typeof d.pieceJointe === "object") {
    // ignore — ne jamais propager
  }

  return {
    label: typeof d.label === "string" ? d.label : "",
    amount: typeof d.amount === "string" ? d.amount : "",
    date: typeof d.date === "string" ? d.date : "",
    status: d.status === "paye" ? "paye" : "a_payer",
    notes: typeof d.notes === "string" ? d.notes : "",
    eventId: typeof d.eventId === "string" ? d.eventId : "",
    attachmentUrl: typeof d.attachmentUrl === "string" ? d.attachmentUrl : "",
    attachmentPending: Boolean(d.attachmentPending),
  };
}

export function isMeaningfulExpenseDraft(data: ExpenseDraftData): boolean {
  if (data.label.trim()) return true;
  if (data.amount.trim()) return true;
  if (data.date) return true;
  if (data.notes.trim()) return true;
  if (data.eventId.trim()) return true;
  if (data.attachmentUrl.trim()) return true;
  if (data.attachmentPending) return true;
  if (data.status !== "a_payer") return true;
  return false;
}

export const expenseDraftStore = createLocalDraftStore<ExpenseDraftData>({
  version: EXPENSE_DRAFT_VERSION,
  product: "sport",
  formType: "expense",
  isMeaningful: isMeaningfulExpenseDraft,
  normalize: normalizeExpenseDraftData,
});
