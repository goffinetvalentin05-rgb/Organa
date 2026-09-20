import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import { FINANCE_MANAGE } from "@/lib/obillz-tools/finance/permissions";
import {
  isUnpaidDocumentStatus,
  listDocumentsForClub,
  mapDocumentRow,
} from "@/lib/obillz-tools/finance/documentsQuery";
import { listMembersForClub } from "@/lib/obillz-tools/members/service";
import { sendClubDocumentEmail } from "./sendDocumentEmailServer";

export const getRecipients = defineTool<
  { category?: string; unpaid_fees_only?: boolean },
  { recipients: unknown[] }
>({
  name: "get_recipients",
  description:
    "Lists message recipients: club members with an email, optionally filtered by team or unpaid membership fees.",
  action: "communications.recipients.read",
  permission: PERMISSIONS.VIEW_MEMBERS,
  risk: "read",
  inputSchema: {
    type: "object",
    properties: {
      category: { type: "string" },
      unpaid_fees_only: { type: "boolean" },
    },
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { recipients: { type: "array" } },
    required: ["recipients"],
  },
  async execute(actor, input) {
    const members = await listMembersForClub(actor.clubId);
    let list = members.filter((m) => Boolean(m.email));
    if (input.category) {
      list = list.filter((m) => m.category === input.category);
    }
    if (input.unpaid_fees_only) {
      const fees = await listDocumentsForClub({
        clubId: actor.clubId,
        type: "quote",
      });
      const unpaidClientIds = new Set(
        fees
          .filter((row) => isUnpaidDocumentStatus(row.status, row.date_paiement))
          .map((row) => row.client_id)
          .filter(Boolean)
      );
      list = list.filter((m) => unpaidClientIds.has(m.id));
    }
    return {
      recipients: list.map((m) => ({
        memberId: m.id,
        nom: m.nom,
        email: m.email,
        category: m.category,
      })),
    };
  },
});

export const draftMessage = defineTool<
  { subject: string; body: string; category?: string; unpaid_fees_only?: boolean },
  { draft: unknown }
>({
  name: "draft_message",
  description: "Prepares a message preview without sending.",
  action: "communications.draft",
  permission: PERMISSIONS.MANAGE_MEMBERS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      subject: { type: "string" },
      body: { type: "string" },
      category: { type: "string" },
      unpaid_fees_only: { type: "boolean" },
    },
    required: ["subject", "body"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { draft: { type: "object" } },
    required: ["draft"],
  },
  async execute(actor, input) {
    const { recipients } = await getRecipients.execute(actor, {
      category: input.category,
      unpaid_fees_only: input.unpaid_fees_only,
    });
    return {
      draft: {
        subject: input.subject,
        body: input.body,
        recipientCount: recipients.length,
        recipients,
      },
    };
  },
});

export const sendDocumentEmail = defineTool<
  { document_id: string; type: "cotisation" | "facture" },
  { sent: unknown }
>({
  name: "send_document_email",
  description: "Emails a membership fee or invoice PDF to the document recipient.",
  action: "communications.send_document",
  permission: [...FINANCE_MANAGE],
  risk: "sensitive",
  inputSchema: {
    type: "object",
    properties: {
      document_id: { type: "string" },
      type: { type: "string", enum: ["cotisation", "facture"] },
    },
    required: ["document_id", "type"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { sent: { type: "object" } },
    required: ["sent"],
  },
  async preview(_actor, input) {
    return {
      action: "communications.send_document",
      summary: `Envoyer le document ${input.document_id} par email`,
      count: 1,
      targets: [{ id: input.document_id, label: input.type }],
    };
  },
  async execute(actor, input) {
    const sent = await sendClubDocumentEmail({
      clubId: actor.clubId,
      documentId: input.document_id,
      type: input.type,
    });
    return { sent };
  },
});

export const sendMessage = defineTool<
  { document_ids?: string[]; unpaid_fees?: boolean },
  { sent: unknown[] }
>({
  name: "send_message",
  description:
    "Sends reminder emails for unpaid membership fees, or for explicit document ids. Requires confirmation.",
  action: "communications.send",
  permission: [...FINANCE_MANAGE],
  risk: "sensitive",
  inputSchema: {
    type: "object",
    properties: {
      document_ids: { type: "array", items: { type: "string" } },
      unpaid_fees: { type: "boolean" },
    },
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { sent: { type: "array" } },
    required: ["sent"],
  },
  async preview(actor, input) {
    const docs = await resolveSendDocuments(actor.clubId, input);
    return {
      action: "communications.send",
      summary: `Envoyer ${docs.length} relance(s) par email`,
      count: docs.length,
      targets: docs.map((d) => ({
        id: d.id,
        label: d.numero || d.title || d.id,
      })),
    };
  },
  async execute(actor, input) {
    const docs = await resolveSendDocuments(actor.clubId, input);
    if (docs.length === 0) {
      throw new ToolError("Aucun document à envoyer", "NO_DOCUMENTS");
    }
    const sent: unknown[] = [];
    for (const doc of docs) {
      const result = await sendClubDocumentEmail({
        clubId: actor.clubId,
        documentId: doc.id,
        type: doc.type === "invoice" ? "facture" : "cotisation",
      });
      sent.push({ documentId: doc.id, ...result });
    }
    return { sent };
  },
});

async function resolveSendDocuments(
  clubId: string,
  input: { document_ids?: string[]; unpaid_fees?: boolean }
) {
  if (input.document_ids?.length) {
    const rows = await listDocumentsForClub({ clubId });
    const set = new Set(input.document_ids);
    return rows.filter((row) => set.has(row.id)).map(mapDocumentRow);
  }
  const fees = await listDocumentsForClub({ clubId, type: "quote" });
  return fees
    .filter((row) => isUnpaidDocumentStatus(row.status, row.date_paiement))
    .map(mapDocumentRow);
}
