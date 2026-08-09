/**
 * Brouillon local (localStorage) pour la création de planning.
 * Côté client uniquement — jamais de tokens / credentials.
 */

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

export function planningCreateDraftStorageKey(clubId: string): string {
  return `obillz:planning-draft:sport:${clubId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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

export function parsePlanningCreateDraft(
  raw: string,
  expectedClubId: string
): PlanningCreateDraftEnvelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const env = parsed as Record<string, unknown>;

  if (env.version !== PLANNING_CREATE_DRAFT_VERSION) return null;
  if (typeof env.clubId !== "string" || env.clubId !== expectedClubId) return null;
  if (env.product != null && env.product !== "sport") return null;
  if (!env.data || typeof env.data !== "object") return null;

  const dataRaw = env.data as Record<string, unknown>;
  const slotsRaw = Array.isArray(dataRaw.slots) ? dataRaw.slots : null;
  if (!slotsRaw || slotsRaw.length === 0) return null;

  const slots = slotsRaw
    .map((slot, index) => normalizeSlot(slot, index))
    .filter((slot): slot is PlanningCreateDraftSlot => slot !== null);

  if (slots.length === 0) return null;

  const data: PlanningCreateDraftData = {
    name: typeof dataRaw.name === "string" ? dataRaw.name : "",
    description: typeof dataRaw.description === "string" ? dataRaw.description : "",
    date: typeof dataRaw.date === "string" ? dataRaw.date : "",
    eventId: typeof dataRaw.eventId === "string" ? dataRaw.eventId : "",
    slots,
  };

  if (!hasMeaningfulDraftData(data)) return null;

  return {
    version: PLANNING_CREATE_DRAFT_VERSION,
    savedAt: typeof env.savedAt === "string" ? env.savedAt : new Date(0).toISOString(),
    clubId: expectedClubId,
    product: "sport",
    data,
  };
}

export function loadPlanningCreateDraft(
  clubId: string
): PlanningCreateDraftEnvelope | null {
  if (!isBrowser() || !clubId) return null;
  try {
    const raw = window.localStorage.getItem(planningCreateDraftStorageKey(clubId));
    if (!raw) return null;
    return parsePlanningCreateDraft(raw, clubId);
  } catch {
    return null;
  }
}

export function savePlanningCreateDraft(
  clubId: string,
  data: PlanningCreateDraftData
): { saved: boolean; savedAt: string | null } {
  if (!isBrowser() || !clubId) {
    return { saved: false, savedAt: null };
  }

  if (!hasMeaningfulDraftData(data)) {
    clearPlanningCreateDraft(clubId);
    return { saved: false, savedAt: null };
  }

  const savedAt = new Date().toISOString();
  const envelope: PlanningCreateDraftEnvelope = {
    version: PLANNING_CREATE_DRAFT_VERSION,
    savedAt,
    clubId,
    product: "sport",
    data: {
      name: data.name,
      description: data.description,
      date: data.date,
      eventId: data.eventId,
      slots: data.slots.map((slot) => ({
        id: slot.id,
        location: slot.location,
        slotDate: slot.slotDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        requiredPeople: slot.requiredPeople,
        notes: slot.notes,
      })),
    },
  };

  try {
    window.localStorage.setItem(
      planningCreateDraftStorageKey(clubId),
      JSON.stringify(envelope)
    );
    return { saved: true, savedAt };
  } catch {
    return { saved: false, savedAt: null };
  }
}

export function clearPlanningCreateDraft(clubId: string): void {
  if (!isBrowser() || !clubId) return;
  try {
    window.localStorage.removeItem(planningCreateDraftStorageKey(clubId));
  } catch {
    // ignore quota / private mode
  }
}
