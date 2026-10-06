import { describe, expect, it } from "vitest";
import { documentDetailFailure, documentIdFromRoute } from "@/lib/documents/detailNavigation";
import { isUuid } from "@/lib/documents/documentRef";

const DOC = "aaaaaaaa-bbbb-0ccc-7ddd-eeeeeeeeeeee";

describe("ouverture d’une fiche document", () => {
  it("lit l’identifiant dans l’URL même si le paramètre de route est encore vide", () => {
    expect(documentIdFromRoute(undefined, `/tableau-de-bord/devis/${DOC}`, "devis")).toBe(DOC);
    expect(documentIdFromRoute(DOC, "/tableau-de-bord/devis", "devis")).toBe(DOC);
    expect(documentIdFromRoute(undefined, "/tableau-de-bord/devis", "devis")).toBe("");
    expect(documentIdFromRoute(undefined, "/tableau-de-bord/devis/nouveau", "devis")).toBe("");
  });

  it("ne traite pas un échec de chargement comme un retour à la liste", () => {
    expect(documentDetailFailure({
      ok: false,
      document: null,
      expectedType: "quote",
      error: "Document introuvable",
      fallback: "Erreur",
    })).toBe("Document introuvable");
    expect(documentDetailFailure({
      ok: true,
      document: { type: "invoice" },
      expectedType: "quote",
      fallback: "Erreur",
    })).toMatch(/pas une cotisation/);
    expect(documentDetailFailure({
      ok: true,
      document: { type: "quote" },
      expectedType: "quote",
      fallback: "Erreur",
    })).toBeNull();
  });

  it("accepte un identifiant technique que Postgres considère comme un UUID", () => {
    expect(isUuid(DOC)).toBe(true);
    expect(isUuid("143")).toBe(false);
    expect(isUuid("COT-2026-007")).toBe(false);
  });
});
