import { createHash } from "node:crypto";
import { DEFAULT_MAPPINGS, RECOMMENDED_CHART } from "./chart";
import { paymentIdempotencyKey } from "./engine";
import { formatSwissDate } from "./format";
import { roundChf } from "./money";
import { parseChfInput, periodLabel } from "./onboarding";
import type { DraftLine } from "./types";

export type TakeoverMode = "fresh" | "full_period" | "from_date";

export type TakeoverAccount = {
  code: string;
  number: string;
  name: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
};

export type TakeoverBalance = {
  code: string;
  amount: number;
  legacyNumber?: string;
};

export type TakeoverOpenItem = {
  code: string;
  label: string;
  amount: number;
  side: "receivable" | "payable";
};

export type TakeoverJournalLine = { code: string; debit: number; credit: number };

export type TakeoverJournalEntry = {
  date: string;
  piece: string;
  label: string;
  origin: string;
  entryNumber?: string;
  remark?: string;
  reference?: string;
  sourceType?: string;
  sourceId?: string;
  lines: TakeoverJournalLine[];
};

export type TakeoverInput = {
  mode: TakeoverMode;
  periodStart: string;
  periodEnd: string;
  takeoverDate: string;
  balances: TakeoverBalance[];
  accounts: TakeoverAccount[];
  confirmEquityProposal?: boolean;
  confirmZeroOpening?: boolean;
  journal?: TakeoverJournalEntry[];
  cumulatives?: TakeoverBalance[];
  openItems?: TakeoverOpenItem[];
};

export type EquityProposal = {
  number: "2800";
  name: string;
  amount: number;
  side: "credit" | "debit";
  explanation: string;
};

export type TakeoverSuccess = {
  ok: true;
  openingDate: string;
  openingDescription: string;
  openingLines: DraftLine[];
  equityProposalApplied: boolean;
  journal: Array<TakeoverJournalEntry & { idempotencyKey: string }>;
  rollup: {
    date: string;
    description: string;
    lines: DraftLine[];
    idempotencyKey: string;
  } | null;
  coverageNote: string;
  journalScope: string;
  incomeAnnual: boolean;
  openItems: TakeoverOpenItem[];
  fingerprint: string;
};

