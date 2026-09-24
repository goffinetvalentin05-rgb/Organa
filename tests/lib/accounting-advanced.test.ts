import { describe, expect, it } from "vitest";
import {
  ADVANCED_EVENT,
  ADVANCED_SOURCE,
  assessAdvancedLines,
  appearsInOfficialReports,
  buildReversalLines,
  canModifyAdvancedEntry,
} from "@/lib/accounting/advancedEntry";

const club = "club-a";
const accounts = [
  { id: "a6500", clubId: club, isActive: true },
  { id: "a6800", clubId: club, isActive: true },
  { id: "a1020", clubId: club, isActive: true },
  { id: "inactive", clubId: club, isActive: false },
  { id: "other", clubId: "club-b", isActive: true },
];

describe("écriture comptable avancée", () => {
  it("accepte un débit et un crédit égaux", () => {
    const result = assessAdvancedLines({
      clubId: club,
      accounts,
      lines: [
        { accountId: "a6500", debit: 250, credit: 0 },
        { accountId: "a1020", debit: 0, credit: 250 },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("refuse une écriture déséquilibrée", () => {
    const result = assessAdvancedLines({
      clubId: club,
      accounts,
      lines: [
        { accountId: "a6500", debit: 250, credit: 0 },
        { accountId: "a1020", debit: 0, credit: 200 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("accepte plusieurs lignes qui s’équilibrent", () => {
    const result = assessAdvancedLines({
      clubId: club,
      accounts,
      lines: [
        { accountId: "a6500", debit: 100, credit: 0 },
        { accountId: "a6800", debit: 10, credit: 0 },
        { accountId: "a1020", debit: 0, credit: 110 },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.debit).toBe(110);
  });

  it("refuse débit et crédit sur la même ligne", () => {
    const result = assessAdvancedLines({
      clubId: club,
      accounts,
      lines: [
        { accountId: "a6500", debit: 250, credit: 250 },
        { accountId: "a1020", debit: 0, credit: 0 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("refuse un compte inexistant, un autre club ou un compte désactivé", () => {
    expect(assessAdvancedLines({
      clubId: club,
      accounts,
      lines: [
        { accountId: "missing", debit: 10, credit: 0 },
        { accountId: "a1020", debit: 0, credit: 10 },
      ],
    }).ok).toBe(false);
    expect(assessAdvancedLines({
      clubId: club,
      accounts,
      lines: [
        { accountId: "other", debit: 10, credit: 0 },
        { accountId: "a1020", debit: 0, credit: 10 },
      ],
    }).ok).toBe(false);
    expect(assessAdvancedLines({
      clubId: club,
      accounts,
      lines: [
        { accountId: "inactive", debit: 10, credit: 0 },
        { accountId: "a1020", debit: 0, credit: 10 },
      ],
    }).ok).toBe(false);
  });

  it("refuse de modifier une écriture validée et extourne les lignes", () => {
    expect(canModifyAdvancedEntry({ status: "validated", sourceType: ADVANCED_SOURCE, eventType: ADVANCED_EVENT })).toBe(false);
    expect(canModifyAdvancedEntry({ status: "pending", sourceType: ADVANCED_SOURCE, eventType: ADVANCED_EVENT })).toBe(true);
    expect(buildReversalLines([
      { accountId: "a6500", debit: 250, credit: 0 },
      { accountId: "a1020", debit: 0, credit: 250 },
    ])).toEqual([
      { accountId: "a6500", debit: 0, credit: 250 },
      { accountId: "a1020", debit: 250, credit: 0 },
    ]);
  });

  it("laisse une écriture à vérifier hors des rapports, puis l’y fait entrer après validation", () => {
    expect(appearsInOfficialReports("pending")).toBe(false);
    expect(appearsInOfficialReports("validated")).toBe(true);
  });
});
