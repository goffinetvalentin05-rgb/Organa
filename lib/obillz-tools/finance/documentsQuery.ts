import { createAdminClient } from "@/lib/supabase/admin";
import { ToolError } from "@/lib/obillz-tools/core/errors";

const UNPAID_EXCLUDED = new Set([
  "paye",
  "accepte",
  "refuse",
  "annule",
  "cancelled",
]);

export function isUnpaidDocumentStatus(
  status: string | null | undefined,
  datePaiement: string | null | undefined
): boolean {
  if (datePaiement) return false;
  const s = (status || "").toLowerCase();
  if (UNPAID_EXCLUDED.has(s)) return false;
  if (s === "brouillon") return false;
  return true;
}

export type DocumentSummaryRow = {
  id: string;
  numero: string | null;
  title: string | null;
  type: string;
  status: string | null;
  date_creation: string | null;
  date_echeance: string | null;
  date_paiement: string | null;
  total_ttc: number | string | null;
  client_id: string | null;
  sponsor_contract_id: string | null;
  client?: { id?: string; nom?: string | null } | { id?: string; nom?: string | null }[] | null;
};

function admin() {
  return createAdminClient();
}

export async function listDocumentsForClub(params: {
  clubId: string;
  type?: "invoice" | "quote";
  id?: string;
}): Promise<DocumentSummaryRow[]> {
  let query = admin()
    .from("documents")
    .select(
      "id, numero, title, type, status, date_creation, date_echeance, date_paiement, total_ttc, client_id, sponsor_contract_id, client:clients(id, nom)"
    )
    .eq("user_id", params.clubId)
    .is("deleted_at", null);

  if (params.type) query = query.eq("type", params.type);
  if (params.id) query = query.eq("id", params.id);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    throw new ToolError(
      "Erreur lors du chargement des documents",
      "DOCUMENTS_LIST_FAILED",
      500
    );
  }
  return (data || []) as DocumentSummaryRow[];
}

export function mapDocumentRow(row: DocumentSummaryRow) {
  const client = Array.isArray(row.client) ? row.client[0] : row.client;
  return {
    id: row.id,
    numero: row.numero,
    title: row.title,
    type: row.type,
    status: row.status || "brouillon",
    dateCreation: row.date_creation,
    dateEcheance: row.date_echeance,
    datePaiement: row.date_paiement,
    totalTtc: Number(row.total_ttc) || 0,
    clientId: row.client_id,
    sponsorContractId: row.sponsor_contract_id,
    clientName: client?.nom ?? null,
  };
}

export async function cancelDocumentForClub(params: {
  clubId: string;
  actorUserId: string;
  documentId: string;
  type: "invoice" | "quote";
}): Promise<{ id: string; status: string }> {
  const db = admin();
  const { data: existing, error: fetchError } = await db
    .from("documents")
    .select("id, type, status")
    .eq("id", params.documentId)
    .eq("user_id", params.clubId)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new ToolError("Document introuvable ou non autorisé", "DOCUMENT_NOT_FOUND", 404);
  }
  if (existing.type !== params.type) {
    throw new ToolError("Le type de document ne correspond pas", "DOCUMENT_TYPE_MISMATCH", 400);
  }
  if (existing.status === "paye" || existing.status === "accepte") {
    throw new ToolError(
      "Impossible d’annuler un document déjà payé",
      "DOCUMENT_ALREADY_PAID",
      400
    );
  }

  const { data: updated, error } = await db
    .from("documents")
    .update({ status: "annule", updated_by: params.actorUserId })
    .eq("id", params.documentId)
    .eq("user_id", params.clubId)
    .select("id, status")
    .single();

  if (error || !updated) {
    throw new ToolError(
      "Erreur lors de l’annulation du document",
      "DOCUMENT_CANCEL_FAILED",
      500
    );
  }

  return { id: updated.id as string, status: String(updated.status) };
}

export async function getFinancialSummaryForClub(params: {
  clubId: string;
  periodStart: string;
  periodEnd: string;
}) {
  const db = admin();
  const [{ data: documents }, { data: expenses }, { data: revenues }] =
    await Promise.all([
      db
        .from("documents")
        .select("type, status, total_ttc, date_creation, date_paiement")
        .eq("user_id", params.clubId)
        .is("deleted_at", null)
        .gte("date_creation", params.periodStart)
        .lte("date_creation", params.periodEnd),
      db
        .from("expenses")
        .select("amount, date")
        .eq("user_id", params.clubId)
        .gte("date", params.periodStart)
        .lte("date", params.periodEnd),
      db
        .from("club_revenues")
        .select("amount, revenue_date")
        .eq("user_id", params.clubId)
        .gte("revenue_date", params.periodStart)
        .lte("revenue_date", params.periodEnd),
    ]);

  const invoices = (documents || []).filter((d) => d.type === "invoice");
  const quotes = (documents || []).filter((d) => d.type === "quote");
  const paidInvoices = invoices.filter(
    (d) => d.status === "paye" || d.date_paiement
  );
  const unpaidInvoices = invoices.filter((d) =>
    isUnpaidDocumentStatus(d.status as string, d.date_paiement as string | null)
  );
  const unpaidFees = quotes.filter((d) =>
    isUnpaidDocumentStatus(d.status as string, d.date_paiement as string | null)
  );

  const sum = (rows: { amount?: number | string | null; total_ttc?: number | string | null }[], key: "amount" | "total_ttc") =>
    rows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);

  const invoiceRevenue = sum(paidInvoices, "total_ttc");
  const simpleRevenue = sum(revenues || [], "amount");
  const expenseTotal = sum(expenses || [], "amount");

  return {
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    currency: "CHF",
    invoiceRevenue,
    otherRevenue: simpleRevenue,
    totalRevenue: invoiceRevenue + simpleRevenue,
    expenses: expenseTotal,
    net: invoiceRevenue + simpleRevenue - expenseTotal,
    unpaidInvoicesCount: unpaidInvoices.length,
    unpaidInvoicesAmount: sum(unpaidInvoices, "total_ttc"),
    unpaidMembershipFeesCount: unpaidFees.length,
    unpaidMembershipFeesAmount: sum(unpaidFees, "total_ttc"),
  };
}
