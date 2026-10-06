/** Pièce jointe d'une écriture. Même plafond que le bucket privé expenses. */
export const ACCOUNTING_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Fichier de reprise et corps de la requête d'import. */
export const ACCOUNTING_IMPORT_MAX_BYTES = 10 * 1024 * 1024;

/** Écritures acceptées dans un seul lot. Au-delà, le lot entier est refusé. */
export const ACCOUNTING_IMPORT_MAX_ENTRIES = 5_000;

/** Lignes d'écriture, soldes et cumuls d'un seul lot. */
export const ACCOUNTING_IMPORT_MAX_LINES = 20_000;

const FILE_MESSAGE = "Ce fichier dépasse 10 Mo. Aucune écriture n'a été reprise.";
const ENTRIES_MESSAGE = "Ce lot dépasse 5 000 écritures. Aucune écriture n'a été reprise.";
const LINES_MESSAGE = "Ce lot dépasse 20 000 lignes. Aucune écriture n'a été reprise.";

export function importFileTooLargeMessage(): string {
  return FILE_MESSAGE;
}

export function importTooManyEntriesMessage(): string {
  return ENTRIES_MESSAGE;
}

export function importTooManyLinesMessage(): string {
  return LINES_MESSAGE;
}

export function isImportVolumeMessage(message: string): boolean {
  return message === FILE_MESSAGE || message === ENTRIES_MESSAGE || message === LINES_MESSAGE;
}

export function byteLengthOf(data: string | ArrayBuffer | Uint8Array): number {
  if (typeof data === "string") return new TextEncoder().encode(data).length;
  return data.byteLength;
}

export function submittedImportIssue(raw: {
  journal?: unknown;
  balances?: unknown;
  cumulatives?: unknown;
}): string | null {
  const journal = Array.isArray(raw.journal) ? raw.journal : [];
  const balances = Array.isArray(raw.balances) ? raw.balances : [];
  const cumulatives = Array.isArray(raw.cumulatives) ? raw.cumulatives : [];
  if (journal.length > ACCOUNTING_IMPORT_MAX_ENTRIES) return ENTRIES_MESSAGE;
  let lines = balances.length + cumulatives.length;
  for (const entry of journal) {
    const item = entry as { lines?: unknown };
    lines += Array.isArray(item?.lines) ? item.lines.length : 0;
    if (lines > ACCOUNTING_IMPORT_MAX_LINES) return LINES_MESSAGE;
  }
  const bytes = byteLengthOf(JSON.stringify({ journal, balances, cumulatives }));
  if (bytes > ACCOUNTING_IMPORT_MAX_BYTES) return FILE_MESSAGE;
  return null;
}