export type TakeoverFailure = {
  ok: false;
  message: string;
  gap?: number;
  equityProposal?: EquityProposal;
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const TAKEOVER_CSV_HEADERS = ["date", "piece", "libelle", "compte", "debit", "credit", "origine", "remarque", "reference"] as const;

export const TAKEOVER_CSV_REQUIRED = ["date", "compte", "origine"] as const;

export const TAKEOVER_CSV_TEMPLATE = [
  TAKEOVER_CSV_HEADERS.join(";"),
  "2027-01-15;FAC-12;Cotisation janvier;1020;120.00;0;EXT-12;;",
  "2027-01-15;FAC-12;Cotisation janvier;3000;0;120.00;EXT-12;;",
  "2027-02-02;FAC-18;Facture matériel;4000;80.00;0;EXT-18;;",
  "2027-02-02;FAC-18;Facture matériel;2000;0;80.00;EXT-18;;",
].join("\n");

export const TAKEOVER_CSV_HELP =
  "Une ligne par compte. Les lignes qui partagent la même origine forment une seule écriture, même composée. Obligatoires : date, compte, origine, et un montant au débit ou au crédit. Facultatifs : pièce, libellé, remarque, référence. Le compte est un numéro Obillz, ou un ancien numéro que vous avez associé. Rien n'est placé sur un compte inconnu.";

export function dayBefore(iso: string): string {
  const match = ISO.exec(iso);
  if (!match) throw new Error("Date invalide");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function chartTakeoverAccounts(): TakeoverAccount[] {
  return RECOMMENDED_CHART
    .filter((account) => account.systemCode !== "result")
    .map((account) => ({
      code: account.systemCode || account.number,
      number: account.number,
      name: account.name,
      accountType: account.accountType,
    }));
}

/** Seul l'import de l'exercice envoie des écritures. Les autres parcours n'en conservent aucune. */
export function journalForSubmission(mode: TakeoverMode, journal: TakeoverJournalEntry[] | undefined): TakeoverJournalEntry[] {
  return mode === "full_period" ? (journal ?? []) : [];
}

/** Ancien numéro → numéro Obillz. Un même ancien numéro ne peut viser qu'un seul compte. */
export function legacyNumberMap(
  accounts: TakeoverAccount[],
  legacyByCode: Record<string, string | undefined>,
): { ok: true; map: Record<string, string> } | { ok: false; message: string } {
  const map: Record<string, string> = {};
  const owner = new Map<string, string>();
  for (const account of accounts) {
    const legacy = String(legacyByCode[account.code] ?? "").trim();
    if (!legacy) continue;
    const previous = owner.get(legacy);
    if (previous) {
      return {
        ok: false,
        message: `Le numéro ${legacy} est déjà indiqué pour ${previous}. Un ancien numéro ne correspond qu'à un seul compte Obillz.`,
      };
    }
    owner.set(legacy, `${account.number} ${account.name}`);
    map[legacy] = account.number;
  }
  return { ok: true, map };
}

export function importFingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function importReplay(input: {
  fingerprint: string;
  appliedFingerprints: string[];
}): "already" | "apply" | "refuse" {
  if (input.appliedFingerprints.includes(input.fingerprint)) return "already";
  if (input.appliedFingerprints.length > 0) return "refuse";
  return "apply";
}

/** Le règlement solde le poste repris. Il ne passe ni par un produit ni par une charge. */
export function planOpenItemSettlement(input: {
  item: TakeoverOpenItem;
  financialCode: string;
  amount: number;
}): { ok: true; lines: DraftLine[] } | { ok: false; message: string } {
  const amount = roundChf(input.amount);
  if (!(amount > 0) || amount > roundChf(input.item.amount)) {
    return { ok: false, message: "Le règlement dépasse la somme reprise encore ouverte." };
  }
  if (input.item.side === "receivable") {
    return {
      ok: true,
      lines: [
        { accountCode: input.financialCode, debit: amount, credit: 0 },
        { accountCode: input.item.code, debit: 0, credit: amount },
      ],
    };
  }
  return {
    ok: true,
    lines: [
      { accountCode: input.item.code, debit: amount, credit: 0 },
      { accountCode: input.financialCode, debit: 0, credit: amount },
    ],
  };
}

export function planOpeningCorrection(input: {
  openingEntryId: string | null;
  periodStatus: string;
}): { ok: true; entryId: string } | { ok: false; message: string } {
  if (input.periodStatus !== "open") {
    return { ok: false, message: "Cet exercice est clôturé. La reprise ne peut plus être modifiée." };
  }
  if (!input.openingEntryId) {
    return { ok: false, message: "Aucune reprise à corriger. Une deuxième ouverture n'est pas créée." };
  }
  return { ok: true, entryId: input.openingEntryId };
}

/**
 * L'exercice suivant ne reçoit pas d'écriture d'ouverture.
 * Les soldes continuent par les mouvements déjà enregistrés.
 */
export function annualContinuity(priorStatus: "open" | "closed" | null): {
  copyOpening: false;
  provisional: boolean;
  note: string | null;
} {
  if (priorStatus === "open") {
    return {
      copyOpening: false,
      provisional: true,
      note: "Les soldes issus de l'exercice précédent encore ouvert sont provisoires. Ils suivront ses corrections et sa clôture, sans deuxième ouverture.",
    };
  }
  return { copyOpening: false, provisional: false, note: null };
}

export type ImportCellError = {
  sheet: string;
  row: number;
  column: string;
  message: string;
};

export function parseTakeoverCsv(
  text: string,
  columnOf: Partial<Record<(typeof TAKEOVER_CSV_HEADERS)[number], string>> = {},
  options: { delimiter?: ";" | ","; sheet?: string; accounts?: TakeoverAccount[]; accountMap?: Record<string, string> } = {},
): { ok: true; entries: TakeoverJournalEntry[] } | { ok: false; message: string; errors: ImportCellError[]; needsDelimiter?: boolean; headers?: string[]; unknownAccounts?: string[] } {
  const sheet = options.sheet || "Ecritures";
  const detected = detectCsvDelimiter(text);
  if (!options.delimiter && detected === "ambiguous") {
    return {
      ok: false,
      needsDelimiter: true,
      message: "Le séparateur du CSV est ambigu. Choisissez le point-virgule ou la virgule.",
      errors: [{ sheet, row: 1, column: "fichier", message: "Choisissez le point-virgule ou la virgule comme séparateur." }],
    };
  }
  const rows = splitCsv(text, options.delimiter || (detected === "ambiguous" ? ";" : detected));
  if (rows.length < 2) {
    return failImport(sheet, 1, "fichier", "Le fichier ne contient aucune écriture.");
  }
  const headers = rows[0].map((cell) => cell.trim());
  const index = (field: (typeof TAKEOVER_CSV_HEADERS)[number]) => headerIndex(headers, columnOf[field] || field);
  const missing: string[] = TAKEOVER_CSV_REQUIRED.filter((field) => index(field) < 0);
  if (index("debit") < 0 && index("credit") < 0) missing.push("debit");
  if (missing.length) {
    return {
      ok: false,
      headers,
      message: `Colonne manquante : ${missing.join(", ")}. Associez les colonnes du fichier.`,
      errors: missing.map((field) => ({ sheet, row: 1, column: field, message: `Associez la colonne « ${field} ».` })),
    };
  }
  const groups = new Map<string, TakeoverJournalEntry>();
  const unknown = new Set<string>();
  let skippedExample = false;
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (row.every((cell) => !cell.trim())) continue;
    const cell = (field: (typeof TAKEOVER_CSV_HEADERS)[number]) => {
      const at = index(field);
      return at < 0 ? "" : String(row[at] ?? "").trim();
    };
    const origin = cell("origine");
    if (origin.toUpperCase().startsWith("EXEMPLE")) {
      skippedExample = true;
      continue;
    }
    const lineNo = rowIndex + 1;
    const date = toIsoDate(cell("date"));
    const piece = cell("piece");
    const label = cell("libelle");
    const accountRaw = cell("compte");
    const debit = parseAmount(cell("debit"));
    const credit = parseAmount(cell("credit"));
    if (!date) return failImport(sheet, lineNo, "date", "Date invalide. Utilisez une date Excel, aaaa-mm-jj ou jj.mm.aaaa.");
    if (!origin) return failImport(sheet, lineNo, "origine", "L'origine, qui regroupe les lignes d'une même écriture, est obligatoire.");
    if (!accountRaw) return failImport(sheet, lineNo, "compte", "Le compte est obligatoire.");
    const account = resolveImportAccount(accountRaw, options.accounts, options.accountMap);
    if (options.accounts && !account) {
      unknown.add(accountRaw);
      continue;
    }
    if (debit === null || credit === null) return failImport(sheet, lineNo, "debit", "Montant invalide. Utilisez un montant suisse, par exemple 1'250.50 ou 1250,50.");
    if (debit > 0 && credit > 0) return failImport(sheet, lineNo, "debit", "Un montant est soit au débit, soit au crédit.");
    if (debit === 0 && credit === 0) return failImport(sheet, lineNo, "debit", "Le montant est vide.");
    const current = groups.get(origin) ?? {
      date,
      piece,
      label,
      origin,
      remark: cell("remarque") || undefined,
      reference: cell("reference") || undefined,
      lines: [],
    };
    if (current.date !== date || (piece && current.piece && current.piece !== piece)) {
      return failImport(sheet, lineNo, "origine", `L'origine ${origin} mélange deux pièces ou deux dates. Une écriture à plusieurs lignes reste une seule écriture.`);
    }
    if (!current.remark && cell("remarque")) current.remark = cell("remarque");
    if (!current.reference && cell("reference")) current.reference = cell("reference");
    current.lines.push({ code: account || accountRaw, debit, credit });
    groups.set(origin, current);
  }
  if (unknown.size) {
    const list = [...unknown];
    return {
      ok: false,
      unknownAccounts: list,
      message: `Comptes inconnus : ${list.join(", ")}. Associez-les au plan Obillz. Aucun n'est affecté automatiquement.`,
      errors: list.map((number) => ({ sheet, row: 0, column: "compte", message: `Associez le compte ${number}.` })),
    };
  }
  const entries = [...groups.values()];
  if (!entries.length) {
    if (skippedExample) return { ok: true, entries: [] };
    return failImport(sheet, 1, "fichier", "Le fichier ne contient aucune écriture.");
  }
  for (const entry of entries) {
    const debit = roundChf(entry.lines.reduce((sum, line) => sum + line.debit, 0));
    const credit = roundChf(entry.lines.reduce((sum, line) => sum + line.credit, 0));
    if (debit !== credit || debit <= 0) {
      return failImport(sheet, 0, "origine", `L'écriture ${entry.origin} n'est pas équilibrée. Le total débit doit égaler le total crédit.`);
    }
  }
  return { ok: true, entries };
}

function failImport(sheet: string, row: number, column: string, message: string) {
  const where = row > 0 ? `Feuille ${sheet}, ligne ${row}, colonne ${column} : ${message}` : message;
  return { ok: false as const, message: where, errors: [{ sheet, row, column, message }] };
}

export function planTakeover(input: TakeoverInput): TakeoverSuccess | TakeoverFailure {
  if (!ISO.test(input.periodStart) || !ISO.test(input.periodEnd) || !ISO.test(input.takeoverDate)) {
    return { ok: false, message: "Les dates de l'exercice ou de la reprise sont invalides." };
  }
  if (input.periodEnd < input.periodStart) {
    return { ok: false, message: "La fin d'exercice précède le début." };
  }
  if (input.takeoverDate < input.periodStart || input.takeoverDate > input.periodEnd) {
    return { ok: false, message: "La date de reprise doit être comprise dans l'exercice." };
  }

  const journal = input.journal ?? [];
  const cumulatives = (input.cumulatives ?? []).filter((row) => roundChf(row.amount) > 0);
  if (input.mode === "fresh" && (journal.length || cumulatives.length)) {
    return { ok: false, message: "Une nouvelle comptabilité sans historique ne reprend ni les anciennes écritures ni leurs cumuls." };
  }
  if (input.mode === "full_period" && cumulatives.length) {
    return { ok: false, message: "La reprise de tout l'exercice utilise les écritures détaillées. Les cumuls compteraient une deuxième fois les produits et les charges." };
  }
  if (input.mode === "from_date" && journal.length) {
    return { ok: false, message: "La situation à la date de reprise contient déjà les anciens mouvements. Les importer en plus les compterait deux fois." };
  }
  if (input.mode === "full_period" && input.takeoverDate === input.periodStart && journal.length) {
    return { ok: false, message: "Au premier jour de l'exercice, reprenez le bilan final de l'exercice précédent. Les opérations de l'année précédente ne s'importent pas." };
  }

  const known = new Map(input.accounts.map((account) => [account.code, account]));
  for (const account of input.accounts) known.set(account.number, account);

  const balanceLines: DraftLine[] = [];
  for (const row of input.balances) {
    const amount = roundChf(row.amount);
    if (!(amount > 0)) continue;
    const account = known.get(row.code);
    if (!account) return { ok: false, message: `Compte inconnu dans la reprise : ${row.code}.` };
    if (account.accountType === "revenue" || account.accountType === "expense") {
      return { ok: false, message: `${account.number} ${account.name} est un compte de résultat. Il se reprend en cumul ou en écriture, pas comme un solde de bilan.` };
    }
    balanceLines.push(account.accountType === "asset"
      ? { accountCode: account.code, debit: amount, credit: 0 }
      : { accountCode: account.code, debit: 0, credit: amount });
  }

  const rollupLines: DraftLine[] = [];
  for (const row of cumulatives) {
    const account = known.get(row.code);
    if (!account) return { ok: false, message: `Compte de cumul inconnu : ${row.code}.` };
    if (account.accountType !== "revenue" && account.accountType !== "expense") {
      return { ok: false, message: `${account.number} ${account.name} n'est pas un produit ou une charge. Il ne va pas dans les cumuls.` };
    }
    const amount = roundChf(row.amount);
    rollupLines.push(account.accountType === "revenue"
      ? { accountCode: account.code, debit: 0, credit: amount }
      : { accountCode: account.code, debit: amount, credit: 0 });
  }

  if (input.mode === "fresh" && balanceLines.length === 0) {
    if (!input.confirmZeroOpening) {
      return {
        ok: false,
        message: "Tous les soldes sont nuls. Confirmez que le club n'a ni argent, ni bien, ni dette, ni fonds propres. Aucun fonds propre n'est ajouté pour combler un écart.",
      };
    }
  }

  const gap = trialGap(balanceLines);
  const rollupNet = roundChf(rollupLines.reduce((sum, line) => sum + line.credit - line.debit, 0));
  const equityAlready = input.balances.some((row) => {
    const account = known.get(row.code);
    return account?.accountType === "equity" && roundChf(row.amount) > 0;
  });
  let openingLines = balanceLines;
  let equityProposalApplied = false;

  if (input.mode === "from_date" && rollupLines.length) {
    if (gap !== rollupNet) {
      return {
        ok: false,
        gap: roundChf(gap - rollupNet),
        message: "Les soldes de bilan et les cumuls de produits et de charges ne se correspondent pas. L'écart n'est pas ajouté au compte 2800.",
      };
    }
    if (gap !== 0) {
      const offset = roundChf(Math.abs(gap));
      openingLines = [...balanceLines, gap > 0
        ? { accountCode: "equity", debit: 0, credit: offset }
        : { accountCode: "equity", debit: offset, credit: 0 }];
      rollupLines.push(gap > 0
        ? { accountCode: "equity", debit: offset, credit: 0 }
        : { accountCode: "equity", debit: 0, credit: offset });
    }
  } else if (gap !== 0) {
    const proposal = equityProposal(gap);
    if (!input.confirmEquityProposal || equityAlready) {
      return {
        ok: false,
        gap,
        equityProposal: equityAlready ? undefined : proposal,
        message: equityAlready
          ? `La reprise n'est pas équilibrée. Écart de ${formatChf(Math.abs(gap))}. Indiquez le compte qui porte cet écart. Il n'est pas ajouté au 2800.`
          : proposal.explanation,
      };
    }
    openingLines = [...balanceLines, proposal.side === "credit"
      ? { accountCode: "equity", debit: 0, credit: proposal.amount }
      : { accountCode: "equity", debit: proposal.amount, credit: 0 }];
    equityProposalApplied = true;
  }

  if (openingLines.length === 1) {
    return { ok: false, message: "Une reprise équilibrée contient au moins deux comptes." };
  }

  const postedJournal: TakeoverSuccess["journal"] = [];
  for (const entry of journal) {
    if (!ISO.test(entry.date)) return { ok: false, message: `Date invalide pour ${entry.origin}.` };
    if (entry.date < input.periodStart || entry.date >= input.takeoverDate) {
      return { ok: false, message: `L'écriture ${entry.origin} du ${formatSwissDate(entry.date)} est hors de la période à reprendre, du ${formatSwissDate(input.periodStart)} au ${formatSwissDate(dayBefore(input.takeoverDate))}.` };
    }
    const debit = roundChf(entry.lines.reduce((sum, line) => sum + line.debit, 0));
    const credit = roundChf(entry.lines.reduce((sum, line) => sum + line.credit, 0));
    if (debit !== credit || entry.lines.length < 2) {
      return { ok: false, message: `L'écriture ${entry.origin} n'est pas équilibrée.` };
    }
    for (const line of entry.lines) {
      const account = known.get(line.code);
      if (!account) return { ok: false, message: `L'écriture ${entry.origin} utilise un compte inconnu : ${line.code}.` };
    }
    if (entry.sourceId && !UUID.test(entry.sourceId)) {
      return { ok: false, message: `L'origine Obillz de ${entry.origin} n'est pas une référence valide.` };
    }
    postedJournal.push({
      ...entry,
      idempotencyKey: entry.sourceType && entry.sourceId
        ? paymentIdempotencyKey(entry.sourceType, entry.sourceId, "payment_received")
        : `import:${entry.origin}`,
    });
  }

  const origins = postedJournal.map((entry) => entry.origin);
  if (new Set(origins).size !== origins.length) {
    return { ok: false, message: "Deux écritures portent la même origine. Le lot ne peut pas être repris deux fois." };
  }

  const openItems = input.openItems ?? [];
  for (const item of openItems) {
    if (!item.label.trim() || !(roundChf(item.amount) > 0)) {
      return { ok: false, message: "Chaque somme à recevoir ou à payer a besoin d'un libellé et d'un montant." };
    }
    const account = known.get(item.code);
    if (!account || (account.accountType !== "asset" && account.accountType !== "liability")) {
      return { ok: false, message: "Une somme reprise se rattache à un compte de bilan." };
    }
  }
  for (const code of new Set(openItems.map((item) => item.code))) {
    const total = roundChf(openItems.filter((item) => item.code === code).reduce((sum, item) => sum + item.amount, 0));
    const balance = input.balances.find((row) => row.code === code);
    if (!balance || roundChf(balance.amount) !== total) {
      const account = known.get(code);
      return { ok: false, message: `Le détail des sommes à suivre doit égaler le solde repris du compte ${account?.number || code}.` };
    }
  }

  const openingDate = input.mode === "fresh"
    ? input.takeoverDate
    : input.mode === "full_period" || input.takeoverDate === input.periodStart
      ? input.periodStart
      : dayBefore(input.takeoverDate);
  const incomeAnnual = input.mode === "full_period"
    || (input.mode === "fresh" && input.takeoverDate === input.periodStart)
    || rollupLines.length > 0;
  const coverageNote = coverageText({
    mode: input.mode,
    periodEnd: input.periodEnd,
    takeoverDate: input.takeoverDate,
    incomeAnnual,
    journalCount: postedJournal.length,
  });

  return {
    ok: true,
    openingDate,
    openingDescription: input.mode === "fresh"
      ? "Situation de départ"
      : input.mode === "full_period"
        ? "Soldes au début de l'exercice"
        : "Situation juste avant le passage",
    openingLines,
    equityProposalApplied,
    journal: postedJournal,
    rollup: rollupLines.length
      ? {
          date: openingDate,
          description: "Reprise agrégée des produits et des charges antérieurs au passage",
          lines: rollupLines,
          idempotencyKey: `rollup:${input.periodStart}`,
        }
      : null,
    coverageNote,
    journalScope: input.mode === "fresh"
      ? `Les nouvelles opérations commencent le ${formatSwissDate(input.takeoverDate)}. Aucune écriture antérieure n'est importée.`
      : input.mode === "full_period"
        ? (postedJournal.length
          ? `Le journal détaille les opérations du ${formatSwissDate(input.periodStart)} au ${formatSwissDate(dayBefore(input.takeoverDate))}, puis les nouvelles opérations dès le ${formatSwissDate(input.takeoverDate)}.`
          : `Le journal commence au ${formatSwissDate(input.takeoverDate)}. Les opérations de l'exercice précédent ne sont pas importées.`)
        : `Le journal détaille les opérations à partir du ${formatSwissDate(input.takeoverDate)}. ${rollupLines.length ? "Les produits et les charges antérieurs figurent en un seul cumul, sans le détail des anciennes opérations." : "Les produits et les charges antérieurs ne sont pas repris."}`,
    incomeAnnual,
    openItems,
    fingerprint: importFingerprint({
      mode: input.mode,
      periodStart: input.periodStart,
      takeoverDate: input.takeoverDate,
      balances: input.balances,
      journal: postedJournal.map((entry) => entry.origin),
      cumulatives,
    }),
  };
}

function coverageText(input: {
  mode: TakeoverMode;
  periodEnd: string;
  takeoverDate: string;
  incomeAnnual: boolean;
  journalCount: number;
}): string {
  if (input.mode === "fresh" && input.incomeAnnual) {
    return `Nouvelle comptabilité sans historique. Le résultat couvre l'exercice depuis le ${formatSwissDate(input.takeoverDate)}.`;
  }
  if (input.mode === "fresh") {
    return `Le compte de résultat couvre seulement du ${formatSwissDate(input.takeoverDate)} au ${formatSwissDate(input.periodEnd)}. Il n'y a pas d'historique antérieur, donc ce total n'est pas celui d'une année déjà commencée ailleurs.`;
  }
  if (input.mode === "from_date" && !input.incomeAnnual) {
    return `Le compte de résultat couvre seulement du ${formatSwissDate(input.takeoverDate)} au ${formatSwissDate(input.periodEnd)}. Les cumuls antérieurs n'ont pas été repris, donc ce total n'est pas celui de l'année entière.`;
  }
  if (input.mode === "from_date") {
    return `Le résultat, le budget réalisé et la clôture incluent la reprise agrégée des produits et des charges. Le détail des anciennes opérations n'est pas dans le journal.`;
  }
  if (input.journalCount > 0) {
    return `L'exercice est repris depuis son début : soldes d'ouverture, puis écritures déjà enregistrées avant le ${formatSwissDate(input.takeoverDate)}.`;
  }
  return `La reprise contient le bilan au ${formatSwissDate(input.takeoverDate)}. Les nouvelles écritures commencent à cette date.`;
}

function equityProposal(gap: number): EquityProposal {
  const amount = roundChf(Math.abs(gap));
  const side = gap > 0 ? "credit" : "debit";
  return {
    number: "2800",
    name: "Fortune de l'association",
    amount,
    side,
    explanation: `Les comptes saisis laissent un écart de ${formatChf(amount)}. Les fonds propres calculés sur le compte 2800 Fortune de l'association seraient de ${formatChf(amount)} au ${side === "credit" ? "crédit" : "débit"}. Confirmez pour les utiliser. Rien n'est ajouté au 2800 sans cette confirmation.`,
  };
}

function trialGap(lines: DraftLine[]): number {
  return roundChf(lines.reduce((sum, line) => sum + line.debit - line.credit, 0));
}

function formatChf(amount: number): string {
  return `${amount.toFixed(2)} CHF`;
}

export function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return roundChf(raw);
  }
  const text = String(raw ?? "").trim();
  if (!text) return 0;
  const value = Number(text.replace(/[’'\u00A0\s]/g, "").replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return roundChf(value);
}

export function toIsoDate(raw: unknown): string | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const year = raw.getFullYear();
    const month = String(raw.getMonth() + 1).padStart(2, "0");
    const day = String(raw.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (typeof raw === "number" && raw > 20000 && raw < 80000) {
    const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(raw) * 86400000);
    return utc.toISOString().slice(0, 10);
  }
  const text = String(raw ?? "").trim();
  const iso = text.slice(0, 10);
  if (ISO.test(iso)) {
    const year = Number(iso.slice(0, 4));
    const month = Number(iso.slice(5, 7));
    const day = Number(iso.slice(8, 10));
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day) return iso;
    return null;
  }
  const swiss = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(text);
  if (!swiss) return null;
  const day = Number(swiss[1]);
  const month = Number(swiss[2]);
  const year = Number(swiss[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function normalizeHeader(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const HEADER_ALIASES: Record<string, string[]> = {
  date: ["date"],
  piece: ["piece"],
  libelle: ["libelle", "label"],
  compte: ["compte", "account"],
  debit: ["debit"],
  credit: ["credit"],
  origine: ["origine", "origin", "regroupement", "referencederegroupement"],
  remarque: ["remarque", "note"],
  reference: ["reference", "ref"],
  numero: ["numero"],
  nom: ["nom"],
  solde: ["solde", "montant"],
  cumul: ["cumul"],
  ancien: ["anciennumero", "ancienn"],
};

export function headerIndex(headers: string[], field: string): number {
  const wanted = normalizeHeader(field);
  const aliases = HEADER_ALIASES[wanted] || [wanted];
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)) || normalizeHeader(header) === wanted);
}

export function detectCsvDelimiter(text: string): ";" | "," | "ambiguous" {
  const header = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] || "";
  let semi = 0;
  let comma = 0;
  let quoted = false;
  for (const char of header) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === ";") semi += 1;
    else if (!quoted && char === ",") comma += 1;
  }
  if (semi > 0 && comma > 0) return "ambiguous";
  return semi > 0 ? ";" : ",";
}

