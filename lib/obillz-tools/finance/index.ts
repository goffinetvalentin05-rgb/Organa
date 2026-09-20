import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createDocumentRecordOrThrow,
  singleLineItems,
} from "./createDocumentRecord";
import {
  cancelDocumentForClub,
  getFinancialSummaryForClub,
  isUnpaidDocumentStatus,
  listDocumentsForClub,
  mapDocumentRow,
} from "./documentsQuery";
import { FINANCE_DELETE, FINANCE_MANAGE, FINANCE_VIEW } from "./permissions";

export const getInvoices = defineTool<Record<string, never>, { invoices: unknown[] }>({
  name: "get_invoices",
  description: "Lists invoices in the user's Obillz club.",
  action: "finance.invoice.read",
  permission: [...FINANCE_VIEW],
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { invoices: { type: "array" } },
    required: ["invoices"],
  },
  async execute(actor) {
    const rows = await listDocumentsForClub({ clubId: actor.clubId, type: "invoice" });
    return { invoices: rows.map(mapDocumentRow) };
  },
});

export const getInvoice = defineTool<{ invoice_id: string }, { invoice: unknown }>({
  name: "get_invoice",
  description: "Returns one invoice by id.",
  action: "finance.invoice.read",
  permission: [...FINANCE_VIEW],
  risk: "read",
  inputSchema: {
    type: "object",
    properties: { invoice_id: { type: "string" } },
    required: ["invoice_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { invoice: { type: "object" } },
    required: ["invoice"],
  },
  async execute(actor, input) {
    const rows = await listDocumentsForClub({
      clubId: actor.clubId,
      type: "invoice",
      id: input.invoice_id,
    });
    if (!rows[0]) throw new ToolError("Facture introuvable", "INVOICE_NOT_FOUND", 404);
    return { invoice: mapDocumentRow(rows[0]) };
  },
});

export const getUnpaidInvoices = defineTool<
  Record<string, never>,
  { invoices: unknown[] }
>({
  name: "get_unpaid_invoices",
  description: "Lists unpaid invoices (sent, overdue — excludes drafts and paid).",
  action: "finance.invoice.read",
  permission: [...FINANCE_VIEW],
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { invoices: { type: "array" } },
    required: ["invoices"],
  },
  async execute(actor) {
    const rows = await listDocumentsForClub({ clubId: actor.clubId, type: "invoice" });
    return {
      invoices: rows
        .filter((row) => isUnpaidDocumentStatus(row.status, row.date_paiement))
        .map(mapDocumentRow),
    };
  },
});

export const createInvoice = defineTool<
  {
    customer_id?: string;
    sponsor_contract_id?: string;
    amount: number;
    currency?: string;
    description: string;
    due_date?: string;
    event_id?: string;
  },
  { invoice: unknown }
>({
  name: "create_invoice",
  description:
    "Creates an invoice in the user's Obillz club. Provide customer_id (member) or sponsor_contract_id.",
  action: "finance.invoice.create",
  permission: [...FINANCE_MANAGE],
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      customer_id: { type: "string", description: "Member id (clients.id)" },
      sponsor_contract_id: { type: "string" },
      amount: { type: "number" },
      currency: { type: "string" },
      description: { type: "string" },
      due_date: { type: "string" },
      event_id: { type: "string" },
    },
    required: ["amount", "description"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { invoice: { type: "object" } },
    required: ["invoice"],
  },
  async execute(actor, input) {
    if (!Number.isFinite(input.amount) || input.amount < 0) {
      throw new ToolError("Montant invalide", "INVALID_AMOUNT");
    }
    const recipientType = input.sponsor_contract_id
      ? "sponsor"
      : input.customer_id
        ? "member"
        : undefined;
    const created = await createDocumentRecordOrThrow({
      admin: createAdminClient(),
      clubClient: await createClient(),
      clubId: actor.clubId,
      actorUserId: actor.userId,
      input: {
        type: "invoice",
        clientId: input.customer_id,
        sponsorContractId: input.sponsor_contract_id,
        recipientType,
        lignes: singleLineItems(input.description, input.amount),
        dateEcheance: input.due_date,
        eventId: input.event_id,
        statut: "envoye",
      },
    });
    return { invoice: created };
  },
});

export const updateInvoice = defineTool<
  { invoice_id: string; notes?: string; due_date?: string; status?: string },
  { invoice: { id: string } }
>({
  name: "update_invoice",
  description: "Updates invoice notes, due date or status.",
  action: "finance.invoice.update",
  permission: [...FINANCE_MANAGE],
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      invoice_id: { type: "string" },
      notes: { type: "string" },
      due_date: { type: "string" },
      status: { type: "string" },
    },
    required: ["invoice_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { invoice: { type: "object" } },
    required: ["invoice"],
  },
  async execute(actor, input) {
    const patch: Record<string, unknown> = { updated_by: actor.userId };
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.due_date !== undefined) patch.date_echeance = input.due_date;
    if (input.status !== undefined) patch.status = input.status;
    const { data, error } = await createAdminClient()
      .from("documents")
      .update(patch)
      .eq("id", input.invoice_id)
      .eq("user_id", actor.clubId)
      .eq("type", "invoice")
      .select("id")
      .single();
    if (error || !data) {
      throw new ToolError("Facture introuvable", "INVOICE_NOT_FOUND", 404);
    }
    return { invoice: { id: data.id as string } };
  },
});

export const cancelInvoice = defineTool<
  { invoice_id: string },
  { invoice: { id: string; status: string } }
>({
  name: "cancel_invoice",
  description: "Cancels an unpaid invoice (sets status to annule).",
  action: "finance.invoice.cancel",
  permission: [...FINANCE_DELETE],
  risk: "sensitive",
  inputSchema: {
    type: "object",
    properties: { invoice_id: { type: "string" } },
    required: ["invoice_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { invoice: { type: "object" } },
    required: ["invoice"],
  },
  async preview(_actor, input) {
    return {
      action: "finance.invoice.cancel",
      summary: `Annuler la facture ${input.invoice_id}`,
      targets: [{ id: input.invoice_id, label: input.invoice_id }],
    };
  },
  async execute(actor, input) {
    const invoice = await cancelDocumentForClub({
      clubId: actor.clubId,
      actorUserId: actor.userId,
      documentId: input.invoice_id,
      type: "invoice",
    });
    return { invoice };
  },
});

export const getFinancialSummary = defineTool<
  { period_start?: string; period_end?: string },
  { summary: unknown }
>({
  name: "get_financial_summary",
  description:
    "Club financial summary for a period: paid invoices, other revenues, expenses, unpaid totals. Defaults to current month.",
  action: "finance.summary.read",
  permission: [...FINANCE_VIEW],
  risk: "read",
  inputSchema: {
    type: "object",
    properties: {
      period_start: { type: "string", description: "YYYY-MM-DD" },
      period_end: { type: "string", description: "YYYY-MM-DD" },
    },
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { summary: { type: "object" } },
    required: ["summary"],
  },
  async execute(actor, input) {
    const now = new Date();
    const start =
      input.period_start ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const end =
      input.period_end || now.toISOString().slice(0, 10);
    return {
      summary: await getFinancialSummaryForClub({
        clubId: actor.clubId,
        periodStart: start,
        periodEnd: end,
      }),
    };
  },
});
