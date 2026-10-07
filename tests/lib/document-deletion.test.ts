import { describe, expect, it } from "vitest";
import { classifyDocumentRemoval, removalMessage } from "@/lib/documents/documentDeletion";

describe("suppression des cotisations et factures", () => {
  it("supprime une cotisation et une facture sans paiement ni écriture", () => {
    expect(classifyDocumentRemoval({
      type: "quote",
      status: "envoye",
      datePaiement: null,
      receiptCount: 0,
      entryCount: 0,
    })).toEqual({ action: "delete", retention: "none" });
    expect(classifyDocumentRemoval({
      type: "invoice",
      status: "brouillon",
      datePaiement: null,
      receiptCount: 0,
      entryCount: 0,
    })).toEqual({ action: "delete", retention: "none" });
  });

  it("archive un document payé et comptabilisé, même si l'exercice est clôturé", () => {
    expect(classifyDocumentRemoval({
      type: "invoice",
      status: "paye",
      datePaiement: "2026-06-07",
      receiptCount: 1,
      entryCount: 1,
    })).toEqual({ action: "archive", retention: "accounting" });
    expect(removalMessage("invoice", "accounting")).toBe(
      "Cette facture est liée à votre comptabilité. Elle sera retirée de la liste des factures. L’écriture comptable, les paiements et le justificatif seront conservés.",
    );
    expect(removalMessage("quote", "accounting")).toBe(
      "Cette cotisation est liée à votre comptabilité. Elle sera retirée de la liste des cotisations. L’écriture comptable, les paiements et le justificatif seront conservés.",
    );
  });

  it("archive un document payé sans écriture, sans le confondre avec une comptabilisation", () => {
    expect(classifyDocumentRemoval({
      type: "quote",
      status: "accepte",
      datePaiement: "2026-09-07",
      receiptCount: 0,
      entryCount: 0,
    })).toEqual({ action: "archive", retention: "payment" });
    expect(removalMessage("quote", "payment")).toBe(
      "Cette cotisation est payée, sans écriture comptable. Elle sera retirée de la liste des cotisations. Le paiement enregistré sera conservé.",
    );
    expect(removalMessage("invoice", "payment")).toBe(
      "Cette facture est payée, sans écriture comptable. Elle sera retirée de la liste des factures. Le paiement enregistré sera conservé.",
    );
  });
});
