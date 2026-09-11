import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllLocalDrafts } from "@/lib/drafts/clearLocalDrafts";

describe("clearAllLocalDrafts", () => {
  const storeMap = new Map<string, string>();

  beforeEach(() => {
    storeMap.clear();
    const keys = () => [...storeMap.keys()];
    vi.stubGlobal("localStorage", {
      get length() {
        return storeMap.size;
      },
      key: (i: number) => keys()[i] ?? null,
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

  it("supprime les drafts Obillz, pas les autres clés", () => {
    storeMap.set("obillz:draft:sport:member:club-a", "{}");
    storeMap.set("obillz:planning-draft:sport:club-a", "{}");
    storeMap.set("theme", "dark");
    clearAllLocalDrafts();
    expect(storeMap.has("theme")).toBe(true);
    expect(storeMap.has("obillz:draft:sport:member:club-a")).toBe(false);
    expect(storeMap.has("obillz:planning-draft:sport:club-a")).toBe(false);
  });
});
