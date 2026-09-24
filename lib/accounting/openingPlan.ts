import { RECOMMENDED_CHART, DEFAULT_MAPPINGS } from "./chart";
import { buildOpeningLines, linesAreBalanced } from "./engine";
import { extraBankSystemCode, isExtraBankSystemCode } from "./financialAccounts";
import { allocateExtraBankNumbers, periodLabel, type NormalizedOnboarding } from "./onboarding";
import { roundChf } from "./money";
import type { AccountType, DraftLine } from "./types";

export const OPENING_PLAN_USER_MESSAGE =
  "Certains comptes nécessaires à votre situation de départ n’ont pas pu être préparés. Revenez à l’étape Plan ou réessayez.";

export type PlannedAccount = {
  number: string;
  name: string;
  accountType: AccountType;
  accountClass: number;
  systemCode: string | null;
  isSystem: boolean;
  sortOrder: number;
};

export type OpeningDiagnostic = {
  missing_account_codes: string[];
  missing_account_ids: string[];
};

export type MappedOpeningLine = {
  account_id: string;
  system_code: string | null;
  number: string;
  debit: number;
  credit: number;
};

export function planOnboardingAccounts(params: NormalizedOnboarding): PlannedAccount[] {
  const accounts: PlannedAccount[] = RECOMMENDED_CHART.map((account, index) => ({
    number: account.number,
    name: account.name,
    accountType: account.accountType,
    accountClass: account.accountClass,
    systemCode: account.systemCode,
    isSystem: account.isSystem,
    sortOrder: index,
  }));

  const primary = params.banks[0];
  const bank = accounts.find((account) => account.systemCode === "bank");
  if (bank && primary) bank.name = primary.name;

  if (params.useCash) {
    const cash = accounts.find((account) => account.systemCode === "cash");
    if (cash) cash.name = params.cashName;
  }

  const numbers = allocateExtraBankNumbers(
    accounts.map((account) => account.number),
    params.banks.length - 1
  );
  params.banks.slice(1).forEach((extra, index) => {
    const number = numbers[index];
    if (!number) throw new Error("Plus de numéro bancaire disponible");
    accounts.push({
      number,
      name: extra.name,
      accountType: "asset",
      accountClass: 1,
      systemCode: extraBankSystemCode(number),
      isSystem: false,
      sortOrder: 30 + index,
    });
  });

  return accounts;
}

export function planOpening(params: NormalizedOnboarding, accounts: PlannedAccount[]) {
  const extras = accounts.filter((account) => isExtraBankSystemCode(account.systemCode));
  const opening = buildOpeningLines({
    bank: params.banks[0]?.amount ?? 0,
    cash: params.useCash ? params.cashAmount : 0,
    stripe: params.useStripe ? params.stripeAmount : 0,
    others: [
      ...extras.map((account, index) => ({
        accountCode: account.systemCode || "",
        amount: params.banks[index + 1]?.amount ?? 0,
        side: "asset" as const,
      })),
      ...params.others,
    ],
    equityAccountCode: "equity",
  });
  return opening;
}

export function mapOpeningLines(
  lines: DraftLine[],
  accounts: Array<{ id: string; systemCode: string | null; number: string; isActive: boolean }>
): { ok: true; lines: MappedOpeningLine[] } & OpeningDiagnostic | { ok: false; lines: MappedOpeningLine[] } & OpeningDiagnostic {
  const missing_account_codes: string[] = [];
  const missing_account_ids: string[] = [];
  const mapped: MappedOpeningLine[] = [];

  for (const line of lines) {
    const account = accounts.find(
      (item) => item.isActive && (item.systemCode === line.accountCode || item.number === line.accountCode)
    );
    if (!account) {
      missing_account_codes.push(line.accountCode);
      continue;
    }
    if (!account.id) {
      missing_account_ids.push(account.number);
      continue;
    }
    mapped.push({
      account_id: account.id,
      system_code: account.systemCode,
      number: account.number,
      debit: line.debit,
      credit: line.credit,
    });
  }

  const diagnostic = {
    missing_account_codes: [...new Set(missing_account_codes)],
    missing_account_ids: [...new Set(missing_account_ids)],
  };
  const balanced = lines.length === 0 || linesAreBalanced(lines);
  const ok = diagnostic.missing_account_codes.length === 0
    && diagnostic.missing_account_ids.length === 0
    && balanced;
  return { ok, lines: mapped, ...diagnostic };
}

export function readOpeningDiagnostic(cause: unknown): OpeningDiagnostic {
  const message = typeof cause === "object" && cause && "message" in cause
    ? String((cause as { message: unknown }).message)
    : String(cause ?? "");
  const codes = /missing_account_codes=([^\s]*)/.exec(message)?.[1] ?? "";
  const ids = /missing_account_ids=([^\s]*)/.exec(message)?.[1] ?? "";
  return {
    missing_account_codes: codes.split(",").filter(Boolean),
    missing_account_ids: ids.split(",").filter(Boolean),
  };
}

export function buildFinalizePayload(
  clubId: string,
  userId: string,
  params: NormalizedOnboarding,
  coverage: string
) {
  const accounts = planOnboardingAccounts(params);
  const opening = planOpening(params, accounts);
  const resolved = mapOpeningLines(
    opening.lines,
    accounts.map((account) => ({
      id: account.systemCode || account.number,
      systemCode: account.systemCode,
      number: account.number,
      isActive: true,
    }))
  );

  return {
    accounts,
    opening,
    resolved,
    payload: {
      club_id: clubId,
      user_id: userId,
      start_date: params.accountingStartDate,
      coverage_type: coverage,
      start_mode: params.startMode,
      history_import_status: params.historyImportStatus,
      period: {
        label: periodLabel(params.periodStart, params.periodEnd),
        starts_on: params.periodStart,
        ends_on: params.periodEnd,
      },
      accounts: accounts.map((account) => ({
        number: account.number,
        name: account.name,
        account_type: account.accountType,
        account_class: account.accountClass,
        system_code: account.systemCode,
        is_system: account.isSystem,
        sort_order: account.sortOrder,
      })),
      mappings: Object.entries(DEFAULT_MAPPINGS).map(([source_kind, system_code]) => ({
        source_kind,
        system_code,
      })),
      opening: opening.lines.length
        ? {
            entry_date: params.accountingStartDate,
            description: "Situation de départ",
            amount: roundChf(opening.lines.reduce((sum, line) => sum + line.debit, 0)),
            lines: opening.lines.map((line) => ({
              system_code: line.accountCode,
              debit: line.debit,
              credit: line.credit,
            })),
          }
        : null,
      history_planned: params.historyImportStatus === "planned",
    },
  };
}
