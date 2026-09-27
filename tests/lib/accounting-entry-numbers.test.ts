import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLOSED_NUMBERING_MESSAGE,
  compactNumbers,
  placeEntry,
  seedChronological,
  type SequencedEntry,
} from "@/lib/accounting/entryNumbers";
import { CLOSED_PERIOD_MESSAGE } from "@/lib/accounting/journalGrid";
import { buildAccountExtract, buildJournalReport } from "@/lib/accounting/reports";
import type { ReportAccount, ReportEntry, ReportMovement, ReportPeriod } from "@/lib/accounting/reports";

const migration = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/101_accounting_entry_numbers.sql"),
  "utf8"
);

function row(partial: SequencedEntry): SequencedEntry {
  return partial;
}

describe("numéros du journal", () => {
  it("place une écriture du 25 septembre avant celle du 30", () => {
    const september30 = row({
      id: "fin",
      date: "2026-09-30",
      createdAt: "2026-09-30T08:00:00.000Z",
      number: 1,
      manual: false,
      label: "Cotisation 25/26 (paiement en ligne)",
      sourceId: "doc-cotisation",
    });
    const inserted = row({
      id: "wsport",
      date: "2026-09-25",
      createdAt: "2026-09-30T12:00:00.000Z",
      number: 2,
      manual: false,
      label: "Wsport 2800",
      sourceId: "charge-wsport",
    });
    const placed = placeEntry({
      entries: [september30, inserted],
      entryId: "wsport",
      mode: "chronological",
      periodOpen: true,
    });
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    expect(placed.entries.map((entry) => [entry.id, entry.number, entry.sourceId])).toEqual([
      ["wsport", 1, "charge-wsport"],
      ["fin", 2, "doc-cotisation"],
    ]);
    expect(placed.notice).toBeNull();
    const again = placeEntry({ entries: placed.entries, entryId: "wsport", mode: "chronological", periodOpen: true });
    expect(again.ok && again.entries.map((entry) => entry.number)).toEqual([1, 2]);
  });

  it("remet le journal de la capture dans l’ordre des dates, sans trou", () => {
    const seeded = seedChronological([
      row({ id: "ouverture", date: "2026-09-24", createdAt: "2026-09-24T08:00:00.000Z", number: 1, manual: false, label: "Situation de départ", sourceId: null }),
      row({ id: "facture", date: "2026-09-27", createdAt: "2026-09-27T09:00:00.000Z", number: 2, manual: false, label: "Test n° QR Facture", sourceId: "facture-7" }),
      row({ id: "cotisation", date: "2026-09-30", createdAt: "2026-09-30T10:00:00.000Z", number: 10, manual: false, label: "Cotisation 25/26 (paiement en ligne)", sourceId: "doc-cotisation" }),
      row({ id: "wsport", date: "2026-09-25", createdAt: "2026-09-25T11:00:00.000Z", number: 11, manual: false, label: "Wsport 2800", sourceId: "charge-wsport" }),
    ], true);
    expect(seeded.ok).toBe(true);
    if (!seeded.ok) return;
    expect(seeded.entries.map((entry) => [entry.label, entry.number, entry.sourceId])).toEqual([
      ["Situation de départ", 1, null],
      ["Wsport 2800", 2, "charge-wsport"],
      ["Test n° QR Facture", 3, "facture-7"],
      ["Cotisation 25/26 (paiement en ligne)", 4, "doc-cotisation"],
    ]);
    expect(new Set(seeded.entries.map((entry) => entry.number)).size).toBe(4);
  });

  it("décale les autres quand un numéro est corrigé à la main, puis le signale à l’insertion suivante", () => {
    const base = seedChronological([
      row({ id: "ouverture", date: "2026-09-24", createdAt: "2026-09-24T08:00:00.000Z", number: 1, manual: false, label: "Situation de départ" }),
      row({ id: "wsport", date: "2026-09-25", createdAt: "2026-09-25T11:00:00.000Z", number: 2, manual: false, label: "Wsport 2800" }),
      row({ id: "facture", date: "2026-09-27", createdAt: "2026-09-27T09:00:00.000Z", number: 3, manual: false, label: "Test n° QR Facture", sourceId: "facture-7" }),
      row({ id: "cotisation", date: "2026-09-30", createdAt: "2026-09-30T10:00:00.000Z", number: 4, manual: false, label: "Cotisation 25/26 (paiement en ligne)", sourceId: "doc-cotisation" }),
    ], true);
    if (!base.ok) throw new Error(base.error);
    const manual = placeEntry({ entries: base.entries, entryId: "cotisation", mode: "manual", target: 2, periodOpen: true });
    expect(manual.ok).toBe(true);
    if (!manual.ok) return;
    expect(manual.entries.map((entry) => [entry.id, entry.number, entry.manual])).toEqual([
      ["ouverture", 1, false],
      ["cotisation", 2, true],
      ["wsport", 3, false],
      ["facture", 4, false],
    ]);
    expect(manual.notice).toContain("placé en 2");
    expect(manual.entries.find((entry) => entry.id === "facture")?.sourceId).toBe("facture-7");

    const later = row({
      id: "especes",
      date: "2026-09-26",
      createdAt: "2026-09-30T15:00:00.000Z",
      number: 5,
      manual: false,
      label: "Fournitures",
    });
    const inserted = placeEntry({
      entries: [...manual.entries, later],
      entryId: "especes",
      mode: "chronological",
      periodOpen: true,
    });
    expect(inserted.ok).toBe(true);
    if (!inserted.ok) return;
    expect(inserted.entries.find((entry) => entry.id === "especes")?.number).toBe(3);
    expect(inserted.entries.find((entry) => entry.id === "cotisation")).toMatchObject({ number: 4, manual: true });
    expect(inserted.notice).toContain("passe de 2 à 4");
    const reloaded = placeEntry({ entries: inserted.entries, entryId: "especes", mode: "chronological", periodOpen: true });
    expect(reloaded.ok && reloaded.entries.map((entry) => entry.number)).toEqual(inserted.entries.map((entry) => entry.number));
  });

  it("signale le décalage d’un numéro manuel et refuse un exercice clôturé", () => {
    const pinned = [
      row({ id: "a", date: "2026-09-24", createdAt: "2026-09-24T08:00:00.000Z", number: 1, manual: false, label: "Ouverture" }),
      row({ id: "b", date: "2026-09-30", createdAt: "2026-09-30T08:00:00.000Z", number: 2, manual: true, label: "Cotisation 25/26 (paiement en ligne)", sourceId: "doc-cotisation" }),
    ];
    const moved = placeEntry({
      entries: [
        ...pinned,
        row({ id: "c", date: "2026-09-25", createdAt: "2026-09-30T12:00:00.000Z", number: 3, manual: false, label: "Wsport 2800" }),
      ],
      entryId: "c",
      mode: "chronological",
      periodOpen: true,
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.entries.find((entry) => entry.id === "b")?.number).toBe(3);
    expect(moved.notice).toContain("Cotisation 25/26");
    expect(moved.notice).toContain("passe de 2 à 3");
    expect(moved.entries.find((entry) => entry.id === "b")?.sourceId).toBe("doc-cotisation");

    const closed = placeEntry({ entries: pinned, entryId: "b", mode: "chronological", periodOpen: false });
    expect(closed.ok).toBe(false);
    if (closed.ok) return;
    expect(closed.error).toBe(CLOSED_NUMBERING_MESSAGE);
    expect(closed.entries.map((entry) => entry.number)).toEqual([1, 2]);
    expect(seedChronological(pinned, false).ok).toBe(false);
  });

  it("garde le même numéro sur toutes les lignes d’une écriture composée, au journal et à l’extrait", () => {
    const seeded = seedChronological([
      row({ id: "ouverture", date: "2026-09-24", createdAt: "2026-09-24T08:00:00.000Z", number: 1, manual: false, label: "Situation de départ" }),
      row({ id: "facture", date: "2026-09-27", createdAt: "2026-09-27T09:00:00.000Z", number: 2, manual: false, label: "Test n° QR Facture", sourceId: "facture-7" }),
      row({ id: "wsport", date: "2026-09-25", createdAt: "2026-09-25T11:00:00.000Z", number: 11, manual: false, label: "Wsport 2800", sourceId: "charge-wsport" }),
    ], true);
    if (!seeded.ok) throw new Error(seeded.error);
    const accounts: ReportAccount[] = [
      { id: "caisse", number: "1000", name: "Caisse", accountType: "asset", accountClass: 1 },
      { id: "courant", number: "1020", name: "Compte courant", accountType: "asset", accountClass: 1 },
      { id: "epargne", number: "1021", name: "Compte épargne", accountType: "asset", accountClass: 1 },
      { id: "fortune", number: "2800", name: "Fortune", accountType: "equity", accountClass: 2 },
      { id: "cotisations", number: "3000", name: "Cotisations membres", accountType: "revenue", accountClass: 3 },
    ];
    const period: ReportPeriod = { id: "2026", label: "2026", startsOn: "2026-01-01", endsOn: "2026-12-31" };
    const entries: ReportEntry[] = seeded.entries.map((entry) => ({
      id: entry.id,
      entry_number: entry.number,
      entry_date: entry.date,
      description: entry.label,
      status: "validated",
      source_type: entry.id === "facture" ? "invoice" : entry.id === "ouverture" ? "opening" : "expense",
      event_type: "payment_received",
      period_id: "2026",
      reference: entry.id === "facture" ? "FAC-7" : null,
    }));
    const linesByEntry: Record<string, ReportMovement[]> = {
      ouverture: [
        { accountId: "caisse", debit: 200, credit: 0 },
        { accountId: "fortune", debit: 0, credit: 100 },
        { accountId: "epargne", debit: 0, credit: 100 },
      ],
      wsport: [
        { accountId: "courant", debit: 0, credit: 1989 },
        { accountId: "fortune", debit: 1989, credit: 0 },
      ],
      facture: [
        { accountId: "courant", debit: 1, credit: 0 },
        { accountId: "cotisations", debit: 0, credit: 1 },
      ],
    };
    const books = { accounts, entries, linesByEntry, period };
    const journal = buildJournalReport(books);
    const openingRows = journal.rows.filter((row) => row.entryId === "ouverture");
    expect(openingRows.map((row) => row.number)).toEqual([1, 1]);
    expect(openingRows[1].label).toBe("même écriture");
    expect(journal.rows.find((row) => row.entryId === "wsport")?.number).toBe(2);
    expect(journal.rows.find((row) => row.entryId === "facture")).toMatchObject({ number: 3, piece: "FAC-7" });
    const extract = buildAccountExtract({ ...books, accountId: "courant" });
    expect("error" in extract).toBe(false);
    if ("error" in extract) return;
    expect(extract.movements.map((row) => row.number)).toEqual([2, 3]);
    const removed = compactNumbers(seeded.entries.filter((entry) => entry.id !== "wsport"), true);
    expect(removed.ok && removed.entries.map((entry) => [entry.id, entry.number])).toEqual([
      ["ouverture", 1],
      ["facture", 2],
    ]);
  });

  it("décrit la migration sans réécrire un exercice clôturé ni les identifiants", () => {
    expect(CLOSED_PERIOD_MESSAGE).toBe(CLOSED_NUMBERING_MESSAGE);
    expect(migration).toContain("entry_number_manual");
    expect(migration).toContain("Les numéros d’écriture restent figés");
    expect(migration).toContain("'renumber'");
    expect(migration).toContain("'entryNumber'");
    expect(migration).toContain("status = 'open'");
    expect(migration).not.toContain("DELETE FROM public.accounting_entries");
    expect(migration).toContain("source_id");
  });
});
