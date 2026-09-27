/**
 * Numéros visibles d’un exercice ouvert.
 * L’identifiant de l’écriture ne change jamais : factures, cotisations,
 * charges, paiements, justificatifs, extournes et audit s’y rattachent.
 * Le numéro est seulement la place dans la séquence.
 */

export const CLOSED_NUMBERING_MESSAGE =
  "Cet exercice est clôturé. Les numéros d’écriture restent figés. Rouvrez-le dans Exercices pour modifier ou supprimer cette écriture.";

export type SequencedEntry = {
  id: string;
  date: string;
  createdAt: string;
  number: number;
  manual: boolean;
  label: string;
  sourceId?: string | null;
};

export type NumberingResult =
  | { ok: true; entries: SequencedEntry[]; notice: string | null }
  | { ok: false; error: string; entries: SequencedEntry[] };

export function compareChronology(
  a: Pick<SequencedEntry, "date" | "createdAt" | "id">,
  b: Pick<SequencedEntry, "date" | "createdAt" | "id">
): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

export function entryNumberRangeError(value: number, count: number): string | null {
  const max = Math.max(count, 1);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    return `Choisissez un numéro entre 1 et ${max}.`;
  }
  return null;
}

function byNumber(entries: SequencedEntry[]): SequencedEntry[] {
  return [...entries].sort((a, b) => a.number - b.number || compareChronology(a, b));
}

function assign(entries: SequencedEntry[], manualOf: (entry: SequencedEntry) => boolean): SequencedEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    number: index + 1,
    manual: manualOf(entry),
  }));
}

function manualShifts(before: SequencedEntry[], after: SequencedEntry[], excludeId?: string): string[] {
  return after.flatMap((entry) => {
    if (excludeId && entry.id === excludeId) return [];
    const previous = before.find((item) => item.id === entry.id);
    if (!previous?.manual || previous.number === entry.number) return [];
    return [`« ${entry.label} » passe de ${previous.number} à ${entry.number}`];
  });
}

function noticeFor(input: {
  mode: "chronological" | "manual" | "compact";
  subjectId: string;
  before: SequencedEntry[];
  after: SequencedEntry[];
}): string | null {
  const subjectBefore = input.before.find((entry) => entry.id === input.subjectId);
  const subjectAfter = input.after.find((entry) => entry.id === input.subjectId);
  const others = manualShifts(input.before, input.after, input.subjectId);
  const othersText = others.length > 0
    ? `Des numéros corrigés manuellement sont décalés : ${others.join(" ; ")}.`
    : null;

  if (input.mode === "manual" && subjectAfter) {
    const placed = `Le numéro est placé en ${subjectAfter.number}.`;
    if (othersText) return `${placed} ${othersText}`;
    const moved = input.before.some((entry) => {
      const next = input.after.find((item) => item.id === entry.id);
      return next && entry.id !== input.subjectId && next.number !== entry.number;
    });
    return moved ? `${placed} Les autres écritures sont décalées.` : placed;
  }

  if (subjectBefore?.manual && subjectAfter && subjectBefore.number !== subjectAfter.number) {
    const own = `La date replace cette écriture. Le numéro corrigé manuellement passe de ${subjectBefore.number} à ${subjectAfter.number}.`;
    return othersText ? `${own} ${othersText}` : own;
  }

  return othersText;
}

export function placeEntry(input: {
  entries: SequencedEntry[];
  entryId: string;
  mode: "chronological" | "manual";
  target?: number;
  periodOpen: boolean;
}): NumberingResult {
  if (!input.periodOpen) {
    return { ok: false, error: CLOSED_NUMBERING_MESSAGE, entries: input.entries };
  }
  const subject = input.entries.find((entry) => entry.id === input.entryId);
  if (!subject) return { ok: false, error: "Écriture introuvable", entries: input.entries };
  const others = byNumber(input.entries.filter((entry) => entry.id !== input.entryId));
  let ordered: SequencedEntry[];
  if (input.mode === "manual") {
    const error = entryNumberRangeError(input.target ?? 0, input.entries.length);
    if (error) return { ok: false, error, entries: input.entries };
    const index = (input.target as number) - 1;
    ordered = [...others.slice(0, index), subject, ...others.slice(index)];
  } else {
    const earlier = others.filter((entry) => compareChronology(entry, subject) < 0);
    const later = others.filter((entry) => compareChronology(entry, subject) > 0);
    ordered = [...earlier, subject, ...later];
  }
  const after = assign(ordered, (entry) => (entry.id === subject.id ? input.mode === "manual" : entry.manual));
  return {
    ok: true,
    entries: after,
    notice: noticeFor({ mode: input.mode, subjectId: subject.id, before: input.entries, after }),
  };
}

/** Première mise en ordre d’un exercice encore ouvert. Ne touche pas un exercice déjà corrigé à la main. */
export function seedChronological(entries: SequencedEntry[], periodOpen: boolean): NumberingResult {
  if (!periodOpen) return { ok: false, error: CLOSED_NUMBERING_MESSAGE, entries };
  if (entries.some((entry) => entry.manual)) {
    return { ok: true, entries, notice: null };
  }
  const after = assign([...entries].sort(compareChronology), () => false);
  return { ok: true, entries: after, notice: null };
}

export function compactNumbers(entries: SequencedEntry[], periodOpen: boolean): NumberingResult {
  if (!periodOpen) return { ok: false, error: CLOSED_NUMBERING_MESSAGE, entries };
  const after = assign(byNumber(entries), (entry) => entry.manual);
  return {
    ok: true,
    entries: after,
    notice: noticeFor({ mode: "compact", subjectId: "", before: entries, after }),
  };
}
