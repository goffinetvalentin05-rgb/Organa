/**
 * Comptabilité de trésorerie Obillz.
 * Une opération métier = une accounting_entry.
 * Seules les écritures `validated` entrent dans les rapports officiels.
 */

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type EntryStatus = "pending" | "validated" | "reversed" | "voided";

export type EntryDirection = "in" | "out" | "transfer" | "opening" | "adjustment" | "reversal";

export type CashEventType =
  | "payment_received"
  | "payment_sent"
  | "opening"
  | "reversal"
  | "transfer"
  | "adjustment";

export type InboxStatus =
  | "pending"
  | "awaiting_account"
  | "awaiting_category"
  | "awaiting_details"
  | "posted"
  | "reversed"
  | "ignored_before_start"
  | "blocked_closed_period";

export type MissingDetail = "account" | "category";

export type DraftLine = {
  accountCode: string;
  debit: number;
  credit: number;
};

export type CashEvent = {
  amount: number;
  feeAmount?: number;
  entryDate: string;
  sourceType: string;
  sourceId: string;
  eventType: CashEventType;
  direction: EntryDirection;
  /** Code stable (bank, cash, stripe). Null = compte à confirmer. */
  financialAccountCode: string | null;
  /** Code stable de produit ou de charge. Null = catégorie à confirmer. */
  categoryCode: string | null;
  autoValidate: boolean;
  periodClosed: boolean;
  beforeStart: boolean;
};

export type PostingDecision =
  | { kind: "ignore"; reason: "before_start" }
  | { kind: "blocked"; reason: "closed_period" }
  | { kind: "awaiting"; missing: MissingDetail[] }
  | {
      kind: "post";
      status: "pending" | "validated";
      lines: DraftLine[];
      autoValidated: boolean;
    };

export type ReportLine = {
  entryId: string;
  entryStatus: EntryStatus;
  accountType: AccountType;
  accountNumber: string;
  systemCode: string | null;
  debit: number;
  credit: number;
};

export type OfficialTotals = {
  revenue: number;
  expense: number;
  result: number;
  bank: number;
  cash: number;
  stripe: number;
  treasury: number;
};

export type OpeningOther = {
  accountCode: string;
  amount: number;
  side: "asset" | "liability";
};

export type OpeningInput = {
  bank: number;
  cash: number;
  stripe: number;
  others: OpeningOther[];
  equityAccountCode: string;
};
