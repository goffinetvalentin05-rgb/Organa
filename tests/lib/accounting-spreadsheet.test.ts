import { describe, expect, it } from "vitest";
import { buildJournalCsv, isPlainAmount, neutralizeSpreadsheetText, quoteCsvField } from "@/lib/accounting/spreadsheet";

const row = (patch: Partial<Parameters<typeof buildJournalCsv>[0][number]>) => ({
  date: "2026-01-15",
  number: 12,
  piece: "P-1",
  label: "Cotisation",
  debit: "1020 Banque",
  credit: "3000 Cotisations",
  amount: 1200.5,
  remark: "",
  status: "Vérifiée",
  ...patch,
});

describe("cellules CSV", () => {
  it("neutralise un signe de formule précédé d'espaces ou de contrôles", () => {
    expect(neutralizeSpreadsheetText("=1+1")).toBe("'=1+1");
    expect(neutralizeSpreadsheetText("  =cmd|'/c calc'!A0")).toBe("'  =cmd|'/c calc'!A0");
    expect(neutralizeSpreadsheetText("\t+41 79")).toBe("'\t+41 79");
    expect(neutralizeSpreadsheetText("\u0000-2+3")).toBe("'\u0000-2+3");
    expect(neutralizeSpreadsheetText("\uFEFF@SUM(A1)")).toBe("'\uFEFF@SUM(A1)");
  });

  it("conserve les montants, y compris négatifs et groupés", () => {
    expect(isPlainAmount("-1200.50")).toBe(true);
    expect(isPlainAmount("-1'200.50")).toBe(true);
    expect(isPlainAmount("1 200,50")).toBe(true);
    expect(neutralizeSpreadsheetText("-1200.50")).toBe("-1200.50");
    expect(neutralizeSpreadsheetText(" -1'200.50")).toBe(" -1'200.50");
    expect(quoteCsvField(-40.5)).toBe('"-40.5"');
    expect(quoteCsvField(1200.5)).toBe('"1200.5"');
  });

  it("neutralise le libellé du journal et laisse le montant numérique", () => {
    const csv = buildJournalCsv([row({ label: " =HYPERLINK(\"http://example\")", amount: -15 })]);
    expect(csv).toContain("\"' =HYPERLINK(\"\"http://example\"\")\"");
    expect(csv).toContain('"-15"');
    expect(csv).not.toContain('" =HYPERLINK');
  });
});
