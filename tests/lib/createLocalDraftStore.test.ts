import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLocalDraftStorageKey,
  createLocalDraftStore,
} from "@/lib/drafts/createLocalDraftStore";

type SampleData = { title: string; notes: string };

function createSampleStore() {
  return createLocalDraftStore<SampleData>({
    version: 1,
    product: "sport",
    formType: "sample-form",
    isMeaningful: (data) => Boolean(data.title.trim() || data.notes.trim()),
    normalize: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const d = raw as Record<string, unknown>;
      return {
        title: typeof d.title === "string" ? d.title : "",
        notes: typeof d.notes === "string" ? d.notes : "",
      };
    },
  });
}

describe("createLocalDraftStore", () => {
  const storeMap = new Map<string, string>();

  beforeEach(() => {
    storeMap.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storeMap.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storeMap.set(key, value);
      },
      removeItem: (key: string) => {
        storeMap.delete(key);
      },
      clear: () => storeMap.clear(),
    });
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clé versionnée product/formType/clubId/entityId", () => {
    expect(
      buildLocalDraftStorageKey({
        product: "sport",
        formType: "quote-create",
        clubId: "club-a",
      })
    ).toBe("obillz:draft:sport:quote-create:club-a");

    expect(
      buildLocalDraftStorageKey({
        product: "sport",
        formType: "meeting-minutes",
        clubId: "club-a",
        entityId: "pv-1",
      })
    ).toBe("obillz:draft:sport:meeting-minutes:club-a:pv-1");
  });

  it("refresh / navigation : save puis load restaure", () => {
    const store = createSampleStore();
    const saved = store.save("club-a", { title: "Séance", notes: "Points" });
    expect(saved.saved).toBe(true);

    const loaded = store.load("club-a");
    expect(loaded?.data.title).toBe("Séance");
    expect(loaded?.data.notes).toBe("Points");
  });

  it("erreur API simulée : clear non appelé → brouillon conservé", () => {
    const store = createSampleStore();
    store.save("club-a", { title: "Gardé", notes: "" });
    // Pas de clear = échec API
    expect(store.load("club-a")?.data.title).toBe("Gardé");
  });

  it("succès : clear supprime le brouillon", () => {
    const store = createSampleStore();
    store.save("club-a", { title: "OK", notes: "" });
    store.clear("club-a");
    expect(store.load("club-a")).toBeNull();
  });

  it("changement de club : pas de fuite", () => {
    const store = createSampleStore();
    store.save("club-a", { title: "Club A", notes: "" });
    store.save("club-b", { title: "Club B", notes: "" });

    expect(store.load("club-a")?.data.title).toBe("Club A");
    expect(store.load("club-b")?.data.title).toBe("Club B");
    expect(store.load("club-c")).toBeNull();
  });

  it("JSON invalide / version mismatch → aucun crash, null", () => {
    const store = createSampleStore();
    expect(store.parse("{not-json", "club-a")).toBeNull();
    expect(
      store.parse(
        JSON.stringify({
          version: 99,
          clubId: "club-a",
          product: "sport",
          formType: "sample-form",
          savedAt: new Date().toISOString(),
          data: { title: "x", notes: "" },
        }),
        "club-a"
      )
    ).toBeNull();
  });

  it("edit entity A jamais restauré sur entity B", () => {
    const store = createSampleStore();
    store.save("club-a", { title: "PV A", notes: "secret" }, "entity-a");
    store.save("club-a", { title: "PV B", notes: "other" }, "entity-b");

    expect(store.load("club-a", "entity-a")?.data.title).toBe("PV A");
    expect(store.load("club-a", "entity-b")?.data.title).toBe("PV B");
    expect(store.load("club-a", "entity-c")).toBeNull();
    expect(store.load("club-a")).toBeNull();
  });

  it("données vides → clear automatique", () => {
    const store = createSampleStore();
    store.save("club-a", { title: "Tmp", notes: "" });
    const result = store.save("club-a", { title: "", notes: "" });
    expect(result.saved).toBe(false);
    expect(store.load("club-a")).toBeNull();
  });

  it("SSR safe : sans window → load/save no-op", () => {
    vi.unstubAllGlobals();
    const store = createSampleStore();
    expect(store.load("club-a")).toBeNull();
    expect(store.save("club-a", { title: "x", notes: "" }).saved).toBe(false);
  });
});
