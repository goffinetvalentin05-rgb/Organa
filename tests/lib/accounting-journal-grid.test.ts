import { describe, expect, it } from "vitest";
import { officialTotals } from "@/lib/accounting/engine";
import {
  accountAllowed,
  CLOSED_PERIOD_MESSAGE,
  canEditJournalEntry,
  journalEditMaterial,
  journalLockReason,
  linkedJournalEntryId,
  editIsMaterial,
  ENTRY_NUMBER_TAKEN,
  entryNumberAllowed,
  explainJournalError,
  draftIssues,
  draftLeaveAction,
  existingCellCommit,
  createSaveQueue,
  journalComposerChanged,
  journalImbalance,
  nextDraftAction,
  journalEntryListed,
  journalLinesBalanced,
  listedJournalEntries,
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
    expect(canEditJournalEntry("reversed")).toBe(true);
    expect(canEditJournalEntry("reversed", "closed")).toBe(false);
    expect(canEditJournalEntry("validated", "closed")).toBe(false);
    expect(canEditJournalEntry("voided")).toBe(false);
    expect(journalLockReason("reversed", "closed")).toBe(CLOSED_PERIOD_MESSAGE);
    expect(journalLockReason("reversed", "open")).toBeNull();
  });

  it("modifie une ouverture extournée comme une seule écriture tant que l’exercice est ouvert", () => {
    const rows = toJournalRows("open", opening);
    expect(journalLockReason("reversed", "open")).toBeNull();
    expect(linkedJournalEntryId({ reversed_by_entry_id: "ext", reversal_of_entry_id: null })).toBe("ext");
    expect(journalEditMaterial(
      { date: "2026-09-24", reference: "", rows: rows.map((row) => ({ debitAccountId: row.debitAccountId, creditAccountId: row.creditAccountId, amount: row.amount })) },
      { date: "2026-09-24", reference: "", rows: rows.map((row) => ({ debitAccountId: row.debitAccountId, creditAccountId: row.creditAccountId, amount: row.amount })) }
    )).toBe(false);
    const changed = rows.map((row, index) => ({
      debitAccountId: row.debitAccountId,
      creditAccountId: row.creditAccountId,
      amount: index === 0 ? row.amount + 50 : row.amount,
    }));
    expect(journalEditMaterial(
      { date: "2026-09-24", reference: "", rows: rows.map((row) => ({ debitAccountId: row.debitAccountId, creditAccountId: row.creditAccountId, amount: row.amount })) },
      { date: "2026-09-24", reference: "", rows: changed }
    )).toBe(true);
    expect(journalLinesBalanced(rowsToLines(rows.map((row) => ({
      debitAccountId: row.debitAccountId,
      creditAccountId: row.creditAccountId,
      amount: row.amount,
    }))))).toBe(true);
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
    expect(explainJournalError('duplicate key value violates unique constraint "accounting_entries_number"')).toBe(ENTRY_NUMBER_TAKEN);
    expect(explainJournalError("Compte introuvable")).toBe("Compte introuvable");
    expect(explainJournalError("Lignes d'une écriture supprimée immuables")).toMatch(/retirée du journal/);
    expect(explainJournalError("Ecriture supprimée immuable")).toMatch(/retirée du journal/);
  });

  it("renvoie une écriture vérifiée à contrôler si le montant change", () => {
    expect(editIsMaterial(["remark"])).toBe(false);
    expect(editIsMaterial(["amount"])).toBe(true);
    expect(resolveJournalStatus({ previous: "validated", requested: "validated", material: true, balanced: true })).toEqual({ status: "pending" });
    expect(resolveJournalStatus({ previous: "validated", requested: "validated", material: false, balanced: true })).toEqual({ status: "validated" });
    expect(resolveJournalStatus({ previous: "pending", requested: "validated", material: false, balanced: true })).toEqual({ status: "validated" });
    expect(resolveJournalStatus({ previous: "reversed", requested: "validated", material: true, balanced: true })).toEqual({ status: "pending" });
    expect(resolveJournalStatus({ previous: "reversed", requested: "validated", material: false, balanced: true })).toEqual({ status: "validated" });
    const blocked = resolveJournalStatus({ previous: "pending", requested: "validated", material: false, balanced: false });
    expect("error" in blocked ? blocked.error : "").toMatch(/équilibrée/);
  });

  it("n’ouvre qu’un seul brouillon et refuse une saisie incomplète", () => {
    expect(nextDraftAction(false)).toBe("create");
    expect(nextDraftAction(true)).toBe("focus");
    expect(nextDraftAction(true)).toBe("focus");
    const missing = draftIssues({ date: "2026-09-24", label: "", lines: [{ debitAccountId: "", creditAccountId: "", amount: 0 }] });
    expect(missing.length).toBeGreaterThan(0);
    expect(draftIssues({
      date: "2026-09-24",
      label: "Cotisation",
      lines: [{ debitAccountId: "1020", creditAccountId: "3000", amount: 250 }],
    })).toEqual([]);
    const compound = draftIssues({
      date: "2026-09-24",
      label: "Frais",
      lines: [
        { debitAccountId: "6500", creditAccountId: "", amount: 100 },
        { debitAccountId: "6800", creditAccountId: "", amount: 10 },
        { debitAccountId: "", creditAccountId: "1020", amount: 110 },
      ],
    });
    expect(compound).toEqual([]);
  });

  it("sort une écriture supprimée ou à vérifier des soldes officiels", () => {
    const bank = {
      entryId: "e",
      entryStatus: "validated" as const,
      accountType: "asset" as const,
      accountNumber: "1020",
      systemCode: "bank",
      debit: 1000,
      credit: 0,
    };
    expect(officialTotals([bank]).bank).toBe(1000);
    expect(officialTotals([{ ...bank, entryStatus: "voided" }]).bank).toBe(0);
    expect(officialTotals([{ ...bank, entryStatus: "pending" }]).bank).toBe(0);
    expect(officialTotals([
      { ...bank, entryStatus: "reversed" },
      { ...bank, entryId: "r", entryStatus: "validated", debit: 0, credit: 1000 },
    ]).bank).toBe(0);
  });

  it("enregistre une cellule seulement si l’écriture reste cohérente", () => {
    const base = { changed: true, label: "Cotisation", number: 7, numberAllowed: true, balanced: true, gapLabel: null };
    expect(existingCellCommit({ ...base, changed: false })).toEqual({ action: "ignore" });
    expect(existingCellCommit(base)).toEqual({ action: "save" });
    expect(existingCellCommit({ ...base, numberAllowed: false }).action).toBe("reject");
    expect(existingCellCommit({ ...base, balanced: false, gapLabel: "Écart" })).toMatchObject({ action: "reject" });
    const row = { debitAccountId: "1020", creditAccountId: "3000", amount: 10 };
    const snap = { date: "2026-09-24", number: "7", reference: "", label: "Cotisation", remark: "", status: "validated", rows: [row] };
    expect(journalComposerChanged(snap, { ...snap, label: "Cotisation 25/26" })).toBe(true);
    expect(journalComposerChanged(snap, { ...snap, number: "8" })).toBe(true);
    expect(journalComposerChanged(snap, snap)).toBe(false);
    expect(draftLeaveAction(["Indiquez le libellé."], true)).toBe("keep");
    expect(draftLeaveAction([], false)).toBe("keep");
    expect(draftLeaveAction([], true)).toBe("create");
  });

  it("enchaîne les enregistrements de cellules sans les croiser", async () => {
    const enqueue = createSaveQueue();
    const order: string[] = [];
    const first = enqueue(async () => {
      order.push("start-1");
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push("end-1");
    });
    const second = enqueue(async () => {
      order.push("start-2");
      order.push("end-2");
    });
    await Promise.all([first, second]);
    expect(order).toEqual(["start-1", "end-1", "start-2", "end-2"]);
  });

  it("liste chaque écriture active une fois, sans filtre À vérifier par défaut", () => {
    const entries = [
      { id: "a", status: "pending" },
      { id: "b", status: "validated" },
      { id: "c", status: "reversed" },
      { id: "d", status: "voided" },
      { id: "a", status: "pending" },
    ];
    expect(listedJournalEntries(entries, "all").map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    expect(journalEntryListed("voided", "all")).toBe(false);
    expect(journalEntryListed("pending", "all")).toBe(true);
  });

  it("filtre le journal par statut sans retirer les écritures écartées du cas Toutes", () => {
    const entries = [
      { id: "a", status: "pending" },
      { id: "b", status: "validated" },
      { id: "c", status: "reversed" },
      { id: "d", status: "voided" },
    ];
    expect(listedJournalEntries(entries, "pending").map((entry) => entry.id)).toEqual(["a"]);
    expect(listedJournalEntries(entries, "validated").map((entry) => entry.id)).toEqual(["b"]);
    expect(listedJournalEntries(entries, "voided")).toEqual([]);
  });

  it("laisse vérifier une écriture à vérifier depuis le journal", () => {
    expect(canEditJournalEntry("pending", "open")).toBe(true);
    expect(resolveJournalStatus({
      previous: "pending",
      requested: "validated",
      material: false,
      balanced: true,
    })).toEqual({ status: "validated" });
  });

  it("calcule l’écart d’une écriture déséquilibrée", () => {
    expect(journalImbalance([
      { accountId: "a", debit: 120, credit: 0 },
      { accountId: "b", debit: 0, credit: 100 },
    ])).toBe(20);
  });
});
