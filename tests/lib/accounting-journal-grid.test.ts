import { describe, expect, it } from "vitest";
import {
  accountAllowed,
  canEditJournalEntry,
  editIsMaterial,
  entryNumberAllowed,
  journalImbalance,
  journalLinesBalanced,
  nextJournalField,
  resolveJournalStatus,
  rowsToLines,
  toJournalRows,
} from "@/lib/accounting/journalGrid";

const opening = [
  { accountId: "1020", debit: 1000, credit: 0 },
  { accountId: "1021", debit: 2000, credit: 0 },
  { accountId: "1000", debit: 200, credit: 0 },
  { accountId: "2800", debit: 0, credit: 3200 },
];

describe("grille du journal", () => {
  it("affiche une écriture simple sur une seule ligne", () => {
    const rows = toJournalRows("e1", [
      { accountId: "1020", debit: 250, credit: 0 },
      { accountId: "3000", debit: 0, credit: 250 },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ debitAccountId: "1020", creditAccountId: "3000", amount: 250, groupSize: 1 });
  });

  it("détaille une ouverture multi-comptes sans résumé du type 3 comptes", () => {
    const rows = toJournalRows("open", opening);
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.debitAccountId)).toEqual(["1020", "1021", "1000"]);
    expect(rows.every((row) => row.creditAccountId === "2800")).toBe(true);
    expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBe(3200);
    const rendered = rows.map((row) => `${row.debitAccountId} ${row.creditAccountId} ${row.amount}`).join(" | ");
    expect(rendered).not.toMatch(/comptes/);
  });

  it("regroupe une écriture composée et la rééquilibre", () => {
    const rows = toJournalRows("mix", [
      { accountId: "6500", debit: 100, credit: 0 },
      { accountId: "6800", debit: 10, credit: 0 },
      { accountId: "1020", debit: 0, credit: 110 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].groupSize).toBe(2);
    const lines = rowsToLines(rows);
    expect(journalLinesBalanced(lines)).toBe(true);
    expect(lines.find((line) => line.accountId === "1020")?.credit).toBe(110);
  });

  it("refuse un compte inactif ou d’un autre club, et une écriture validée", () => {
    expect(accountAllowed({ id: "1", clubId: "a", isActive: true }, "a")).toBe(true);
    expect(accountAllowed({ id: "1", clubId: "b", isActive: true }, "a")).toBe(false);
    expect(accountAllowed({ id: "1", clubId: "a", isActive: false }, "a")).toBe(false);
    expect(accountAllowed(undefined, "a")).toBe(false);
    expect(canEditJournalEntry("pending")).toBe(true);
    expect(canEditJournalEntry("validated")).toBe(true);
    expect(canEditJournalEntry("reversed")).toBe(false);
    expect(canEditJournalEntry("voided")).toBe(false);
  });

  it("avance le clavier de cellule en cellule", () => {
    expect(nextJournalField("date")).toBe("piece");
    expect(nextJournalField("debit")).toBe("credit");
    expect(nextJournalField("remark")).toBe("next-row");
  });

  it("numérote sans doublon dans l’exercice", () => {
    const taken = [{ id: "a", periodId: "p", number: 1 }];
    expect(entryNumberAllowed(2, taken, "p", "b")).toBe(true);
    expect(entryNumberAllowed(1, taken, "p", "b")).toBe(false);
    expect(entryNumberAllowed(1, taken, "p", "a")).toBe(true);
    expect(entryNumberAllowed(0, taken, "p", "b")).toBe(false);
  });

  it("renvoie une écriture vérifiée à contrôler si le montant change", () => {
    expect(editIsMaterial(["remark"])).toBe(false);
    expect(editIsMaterial(["amount"])).toBe(true);
    expect(resolveJournalStatus({ previous: "validated", requested: "validated", material: true, balanced: true })).toEqual({ status: "pending" });
    expect(resolveJournalStatus({ previous: "validated", requested: "validated", material: false, balanced: true })).toEqual({ status: "validated" });
    expect(resolveJournalStatus({ previous: "pending", requested: "validated", material: false, balanced: true })).toEqual({ status: "validated" });
    const blocked = resolveJournalStatus({ previous: "pending", requested: "validated", material: false, balanced: false });
    expect("error" in blocked ? blocked.error : "").toMatch(/équilibrée/);
  });

  it("calcule l’écart d’une écriture déséquilibrée", () => {
    expect(journalImbalance([
      { accountId: "a", debit: 120, credit: 0 },
      { accountId: "b", debit: 0, credit: 100 },
    ])).toBe(20);
  });
});
