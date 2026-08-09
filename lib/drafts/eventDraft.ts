import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const EVENT_DRAFT_VERSION = 1 as const;

export type EventDraftData = {
  name: string;
  eventTypeId: string;
  startDate: string;
  endDate: string;
  description: string;
  status: "planned" | "completed";
};

export function emptyEventDraftData(): EventDraftData {
  return {
    name: "",
    eventTypeId: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "planned",
  };
}

export function normalizeEventDraftData(raw: unknown): EventDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  return {
    name: typeof d.name === "string" ? d.name : "",
    eventTypeId: typeof d.eventTypeId === "string" ? d.eventTypeId : "",
    startDate: typeof d.startDate === "string" ? d.startDate : "",
    endDate: typeof d.endDate === "string" ? d.endDate : "",
    description: typeof d.description === "string" ? d.description : "",
    status: d.status === "completed" ? "completed" : "planned",
  };
}

export function isMeaningfulEventDraft(data: EventDraftData): boolean {
  if (data.name.trim()) return true;
  if (data.eventTypeId.trim()) return true;
  if (data.startDate) return true;
  if (data.endDate) return true;
  if (data.description.trim()) return true;
  if (data.status !== "planned") return true;
  return false;
}

export const eventDraftStore = createLocalDraftStore<EventDraftData>({
  version: EVENT_DRAFT_VERSION,
  product: "sport",
  formType: "event",
  isMeaningful: isMeaningfulEventDraft,
  normalize: normalizeEventDraftData,
});
