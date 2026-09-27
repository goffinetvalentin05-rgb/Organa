import { createAdminClient } from "@/lib/supabase/admin";
import { roundChf } from "./money";
import {
  isCashPaidStatus,
  paidStatusFor,
  planReceipt,
  remainingDue,
  revenueCategoryForDocument,
} from "./receipts";
import { getAccountingAccess } from "./service";

export type RecordReceiptInput = {
  clubId: string;
  userId: string | null;
  documentId: string;
  receivedOn: string;
  amount: number;
  accountId?: string | null;
  accountCode?: string | null;
  idempotencyKey: string;
  allowStripe?: boolean;
};

export type RecordReceiptResult = {
  created: boolean;
  already: boolean;
  paid: boolean;
  status: string;
  received: number;
  remaining: number;
  entryId: string | null;
};

const USER_ERRORS = [
  "Montant supérieur au reste à encaisser",
  "Choisissez un compte de trésorerie",
  "Compte de produit introuvable",
  "Aucun exercice ouvert",
  "Date de réception invalide",
  "Ce document est annulé",
  "Document introuvable",
  "Catégorie de produit manquante",
  "Encaissement incomplet",
  "Indiquez le montant total",
];

export function receiptFailureMessage(error: unknown): string {
  const raw = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  const line = raw.split("\n")[0] ?? "";
  if (USER_ERRORS.some((prefix) => line.includes(prefix))) return line;
  return "L'écriture n'a pas pu être créée. Le document reste impayé.";
}

export async function recordDocumentReceipt(input: RecordReceiptInput): Promise<RecordReceiptResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.receivedOn)) {
    throw new Error("Date de réception invalide");
  }
  if (!input.idempotencyKey.trim()) {
    throw new Error("Encaissement incomplet");
  }

  const admin = createAdminClient();
  const access = await getAccountingAccess(input.clubId);
  const { data: doc, error: docError } = await admin
    .from("documents")
    .select("id, type, status, total_ttc, title, numero, notes, sponsor_contract_id, event_id, deleted_at")
    .eq("id", input.documentId)
    .eq("user_id", input.clubId)
    .maybeSingle();
  if (docError || !doc || doc.deleted_at) throw new Error("Document introuvable");
  if (doc.status === "refuse" || doc.status === "annule") throw new Error("Ce document est annulé");

  const total = roundChf(Number(doc.total_ttc) || 0);
  if (!access.onboarded) {
    return markPaidWithoutBooks(admin, input, doc.type as string, doc.status as string, total);
  }

  let accountId = input.accountId || null;
  if (!accountId && input.accountCode) {
    const { data: account } = await admin
      .from("accounting_accounts")
      .select("id")
      .eq("club_id", input.clubId)
      .eq("system_code", input.accountCode)
      .eq("is_active", true)
      .maybeSingle();
    accountId = (account?.id as string | undefined) ?? null;
  }
  if (!accountId) throw new Error("Choisissez un compte de trésorerie : banque, poste ou caisse");

  const category = revenueCategoryForDocument({
    type: String(doc.type),
    sponsorContractId: doc.sponsor_contract_id as string | null,
    notes: doc.notes as string | null,
    title: doc.title as string | null,
    eventId: doc.event_id as string | null,
  });

  const { data, error } = await admin.rpc("accounting_record_document_receipt", {
    p_club: input.clubId,
    p_document: input.documentId,
    p_user: input.userId,
    p_received_on: input.receivedOn,
    p_account: accountId,
    p_amount: input.amount,
    p_key: input.idempotencyKey.trim(),
    p_category: category,
    p_allow_stripe: Boolean(input.allowStripe),
  });
  if (error) throw new Error(receiptFailureMessage(error));

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    created: Boolean(row.created),
    already: Boolean(row.already),
    paid: Boolean(row.paid),
    status: String(row.status ?? doc.status),
    received: roundChf(Number(row.received) || 0),
    remaining: roundChf(Number(row.remaining) || 0),
    entryId: (row.entry_id as string | null) ?? null,
  };
}

async function markPaidWithoutBooks(
  admin: ReturnType<typeof createAdminClient>,
  input: RecordReceiptInput,
  type: string,
  status: string,
  total: number
): Promise<RecordReceiptResult> {
  const plan = planReceipt(total, isCashPaidStatus(type, status) ? total : 0, input.amount);
  if (!plan.ok) {
    if (plan.reason === "settled") {
      return {
        created: false,
        already: true,
        paid: true,
        status: paidStatusFor(type),
        received: total,
        remaining: 0,
        entryId: null,
      };
    }
    throw new Error("Montant supérieur au reste à encaisser");
  }
  if (!plan.paid) {
    throw new Error("Indiquez le montant total : un encaissement partiel passe par la comptabilité.");
  }
  const next = paidStatusFor(type);
  const { error } = await admin
    .from("documents")
    .update({ status: next, date_paiement: input.receivedOn })
    .eq("id", input.documentId)
    .eq("user_id", input.clubId);
  if (error) throw new Error("L'écriture n'a pas pu être créée. Le document reste impayé.");
  return {
    created: false,
    already: false,
    paid: true,
    status: next,
    received: plan.received,
    remaining: remainingDue(total, plan.received),
    entryId: null,
  };
}
