import { describe, expect, it } from "vitest";
import { takeoverInputFromBody } from "@/lib/accounting/takeover";
import { readTakeoverFile } from "@/lib/accounting/takeoverImport";
import {
  ACCOUNTING_IMPORT_MAX_BYTES,
  ACCOUNTING_IMPORT_MAX_ENTRIES,
  importFileTooLargeMessage,
  importTooManyEntriesMessage,
  importTooManyLinesMessage,
  submittedImportIssue,
} from "@/lib/accounting/importLimits";
import { accountingClientMessage } from "@/lib/accounting/clientError";

const base = {
  takeoverMode: "full_period",
  periodStart: "2026-01-01",
  periodEnd: "2026-12-31",
  takeoverDate: "2026-12-31",
};

describe("limites d'import", () => {
  it("refuse un lot trop grand avant d'accepter le corps", () => {
    const journal = Array.from({ length: ACCOUNTING_IMPORT_MAX_ENTRIES + 1 }, (_, index) => ({
      date: "2026-01-15",
      piece: "",
      label: "Ligne",
      origin: `o-${index}`,
      lines: [
        { code: "1020", debit: 1, credit: 0 },
        { code: "3000", debit: 0, credit: 1 },
      ],
    }));
    expect(submittedImportIssue({ journal })).toBe(importTooManyEntriesMessage());
    const parsed = takeoverInputFromBody({ ...base, journal });
    expect(parsed).toEqual({ error: importTooManyEntriesMessage() });
  });

  it("refuse trop de lignes sans garder un lot partiel", () => {
    const journal = [{
      date: "2026-01-15",
      piece: "",
      label: "Unique",
      origin: "o",
      lines: Array.from({ length: 20_001 }, () => ({ code: "1020", debit: 1, credit: 0 })),
    }];
    expect(submittedImportIssue({ journal })).toBe(importTooManyLinesMessage());
  });

  it("refuse un fichier trop lourd sans le lire comme un import réussi", () => {
    const data = "x".repeat(ACCOUNTING_IMPORT_MAX_BYTES + 1);
    const result = readTakeoverFile({
      filename: "gros.csv",
      data,
      mode: "full_period",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(importFileTooLargeMessage());
  });
});

describe("messages client", () => {
  it("garde une phrase métier et masque une exception SQL", () => {
    expect(accountingClientMessage(new Error("Écriture introuvable"), "secours")).toBe("Écriture introuvable");
    expect(accountingClientMessage(new Error("Un compte indiqué n'existe pas dans le plan."), "secours"))
      .toBe("Un compte indiqué n'existe pas dans le plan.");
    expect(accountingClientMessage(
      new Error('duplicate key value violates unique constraint "accounting_entries_idem"'),
      "secours",
    )).toBe("secours");
    expect(accountingClientMessage(
      new Error("function public.accounting_enqueue(uuid) does not exist"),
      "secours",
    )).toBe("secours");
  });
});