export function resolveImportAccount(
  raw: string,
  accounts?: TakeoverAccount[],
  accountMap?: Record<string, string>,
): string | null {
  const trimmed = raw.trim();
  const mapped = accountMap?.[trimmed] || trimmed;
  if (!accounts) return mapped;
  const found = accounts.find((account) => account.number === mapped || account.code === mapped || account.number === trimmed || account.code === trimmed);
  return found ? found.code : null;
}

function splitCsv(text: string, delimiter: ";" | ","): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").trim();
  if (!normalized) return [];
  return normalized.split(/\r?\n/).map((line) => splitCsvLine(line, delimiter));
}

export function takeoverInputFromBody(body: Record<string, unknown>): TakeoverInput | { error: string } {
  const requested = body.takeoverMode || body.mode;
  const mode = requested === "fresh" || requested === "full_period" || requested === "from_date"
    ? requested
    : null;
  if (!mode) return { error: "Choisissez comment reprendre la comptabilité." };
  const accounts = chartTakeoverAccounts();
  const custom = Array.isArray(body.customAccounts) ? body.customAccounts : [];
  for (const row of custom) {
    const item = row as Record<string, unknown>;
    const number = String(item.number || "").trim();
    const name = String(item.name || "").trim();
    const accountType = String(item.accountType || "");
    if (!/^\d{4}$/.test(number) || !name) return { error: "Un compte ajouté a besoin d'un numéro à quatre chiffres et d'un nom." };
    if (!["asset", "liability", "equity", "revenue", "expense"].includes(accountType)) {
      return { error: `Le type du compte ${number} n'est pas reconnu.` };
    }
    if (accounts.some((account) => account.number === number)) return { error: `Le compte ${number} existe déjà.` };
    accounts.push({
      code: number,
      number,
      name,
      accountType: accountType as TakeoverAccount["accountType"],
    });
  }
  const balances = readBalances(body.balances, "solde");
  if ("error" in balances) return balances;
  const cumulatives = readBalances(body.cumulatives, "cumul");
  if ("error" in cumulatives) return cumulatives;
  const journal = Array.isArray(body.journal) ? body.journal as TakeoverJournalEntry[] : [];
  const openItems = Array.isArray(body.openItems)
    ? (body.openItems as TakeoverOpenItem[]).map((item) => ({
        code: String(item.code || ""),
        label: String(item.label || ""),
        amount: roundChf(Number(item.amount) || 0),
        side: item.side === "payable" ? "payable" as const : "receivable" as const,
      }))
    : [];
  const dates = {
    periodStart: String(body.periodStart || "").slice(0, 10),
    periodEnd: String(body.periodEnd || "").slice(0, 10),
    takeoverDate: String(body.takeoverDate || body.accountingStartDate || "").slice(0, 10),
  };
  if (mode === "fresh") {
    return {
      mode,
      ...dates,
      balances: balances.map(({ code, amount }) => ({ code, amount })),
      accounts,
      confirmEquityProposal: body.confirmEquityProposal === true,
      confirmZeroOpening: body.confirmZeroOpening === true,
      journal: [],
      cumulatives: [],
      openItems,
    };
  }
  const legacyByCode: Record<string, string> = {};
  if (body.legacyNumbers && typeof body.legacyNumbers === "object" && !Array.isArray(body.legacyNumbers)) {
    for (const [code, value] of Object.entries(body.legacyNumbers as Record<string, unknown>)) {
      const text = String(value ?? "").trim();
      if (text) legacyByCode[code] = text;
    }
  }
  for (const row of balances) {
    if (row.legacyNumber) legacyByCode[row.code] = row.legacyNumber;
  }
  const aliases = legacyNumberMap(accounts, legacyByCode);
  if (!aliases.ok) return { error: aliases.message };
  return {
    mode,
    ...dates,
    balances,
    accounts,
    confirmEquityProposal: body.confirmEquityProposal === true,
    confirmZeroOpening: body.confirmZeroOpening === true,
    journal: journal.map((entry) => ({
      ...entry,
      lines: entry.lines.map((line) => ({ ...line, code: remapAccountCode(line.code, accounts, aliases.map) })),
    })),
    cumulatives,
    openItems,
  };
}

