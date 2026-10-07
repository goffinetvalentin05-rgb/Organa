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

  it("ouvre l'identifiant technique 126 même si le numéro commercial est COT-2026-007", async () => {
    const otherClub = "11111111-1111-4111-8111-111111111111";
    const uuidId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const rows = [
      { id: "126", numero: "COT-2026-007", user_id: CLUB },
      { id: "50", numero: "FAC-2026-126", user_id: CLUB },
      { id: "88", numero: "COT-2026-007", user_id: otherClub },
      { id: "77", numero: "COT-2026-099", user_id: otherClub },
      { id: uuidId, numero: "FAC-2026-001", user_id: CLUB },
    ];
    const seen: string[] = [];

    const admin = {
      from: () => {
        const filters: Array<[string, string]> = [];
        const query = {
          select: () => query,
          eq: (column: string, value: string) => {
            filters.push([column, value]);
            return query;
          },
          is: () => query,
          ilike: () => {
            throw new Error("recherche de numéro non demandée");
          },
          maybeSingle: async () => {
            const club = filters.find(([column]) => column === "user_id")?.[1];
            const id = filters.find(([column]) => column === "id")?.[1];
            seen.push(`id:${id}@${club}`);
            const row = rows.find((item) => item.id === id && (club ? item.user_id === club : true));
            return { data: row ? { id: row.id } : null, error: null };
          },
          then: (resolve: (value: unknown) => unknown) => {
            const club = filters.find(([column]) => column === "user_id")?.[1];
            const numero = filters.find(([column]) => column === "numero")?.[1];
            seen.push(`numero:${numero}@${club}`);
            const data = rows.filter((item) => item.numero === numero && (club ? item.user_id === club : true));
            return resolve({ data, error: null });
          },
        };
        return query;
      },
    };

    await expect(resolveClubDocumentId(admin as never, CLUB, "126")).resolves.toEqual({
      ok: true,
      id: "126",
    });
    const callsBeforeUuid = seen.length;
    await expect(resolveClubDocumentId(admin as never, CLUB, uuidId)).resolves.toEqual({
      ok: true,
      id: uuidId,
    });
    expect(seen.length).toBe(callsBeforeUuid);
    await expect(resolveClubDocumentId(admin as never, CLUB, "COT-2026-007")).resolves.toEqual({
      ok: true,
      id: "126",
    });
    await expect(resolveClubDocumentId(admin as never, CLUB, "77")).resolves.toEqual({
      ok: false,
      status: 404,
      error: "Document introuvable",
    });
    expect(seen).toEqual([
      `id:126@${CLUB}`,
      `numero:COT-2026-007@${CLUB}`,
      `id:77@${CLUB}`,
    ]);
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
  it("rejette le numéro commercial avant de filtrer source_id", async () => {
    const admin = { from: vi.fn() };
    await expect(loadTransitoryFacts(admin as never, {
      clubId: CLUB,
      documentId: "COT-2026-007",
      categoryCode: "membership",
    })).rejects.toThrow(/numéro visible/);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("accepte l'identifiant technique 184 sans l'envoyer dans source_id", async () => {
    const filters: string[] = [];
    const admin = {
      from: (table: string) => {
        const query = {
          select: () => query,
          eq: (column: string, value: string) => {
            filters.push(`${table}.${column}=${value}`);
            return query;
          },
          order: () => query,
          in: () => query,
          maybeSingle: async () => ({ data: null, error: null }),
          then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null }),
        };
        return query;
      },
    };

    const facts = await loadTransitoryFacts(admin as never, {
      clubId: CLUB,
      documentId: "184",
      categoryCode: "membership",
      sourceType: "membership",
    });

    expect(facts.ready).toBe(true);
    expect(filters).toContain("document_receipts.document_id=184");
    expect(filters.some((filter) => filter.startsWith("accounting_entries.source_id="))).toBe(false);
  });
});
