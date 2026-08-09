/**
 * Brouillon local pour la création de planning.
 * Wrapper autour du store générique — clé legacy conservée (pas de régression).
 */

import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const PLANNING_CREATE_DRAFT_VERSION = 1 as const;

export type PlanningCreateDraftSlot = {
  id: string;
  location: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  requiredPeople: number;
  notes: string;
};

export type PlanningCreateDraftData = {
  name: string;
  description: string;
  date: string;
  eventId: string;
  slots: PlanningCreateDraftSlot[];
};

export type PlanningCreateDraftEnvelope = {
  version: typeof PLANNING_CREATE_DRAFT_VERSION;
  savedAt: string;
  clubId: string;
  product: "sport";
  data: PlanningCreateDraftData;
};

export function createDefaultPlanningSlots(): PlanningCreateDraftSlot[] {
  return [
    {
      id: "1",
      location: "",
      slotDate: "",
      startTime: "08:00",
      endTime: "10:00",
      requiredPeople: 1,
      notes: "",
    },
  ];
}

export function emptyPlanningCreateDraftData(): PlanningCreateDraftData {
  return {
    name: "",
    description: "",
    date: "",
    eventId: "",
    slots: createDefaultPlanningSlots(),
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSlot(raw: unknown, index: number): PlanningCreateDraftSlot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;

  const requiredPeopleRaw = s.requiredPeople;
  const requiredPeople =
    typeof requiredPeopleRaw === "number" && Number.isFinite(requiredPeopleRaw)
      ? Math.max(1, Math.min(50, Math.round(requiredPeopleRaw)))
      : typeof requiredPeopleRaw === "string" && requiredPeopleRaw.trim()
        ? Math.max(1, Math.min(50, parseInt(requiredPeopleRaw, 10) || 1))
        : 1;

  return {
    id: isNonEmptyString(s.id) ? s.id.trim() : `restored-${index + 1}`,
    location: typeof s.location === "string" ? s.location : "",
    slotDate: typeof s.slotDate === "string" ? s.slotDate : "",
    startTime: typeof s.startTime === "string" && s.startTime ? s.startTime : "08:00",
    endTime: typeof s.endTime === "string" && s.endTime ? s.endTime : "10:00",
    requiredPeople,
    notes: typeof s.notes === "string" ? s.notes : "",
  };
}

export function hasMeaningfulDraftData(data: PlanningCreateDraftData): boolean {
  if (data.name.trim()) return true;
  if (data.description.trim()) return true;
  if (data.date) return true;
  if (data.eventId) return true;
  if (!Array.isArray(data.slots) || data.slots.length === 0) return false;
  if (data.slots.length > 1) return true;

  return data.slots.some((slot) => {
    if (slot.location.trim()) return true;
    if (slot.notes.trim()) return true;
    if (slot.slotDate) return true;
    if (slot.requiredPeople !== 1) return true;
    if (slot.startTime && slot.startTime !== "08:00") return true;
    if (slot.endTime && slot.endTime !== "10:00") return true;
    return false;
  });
}

export function normalizePlanningCreateDraftData(
  raw: unknown
): PlanningCreateDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const dataRaw = raw as Record<string, unknown>;
  const slotsRaw = Array.isArray(dataRaw.slots) ? dataRaw.slots : null;
  if (!slotsRaw || slotsRaw.length === 0) return null;

  const slots = slotsRaw
    .map((slot, index) => normalizeSlot(slot, index))
    .filter((slot): slot is PlanningCreateDraftSlot => slot !== null);

  if (slots.length === 0) return null;

  return {
    name: typeof dataRaw.name === "string" ? dataRaw.name : "",
    description: typeof dataRaw.description === "string" ? dataRaw.description : "",
    date: typeof dataRaw.date === "string" ? dataRaw.date : "",
    eventId: typeof dataRaw.eventId === "string" ? dataRaw.eventId : "",
    slots,
  };
}

/** Clé legacy — ne pas changer (brouillons existants). */
export function planningCreateDraftStorageKey(clubId: string): string {
  return `obillz:planning-draft:sport:${clubId}`;
}

export const planningCreateDraftStore = createLocalDraftStore<PlanningCreateDraftData>({
  version: PLANNING_CREATE_DRAFT_VERSION,
  product: "sport",
  formType: "planning-create",
  isMeaningful: hasMeaningfulDraftData,
  normalize: normalizePlanningCreateDraftData,
  allowMissingFormType: true,
  buildStorageKey: (clubId) => planningCreateDraftStorageKey(clubId),
});

export function parsePlanningCreateDraft(
  raw: string,
  expectedClubId: string
): PlanningCreateDraftEnvelope | null {
  const env = planningCreateDraftStore.parse(raw, expectedClubId);
  if (!env) return null;
  return {
    version: PLANNING_CREATE_DRAFT_VERSION,
    savedAt: env.savedAt,
    clubId: env.clubId,
    product: "sport",
    data: env.data,
  };
}

export function loadPlanningCreateDraft(
  clubId: string
): PlanningCreateDraftEnvelope | null {
  const env = planningCreateDraftStore.load(clubId);
  if (!env) return null;
  return {
    version: PLANNING_CREATE_DRAFT_VERSION,
    savedAt: env.savedAt,
    clubId: env.clubId,
    product: "sport",
    data: env.data,
  };
}

export function savePlanningCreateDraft(
  clubId: string,
  data: PlanningCreateDraftData
): { saved: boolean; savedAt: string | null } {
  return planningCreateDraftStore.save(clubId, data);
}

export function clearPlanningCreateDraft(clubId: string): void {
  planningCreateDraftStore.clear(clubId);
}