function remapAccountCode(raw: string, accounts: TakeoverAccount[], map: Record<string, string>): string {
  const trimmed = raw.trim();
  const target = map[trimmed];
  if (!target) return trimmed;
  const account = accounts.find((item) => item.number === target || item.code === target);
  return account ? account.code : trimmed;
}

export function takeoverRpcPayload(
  clubId: string,
  userId: string,
  input: TakeoverInput,
  plan: TakeoverSuccess,
) {
  const imported = plan.journal.length > 0 || plan.rollup !== null;
  return {
    club_id: clubId,
    user_id: userId,
    start_date: input.mode === "full_period" ? input.periodStart : input.takeoverDate,
    coverage_type: plan.incomeAnnual ? "full_period" : "partial_period",
    start_mode: input.mode,
    history_import_status: imported ? "applied" : "not_requested",
    coverage_note: plan.coverageNote,
    fingerprint: imported ? plan.fingerprint : null,
    period: {
      label: periodLabel(input.periodStart, input.periodEnd),
      starts_on: input.periodStart,
      ends_on: input.periodEnd,
    },
    accounts: input.accounts.map((account, index) => ({
      number: account.number,
      name: account.name,
      account_type: account.accountType,
      account_class: Number(account.number[0]) || 1,
      system_code: account.code === account.number ? null : account.code,
      is_system: RECOMMENDED_CHART.some((seed) => seed.systemCode === account.code && seed.isSystem),
      sort_order: index,
    })),
    mappings: Object.entries(DEFAULT_MAPPINGS).map(([source_kind, system_code]) => ({ source_kind, system_code })),
    opening: plan.openingLines.length
      ? {
          entry_date: plan.openingDate,
          description: plan.openingDescription,
          amount: roundChf(plan.openingLines.reduce((sum, line) => sum + line.debit, 0)),
          lines: plan.openingLines.map((line) => ({ system_code: line.accountCode, debit: line.debit, credit: line.credit })),
        }
      : null,
    journal: plan.journal.map((entry) => ({
      entry_date: entry.date,
      description: [entry.label, entry.remark].filter(Boolean).join(" — ") || entry.origin,
      reference: entry.reference || entry.piece,
      amount: roundChf(entry.lines.reduce((sum, line) => sum + line.debit, 0)),
      source_type: entry.sourceType || "import",
      source_id: entry.sourceId || null,
      event_type: entry.sourceId ? "payment_received" : "import",
      idempotency_key: entry.idempotencyKey,
      lines: entry.lines.map((line) => ({ system_code: line.code, debit: line.debit, credit: line.credit })),
    })),
    rollup: plan.rollup
      ? {
          entry_date: plan.rollup.date,
          description: plan.rollup.description,
          amount: roundChf(plan.rollup.lines.reduce((sum, line) => sum + line.debit + line.credit, 0) / 2),
          idempotency_key: plan.rollup.idempotencyKey,
          lines: plan.rollup.lines.map((line) => ({ system_code: line.accountCode, debit: line.debit, credit: line.credit })),
        }
      : null,
    open_items: plan.openItems.map((item) => ({
      account_code: item.code,
      label: item.label,
      side: item.side,
      amount: item.amount,
    })),
  };
}

function readBalances(value: unknown, label: string): TakeoverBalance[] | { error: string } {
  if (!Array.isArray(value)) return [];
  const rows: TakeoverBalance[] = [];
  for (const row of value) {
    const item = row as Record<string, unknown>;
    const code = String(item.code || "").trim();
    if (!code) continue;
    const amount = parseChfInput(item.amount);
    if (Number.isNaN(amount)) return { error: `Montant invalide pour le ${label} ${code}.` };
    const legacyNumber = String(item.legacyNumber || "").trim();
    rows.push({ code, amount, legacyNumber: legacyNumber || undefined });
  }
  return rows;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}
