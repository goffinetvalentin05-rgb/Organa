import { createAdminClient } from "@/lib/supabase/admin";
import { resolveClubDocumentId } from "@/lib/documents/documentRef";
import { roundChf } from "./money";
import {
  isCashPaidStatus,
  paidStatusFor,
  planReceipt,
  remainingDue,
  revenueCategoryForDocument,
} from "./receipts";
import { getAccountingAccess } from "./service";
import { loadTransitoryFacts } from "./transitoryLoad";
import {
  EXISTING_ACCRUAL_MESSAGE,
  planTransitory,
} from "./transitory";

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
  fee?: number;
  transitory?: {
    productPeriodId: string | null;
    recognitionDate: string | null;
  } | null;
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
  "Compte de frais bancaires introuvable",
  "exercice clôturé",
  "date de paiement",
  "Transitoire",
  "Débiteurs",
  "transitoires",
  "rattachement",
  "régularisation",
  "créance",
  "exercice du produit",
  "même exercice",
  "chevauchent",
  "déjà soldée",
  "migration 104",
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
  const resolvedDocument = await resolveClubDocumentId(admin, input.clubId, input.documentId);
  if (!resolvedDocument.ok) throw new Error(resolvedDocument.error);
  input.documentId = resolvedDocument.id;
  const access = await getAccountingAccess(input.clubId);
  const { data: doc, error: docError } = await admin
    .from("documents")
    .select("id, type, status, total_ht, total_tva, total_ttc, title, numero, notes, sponsor_contract_id, event_id, deleted_at")
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

  const fee = roundChf(input.fee || 0);
  if (input.transitory) {
    if (String(doc.type) !== "invoice" && String(doc.type) !== "quote") {
      throw new Error("L'option Transitoire concerne une facture ou une cotisation");
    }
    if (fee > 0) throw new Error("L'option Transitoire ne répartit pas les frais. Enregistrez un encaissement normal.");
    const { data: replay } = await admin
      .from("document_receipts")
      .select("id")
      .eq("club_id", input.clubId)
      .eq("idempotency_key", input.idempotencyKey.trim())
      .maybeSingle();
    let productPeriodId = input.transitory.productPeriodId;
    let recognitionDate = input.transitory.recognitionDate;
    if (!replay) {
      const facts = await loadTransitoryFacts(admin, {
        clubId: input.clubId,
        documentId: input.documentId,
        categoryCode: category,
        sourceType: String(doc.type) === "quote" ? "membership" : "invoice",
      });
      if (!facts.ready || !facts.revenueAccountId) {
        throw new Error(facts.notice || "L'option Transitoire demande la migration 104. L'encaissement normal reste disponible.");
      }
      const plan = planTransitory({
        invoiceTotal: total,
        alreadyReceived: facts.received,
        paymentAmount: input.amount,
        paymentDate: input.receivedOn,
        documentType: String(doc.type),
        documentStatus: String(doc.status || ""),
        totalHt: Number(doc.total_ht) || 0,
        totalTva: Number(doc.total_tva) || 0,
        totalTtc: total,
        periods: facts.periods,
        productPeriodId,
        recognitionDate,
        treasuryAccountId: accountId,
        revenueAccountId: facts.revenueAccountId,
        accounts: facts.accounts,
        regularized: facts.regularized,
        settled: facts.settled,
        released: facts.released,
        existingAccrual: facts.existingAccrual,
        preferredClearingId: facts.preferredClearingId,
      });
      if (!plan.ok) throw new Error(plan.message);
      productPeriodId = plan.productPeriodId;
      recognitionDate = plan.recognitionDate;
    }
    const { data, error } = await admin.rpc("accounting_record_transitory_receipt", {
      p_club: input.clubId,
      p_document: input.documentId,
      p_user: input.userId,
      p_received_on: input.receivedOn,
      p_account: accountId,
      p_amount: input.amount,
      p_key: input.idempotencyKey.trim(),
      p_category: category,
      p_product_period: productPeriodId,
      p_recognition: recognitionDate,
    });
    if (error) {
      if (/schema cache|Could not find the function/i.test(error.message || "")) {
        throw new Error("L'option Transitoire demande la migration 104. L'encaissement normal reste disponible.");
      }
      throw new Error(receiptFailureMessage(error));
    }
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

  if (String(doc.type) === "invoice" || String(doc.type) === "quote") {
    const facts = await loadTransitoryFacts(admin, {
      clubId: input.clubId,
      documentId: input.documentId,
      categoryCode: category,
      sourceType: String(doc.type) === "quote" ? "membership" : "invoice",
    });
    if (facts.ready && facts.openReceivable > 0) throw new Error(EXISTING_ACCRUAL_MESSAGE);
  }

  const payload: Record<string, unknown> = {
    p_club: input.clubId,
    p_document: input.documentId,
    p_user: input.userId,
    p_received_on: input.receivedOn,
    p_account: accountId,
    p_amount: input.amount,
    p_key: input.idempotencyKey.trim(),
    p_category: category,
    p_allow_stripe: Boolean(input.allowStripe),
  };
  if (fee > 0) payload.p_fee = fee;
  const { data, error } = await admin.rpc("accounting_record_document_receipt", payload);
  if (error) {
    if (fee > 0 && /schema cache|Could not find the function|p_fee/i.test(error.message || "")) {
      throw new Error("Les frais Stripe ne peuvent pas encore être comptabilisés. Appliquez la migration 102, puis réessayez.");
    }
    throw new Error(receiptFailureMessage(error));
  }

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
