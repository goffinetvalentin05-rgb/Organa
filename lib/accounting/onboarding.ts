import { formatSwissDate } from "./format";
import { roundChf } from "./money";
import type { OpeningOther } from "./types";

export type StartMode = "next_period" | "resume_current" | "from_today";
export type CoverageType = "full_period" | "partial_period";
export type HistoryImportStatus = "not_requested" | "planned" | "manual" | "applied";

export type OpeningBank = {
  name: string;
  number: string;
  amount: number;
};

export type NormalizedOnboarding = {
  periodStart: string;
  periodEnd: string;
  accountingStartDate: string;
  startMode: StartMode;
  historyImportStatus: HistoryImportStatus;
  banks: OpeningBank[];
  useCash: boolean;
  cashName: string;
  cashAmount: number;
  useStripe: boolean;
  stripeAmount: number;
  others: OpeningOther[];
  includeExisting: boolean;
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function addYearsIso(iso: string, years: number): string {
  const match = ISO.exec(iso);
  if (!match) throw new Error("Date invalide");
  const year = Number(match[1]) + years;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

/** Prochain exercice de même durée, sans lien avec une saison sportive. */
export function nextAccountingPeriod(start: string, end: string): { startsOn: string; endsOn: string } {
  return { startsOn: addYearsIso(start, 1), endsOn: addYearsIso(end, 1) };
}

export function periodLabel(start: string, end: string): string {
  const startYear = start.slice(0, 4);
  const endYear = end.slice(0, 4);
  return startYear === endYear ? startYear : `${startYear}–${endYear}`;
}

export function coverageType(periodStart: string, accountingStartDate: string): CoverageType {
  return accountingStartDate > periodStart ? "partial_period" : "full_period";
}

/**
 * Un exercice repris sans import réel ne couvre pas toute la période,
 * même si la date de départ tombe le premier jour.
 */
export function resolveCoverageType(input: {
  periodStart: string;
  accountingStartDate: string;
  startMode?: string | null;
  historyImportStatus?: string | null;
}): CoverageType {
  if (input.startMode === "resume_current" && input.historyImportStatus !== "applied") {
    return "partial_period";
  }
  return coverageType(input.periodStart, input.accountingStartDate);
}

export function coverageSentence(input: {
  coverageType: CoverageType;
  accountingStartDate: string;
  periodEnd: string;
  historyPending?: boolean;
}): string | null {
  if (input.historyPending) {
    return `L’historique de l’exercice n’est pas encore repris. Les rapports n’incluent que les opérations enregistrées dans Obillz à partir du ${formatSwissDate(input.accountingStartDate)}.`;
  }
  if (input.coverageType !== "partial_period") return null;
  return `Les données présentées couvrent la période du ${formatSwissDate(input.accountingStartDate)} au ${formatSwissDate(input.periodEnd)}.`;
}

export function dateInPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** 1020, 1021… en sautant 1025, réservé à Stripe. Aperçu d’onboarding. */
export function suggestBankNumber(index: number): string {
  let number = 1020 + index;
  if (number >= 1025) number += 1;
  return String(number);
}

/** Prochains numéros bancaires libres, à partir de 1021. 1025 reste Stripe. */
export function allocateExtraBankNumbers(taken: Iterable<string>, count: number): string[] {
  const used = new Set(taken);
  const numbers: string[] = [];
  let cursor = 1021;
  while (numbers.length < count) {
    if (cursor === 1025) {
      cursor += 1;
      continue;
    }
    const candidate = String(cursor);
    if (!used.has(candidate)) {
      numbers.push(candidate);
      used.add(candidate);
    }
    cursor += 1;
    if (cursor > 1099) throw new Error("Plus de numéro bancaire disponible");
  }
  return numbers;
}

export function parseChfInput(raw: unknown): number {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return Number.NaN;
    return roundChf(raw);
  }
  const cleaned = String(raw ?? "")
    .replace(/['\s]/g, "")
    .replace(",", ".");
  if (!cleaned) return 0;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return Number.NaN;
  return roundChf(value);
}

function iso(value: unknown, label: string): string {
  const date = String(value || "").slice(0, 10);
  if (!ISO.test(date)) throw new Error(`${label} invalide`);
  return date;
}

function startMode(value: unknown): StartMode {
  if (value === "next_period" || value === "resume_current" || value === "from_today") return value;
  return "from_today";
}

function historyStatus(value: unknown, mode: StartMode): HistoryImportStatus {
  if (value === "planned" || value === "manual" || value === "not_requested" || value === "applied") return value;
  return mode === "resume_current" ? "planned" : "not_requested";
}

export function normalizeOnboardingInput(body: Record<string, unknown>): NormalizedOnboarding {
  const legacyStart = body.startDate ? iso(body.startDate, "Date de début") : null;
  const periodStart = iso(body.periodStart || legacyStart, "Début d’exercice");
  const periodEnd = iso(body.periodEnd || body.endDate, "Fin d’exercice");
  if (periodEnd < periodStart) throw new Error("La fin d’exercice précède le début");

  const mode = startMode(body.startMode);
  const accountingStartDate = iso(
    body.accountingStartDate || legacyStart || periodStart,
    "Date de départ Obillz"
  );
  if (!dateInPeriod(accountingStartDate, periodStart, periodEnd)) {
    throw new Error("La date de départ Obillz doit être comprise dans l’exercice");
  }

  const rawBanks = Array.isArray(body.banks) ? body.banks : [];
  const banks: OpeningBank[] = rawBanks.map((row, index) => {
    const item = row as Record<string, unknown>;
    const name = String(item.name || "").trim();
    const amount = parseChfInput(item.amount);
    if (!name) throw new Error("Chaque compte bancaire a besoin d’un nom");
    if (Number.isNaN(amount)) throw new Error(`Solde invalide pour ${name}`);
    return { name, number: suggestBankNumber(index), amount };
  });

  if (banks.length === 0) {
    const amount = parseChfInput(body.bank ?? 0);
    if (Number.isNaN(amount)) throw new Error("Solde bancaire invalide");
    banks.push({ name: "Banque", number: "1020", amount });
  }

  const useCash = body.useCash === undefined ? true : Boolean(body.useCash);
  const cashAmount = useCash ? parseChfInput(body.cashAmount ?? body.cash ?? 0) : 0;
  if (Number.isNaN(cashAmount)) throw new Error("Solde de caisse invalide");
  const cashName = String(body.cashName || "Caisse").trim() || "Caisse";

  const useStripe = body.useStripe === undefined
    ? parseChfInput(body.stripe ?? 0) > 0
    : Boolean(body.useStripe);
  const stripeAmount = useStripe ? parseChfInput(body.stripeAmount ?? body.stripe ?? 0) : 0;
  if (Number.isNaN(stripeAmount)) throw new Error("Solde Stripe invalide");

  const others: OpeningOther[] = (Array.isArray(body.others) ? body.others : [])
    .map((row) => {
      const item = row as Record<string, unknown>;
      const amount = parseChfInput(item.amount);
      const note = String(item.note || "").trim();
      return {
        accountCode: String(item.accountCode || "").trim(),
        amount,
        side: item.side === "liability" ? "liability" as const : "asset" as const,
        note: note || undefined,
      };
    })
    .filter((row) => row.accountCode && row.amount > 0);

  return {
    periodStart,
    periodEnd,
    accountingStartDate,
    startMode: mode,
    historyImportStatus: historyStatus(body.historyImportStatus, mode),
    banks,
    useCash,
    cashName,
    cashAmount,
    useStripe,
    stripeAmount,
    others,
    includeExisting: Boolean(body.includeExisting),
  };
}

export const PATRIMONY_ITEMS = [
  {
    accountCode: "debtors",
    number: "1100",
    label: "Créance à recevoir",
    description: "Montants que des membres, sponsors ou autres personnes doivent encore au club.",
    side: "asset" as const,
  },
  {
    accountCode: "creditors",
    number: "2000",
    label: "Dette à payer",
    description: "Factures ou montants que le club doit encore payer.",
    side: "liability" as const,
  },
  {
    accountCode: "fixed_assets",
    number: "1500",
    label: "Matériel / immobilisations",
    description: "Matériel ou biens importants figurant encore au patrimoine du club.",
    side: "asset" as const,
  },
  {
    accountCode: "inventory",
    number: "1200",
    label: "Stocks",
    description: "Par exemple les articles encore disponibles dans la boutique du club.",
    side: "asset" as const,
  },
  {
    accountCode: "prepaid",
    number: "1300",
    label: "Autres actifs",
    description: "Autre élément d’actif à reprendre dans la situation de départ.",
    side: "asset" as const,
  },
  {
    accountCode: "accrued",
    number: "2300",
    label: "Autres passifs",
    description: "Autre élément de passif à reprendre dans la situation de départ.",
    side: "liability" as const,
  },
] as const;

export const HISTORY_IMPORT_FORMATS = ["CSV", "Excel", "Balance comptable", "Journal comptable"] as const;
