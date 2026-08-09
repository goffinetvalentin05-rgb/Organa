import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const MARKETING_CAMPAIGN_DRAFT_VERSION = 1 as const;

export type MarketingCampaignAudienceMode = "all" | "source" | "manual";

export type MarketingCampaignDraftData = {
  name: string;
  subject: string;
  contentHtml: string;
  audienceMode: MarketingCampaignAudienceMode;
  audienceSource: string;
  selectedContactIds: string[];
};

const DEFAULT_HTML = "<p>Bonjour,</p><p>Votre message ici.</p>";

export function emptyMarketingCampaignDraftData(): MarketingCampaignDraftData {
  return {
    name: "",
    subject: "",
    contentHtml: DEFAULT_HTML,
    audienceMode: "all",
    audienceSource: "",
    selectedContactIds: [],
  };
}

export function normalizeMarketingCampaignDraftData(
  raw: unknown
): MarketingCampaignDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  const audienceMode: MarketingCampaignAudienceMode =
    d.audienceMode === "source" || d.audienceMode === "manual"
      ? d.audienceMode
      : "all";

  const selectedContactIds = Array.isArray(d.selectedContactIds)
    ? d.selectedContactIds.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      )
    : [];

  return {
    name: typeof d.name === "string" ? d.name : "",
    subject: typeof d.subject === "string" ? d.subject : "",
    contentHtml:
      typeof d.contentHtml === "string" && d.contentHtml
        ? d.contentHtml
        : DEFAULT_HTML,
    audienceMode,
    audienceSource: typeof d.audienceSource === "string" ? d.audienceSource : "",
    selectedContactIds,
  };
}

export function isMeaningfulMarketingCampaignDraft(
  data: MarketingCampaignDraftData
): boolean {
  if (data.name.trim()) return true;
  if (data.subject.trim()) return true;
  if (data.audienceSource.trim()) return true;
  if (data.selectedContactIds.length > 0) return true;
  if (data.audienceMode !== "all") return true;
  const html = data.contentHtml.trim();
  if (html && html !== DEFAULT_HTML) return true;
  return false;
}

export const marketingCampaignDraftStore =
  createLocalDraftStore<MarketingCampaignDraftData>({
    version: MARKETING_CAMPAIGN_DRAFT_VERSION,
    product: "sport",
    formType: "marketing-campaign",
    isMeaningful: isMeaningfulMarketingCampaignDraft,
    normalize: normalizeMarketingCampaignDraftData,
  });
