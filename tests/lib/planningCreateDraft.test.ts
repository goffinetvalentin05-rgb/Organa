import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPlanningCreateDraft,
  createDefaultPlanningSlots,
  emptyPlanningCreateDraftData,
  hasMeaningfulDraftData,
  loadPlanningCreateDraft,
  parsePlanningCreateDraft,
  planningCreateDraftStorageKey,
  savePlanningCreateDraft,
  type PlanningCreateDraftData,
} from "@/lib/planning/planningCreateDraft";

function sampleData(overrides: Partial<PlanningCreateDraftData> = {}): PlanningCreateDraftData {
  return {
    ...emptyPlanningCreateDraftData(),
    name: "Braderie",
    date: "2026-09-12",
    slots: [
      {
        id: "1",
        location: "Bar",
        slotDate: "2026-09-12",
        startTime: "09:00",
        endTime: "12:00",
        requiredPeople: 4,
        notes: "Café",
      },
    ],
    ...overrides,
  };
}

describe("planningCreateDraft", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clé localStorage scoped club + produit", () => {
    expect(planningCreateDraftStorageKey("club-a")).toBe(
      "obillz:planning-draft:sport:club-a"
    );
  });

  it("ignore le formulaire initial vide", () => {
    expect(hasMeaningfulDraftData(emptyPlanningCreateDraftData())).toBe(false);
  });

  it("détecte un travail réel (nom, créneaux, etc.)", () => {
    expect(hasMeaningfulDraftData(sampleData())).toBe(true);
    expect(
      hasMeaningfulDraftData({
        ...emptyPlanningCreateDraftData(),
        slots: [
          ...createDefaultPlanningSlots(),
          {
            id: "2",
            location: "",
            slotDate: "",
            startTime: "08:00",
            endTime: "10:00",
            requiredPeople: 1,
            notes: "",
          },
        ],
      })
    ).toBe(true);
  });

  it("parse un brouillon valide et refuse JSON invalide / mauvaise version / autre club", () => {
    const clubId = "club-fc";
    const saved = savePlanningCreateDraft(clubId, sampleData());
    expect(saved.saved).toBe(true);

    const loaded = loadPlanningCreateDraft(clubId);
    expect(loaded?.data.name).toBe("Braderie");
    expect(loaded?.data.slots[0]?.requiredPeople).toBe(4);

    expect(parsePlanningCreateDraft("{not-json", clubId)).toBeNull();
    expect(
      parsePlanningCreateDraft(
        JSON.stringify({
          version: 99,
          clubId,
          product: "sport",
          savedAt: new Date().toISOString(),
          data: sampleData(),
        }),
        clubId
      )
    ).toBeNull();
    expect(loadPlanningCreateDraft("other-club")).toBeNull();

    clearPlanningCreateDraft(clubId);
    expect(loadPlanningCreateDraft(clubId)).toBeNull();
  });

  it("efface le brouillon si les données redeviennent vides", () => {
    const clubId = "club-empty";
    savePlanningCreateDraft(clubId, sampleData());
    expect(loadPlanningCreateDraft(clubId)).not.toBeNull();

    const result = savePlanningCreateDraft(clubId, emptyPlanningCreateDraftData());
    expect(result.saved).toBe(false);
    expect(loadPlanningCreateDraft(clubId)).toBeNull();
  });
});
