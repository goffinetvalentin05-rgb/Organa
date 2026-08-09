import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const SPONSOR_CONTRACT_DRAFT_VERSION = 1 as const;

export type SponsorContractDraftData = {
  sponsorName: string;
  title: string;
  amount: string;
  startDate: string;
  endMode: "fixed" | "duration";
  endDate: string;
  durationMonths: string;
  content: string;
  sponsorType: "" | "gold" | "silver" | "bronze";
};

export function emptySponsorContractDraftData(
  overrides: Partial<SponsorContractDraftData> = {}
): SponsorContractDraftData {
  return {
    sponsorName: "",
    title: "",
    amount: "",
    startDate: "",
    endMode: "fixed",
    endDate: "",
    durationMonths: "12",
    content: "",
    sponsorType: "",
    ...overrides,
  };
}

export function normalizeSponsorContractDraftData(
  raw: unknown
): SponsorContractDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const endMode = d.endMode === "duration" ? "duration" : "fixed";
  const sponsorType =
    d.sponsorType === "gold" ||
    d.sponsorType === "silver" ||
    d.sponsorType === "bronze"
      ? d.sponsorType
      : "";

  return {
    sponsorName: typeof d.sponsorName === "string" ? d.sponsorName : "",
    title: typeof d.title === "string" ? d.title : "",
    amount: typeof d.amount === "string" ? d.amount : "",
    startDate: typeof d.startDate === "string" ? d.startDate : "",
    endMode,
    endDate: typeof d.endDate === "string" ? d.endDate : "",
    durationMonths:
      typeof d.durationMonths === "string" ? d.durationMonths : "12",
    content: typeof d.content === "string" ? d.content : "",
    sponsorType,
  };
}

export function isMeaningfulSponsorContractDraft(
  data: SponsorContractDraftData
): boolean {
  if (data.sponsorName.trim()) return true;
  if (data.title.trim()) return true;
  if (data.amount.trim()) return true;
  if (data.startDate) return true;
  if (data.endDate) return true;
  if (data.content.trim()) return true;
  if (data.sponsorType) return true;
  if (data.endMode !== "fixed") return true;
  if (data.durationMonths.trim() && data.durationMonths !== "12") return true;
  return false;
}

export const sponsorContractDraftStore =
  createLocalDraftStore<SponsorContractDraftData>({
    version: SPONSOR_CONTRACT_DRAFT_VERSION,
    product: "sport",
    formType: "sponsor-contract",
    isMeaningful: isMeaningfulSponsorContractDraft,
    normalize: normalizeSponsorContractDraftData,
  });
