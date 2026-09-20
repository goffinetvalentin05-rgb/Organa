import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import {
  createDocumentRecordOrThrow,
  singleLineItems,
} from "@/lib/obillz-tools/finance/createDocumentRecord";
import {
  isUnpaidDocumentStatus,
  listDocumentsForClub,
  mapDocumentRow,
} from "@/lib/obillz-tools/finance/documentsQuery";
import { FINANCE_MANAGE, FINANCE_VIEW } from "@/lib/obillz-tools/finance/permissions";
import { listMembersForClub } from "@/lib/obillz-tools/members/service";

export const getMembershipFees = defineTool<
  Record<string, never>,
  { fees: unknown[] }
>({
  name: "get_membership_fees",
  description: "Lists membership fees (documents type quote) of the club.",
  action: "fees.read",
  permission: [...FINANCE_VIEW],
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { fees: { type: "array" } },
    required: ["fees"],
  },
  async execute(actor) {
    const rows = await listDocumentsForClub({ clubId: actor.clubId, type: "quote" });
    return { fees: rows.map(mapDocumentRow) };
  },
});

export const getUnpaidMembershipFees = defineTool<
  Record<string, never>,
  { fees: unknown[] }
>({
  name: "get_unpaid_membership_fees",
  description:
    "Lists members who have not paid their membership fee (unpaid quotes, excluding drafts).",
  action: "fees.read",
  permission: [...FINANCE_VIEW],
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { fees: { type: "array" } },
    required: ["fees"],
  },
  async execute(actor) {
    const rows = await listDocumentsForClub({ clubId: actor.clubId, type: "quote" });
    return {
      fees: rows
        .filter((row) => isUnpaidDocumentStatus(row.status, row.date_paiement))
        .map(mapDocumentRow),
    };
  },
});

export const createMembershipFee = defineTool<
  {
    member_id: string;
    amount: number;
    description: string;
    due_date?: string;
  },
  { fee: unknown }
>({
  name: "create_membership_fee",
  description: "Creates one membership fee (cotisation) for a member.",
  action: "fees.create",
  permission: [...FINANCE_MANAGE],
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      member_id: { type: "string" },
      amount: { type: "number" },
      description: { type: "string" },
      due_date: { type: "string" },
    },
    required: ["member_id", "amount", "description"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { fee: { type: "object" } },
    required: ["fee"],
  },
  async execute(actor, input) {
    const created = await createDocumentRecordOrThrow({
      admin: createAdminClient(),
      clubClient: await createClient(),
      clubId: actor.clubId,
      actorUserId: actor.userId,
      input: {
        type: "quote",
        clientId: input.member_id,
        lignes: singleLineItems(input.description, input.amount),
        dateEcheance: input.due_date,
        statut: "envoye",
      },
    });
    return { fee: created };
  },
});

type BulkFeeInput = {
  amount: number;
  description: string;
  due_date?: string;
  category?: string;
  member_ids?: string[];
};

export const createMembershipFeesBulk = defineTool<
  BulkFeeInput,
  { created: unknown[]; summary: { count: number; unitAmount: number; total: number } }
>({
  name: "create_membership_fees_bulk",
  description:
    "Creates a membership fee for many members (all active, a team category, or explicit ids). Requires confirmation.",
  action: "fees.create_bulk",
  permission: [...FINANCE_MANAGE],
  risk: "sensitive",
  inputSchema: {
    type: "object",
    properties: {
      amount: { type: "number" },
      description: { type: "string" },
      due_date: { type: "string" },
      category: { type: "string" },
      member_ids: { type: "array", items: { type: "string" } },
    },
    required: ["amount", "description"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      created: { type: "array" },
      summary: { type: "object" },
    },
    required: ["created", "summary"],
  },
  async preview(actor, input) {
    const targets = await resolveBulkMembers(actor.clubId, input);
    return {
      action: "fees.create_bulk",
      summary: `Créer ${targets.length} cotisations de ${input.amount} CHF`,
      count: targets.length,
      unitAmount: input.amount,
      totalAmount: targets.length * input.amount,
      currency: "CHF",
      targets: targets.map((m) => ({ id: m.id, label: m.nom || m.id })),
    };
  },
  async execute(actor, input) {
    if (!Number.isFinite(input.amount) || input.amount < 0) {
      throw new ToolError("Montant invalide", "INVALID_AMOUNT");
    }
    const targets = await resolveBulkMembers(actor.clubId, input);
    if (targets.length === 0) {
      throw new ToolError("Aucun membre cible", "NO_MEMBERS");
    }
    const admin = createAdminClient();
    const clubClient = await createClient();
    const created: unknown[] = [];
    for (const member of targets) {
      const fee = await createDocumentRecordOrThrow({
        admin,
        clubClient,
        clubId: actor.clubId,
        actorUserId: actor.userId,
        input: {
          type: "quote",
          clientId: member.id,
          lignes: singleLineItems(input.description, input.amount),
          dateEcheance: input.due_date,
          statut: "envoye",
        },
      });
      created.push({ memberId: member.id, ...fee });
    }
    return {
      created,
      summary: {
        count: created.length,
        unitAmount: input.amount,
        total: created.length * input.amount,
      },
    };
  },
});

async function resolveBulkMembers(
  clubId: string,
  input: BulkFeeInput
): Promise<{ id: string; nom: string | null }[]> {
  const members = await listMembersForClub(clubId);
  if (input.member_ids?.length) {
    const set = new Set(input.member_ids);
    return members.filter((m) => set.has(m.id));
  }
  if (input.category) {
    return members.filter((m) => m.category === input.category);
  }
  return members;
}
