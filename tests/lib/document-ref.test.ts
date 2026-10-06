import { describe, expect, it, vi } from "vitest";
import { isUuid, numeroMatchesVisible, resolveClubDocumentId } from "@/lib/documents/documentRef";
import { allocateDocumentNumero, formatDocumentNumero } from "@/lib/documents/allocateNumero";
import { accountIdFromRef } from "@/lib/accounting/technicalId";
import { loadTransitoryFacts } from "@/lib/accounting/transitoryLoad";

const CLUB = "657c2be5-6b67-4ef3-96fa-130e68cbc229";

describe("référence de document", () => {
  it("refuse d'envoyer le numéro visible 143 comme UUID", () => {
    expect(isUuid("143")).toBe(false);
    expect(isUuid("FAC-2026-143")).toBe(false);
    expect(isUuid(CLUB)).toBe(true);
  });

  it("rapproche 143 du numéro affiché, pas d'un autre suffixe", () => {
    expect(numeroMatchesVisible("143", "143")).toBe(true);
    expect(numeroMatchesVisible("FAC-2026-143", "143")).toBe(true);
    expect(numeroMatchesVisible("FAC-2026-0143", "143")).toBe(true);
    expect(numeroMatchesVisible("FAC-2026-1143", "143")).toBe(false);
    expect(numeroMatchesVisible("COT-2026-143", "FAC-2026-143")).toBe(false);
  });

  it("résout le numéro avant toute lecture de la colonne id", async () => {
    const filters: Array<[string, string]> = [];
    const query = {
      select: () => query,
      eq: (column: string, value: string) => {
        filters.push([column, value]);
        return query;
      },
      is: () => query,
      ilike: () => query,
      then: (resolve: (value: unknown) => unknown) =>
        resolve({
          data: [{ id: "00000000-0000-4000-8000-000000000143", numero: "FAC-2026-143" }],
          error: null,
        }),
    };
    const admin = { from: () => query };
    const resolved = await resolveClubDocumentId(admin as never, CLUB, "143");
    expect(resolved).toEqual({ ok: true, id: "00000000-0000-4000-8000-000000000143" });
    expect(filters.some(([column]) => column === "id")).toBe(false);
  });
});

describe("compteur de numéros", () => {
  it("formate le numéro visible à partir de la séquence réservée", () => {
    expect(formatDocumentNumero("invoice", 2026, 143)).toBe("FAC-2026-143");
    expect(formatDocumentNumero("quote", 2026, 7)).toBe("COT-2026-007");
  });

  it("n'appelle pas la base si la fonction de réservation n'existe pas encore", async () => {
    const admin = { from: vi.fn() };
    await expect(allocateDocumentNumero(admin as never, CLUB, "invoice", 2026)).resolves.toBeNull();
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("prend le numéro rendu par la réservation atomique", async () => {
    const admin = { rpc: vi.fn().mockResolvedValue({ data: 12, error: null }) };
    await expect(allocateDocumentNumero(admin as never, CLUB, "invoice", 2026)).resolves.toBe("FAC-2026-012");
    expect(admin.rpc).toHaveBeenCalledWith("reserve_document_sequence", {
      p_club: CLUB,
      p_type: "invoice",
      p_year: 2026,
    });
  });
});

describe("identifiants comptables", () => {
  const accounts = [
    { id: "00000000-0000-4000-8000-0000000000aa", number: "143" },
    { id: "00000000-0000-4000-8000-0000000000bb", number: "1020" },
  ];

  it("traduit le numéro de compte 143 avant une requête UUID", () => {
    expect(accountIdFromRef(accounts, "143")).toBe(accounts[0].id);
    expect(accountIdFromRef(accounts, accounts[1].id)).toBe(accounts[1].id);
  });

  it("refuse un numéro ambigu sans interroger une colonne UUID", () => {
    expect(() => accountIdFromRef([...accounts, { id: "00000000-0000-4000-8000-0000000000cc", number: "143" }], "143"))
      .toThrow(/Plusieurs comptes/);
  });
});

describe("écritures transitoires", () => {
  it("rejette le numéro visible avant de filtrer source_id", async () => {
    const admin = { from: vi.fn() };
    await expect(loadTransitoryFacts(admin as never, {
      clubId: CLUB,
      documentId: "143",
      categoryCode: "memberships",
    })).rejects.toThrow(/numéro visible/);
    expect(admin.from).not.toHaveBeenCalled();
  });
});
