import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

describe("ancienne adresse À vérifier", () => {
  it("redirige vers le journal sans changer l’exercice dans l’adresse", async () => {
    const page = (await import("@/app/tableau-de-bord/comptabilite/a-verifier/page")).default;
    expect(() => page()).toThrow("REDIRECT /tableau-de-bord/comptabilite/journal");
  });
});
