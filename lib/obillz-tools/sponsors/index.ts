import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import {
  createSponsorContractForClub,
  listSponsorRenewalsForClub,
  listSponsorsForClub,
  searchSponsorsForClub,
  updateSponsorContractForClub,
} from "./service";

export const getSponsors = defineTool<
  Record<string, never>,
  { sponsors: unknown[] }
>({
  name: "get_sponsors",
  description: "Lists sponsor contracts of the club.",
  action: "sponsors.read",
  permission: PERMISSIONS.VIEW_INVOICES,
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { sponsors: { type: "array" } },
    required: ["sponsors"],
  },
  async execute(actor) {
    return { sponsors: await listSponsorsForClub(actor.clubId) };
  },
});

export const getSponsor = defineTool<{ query: string }, { sponsors: unknown[] }>({
  name: "get_sponsor",
  description: "Finds a sponsor contract by name, e.g. « Garage Müller ».",
  action: "sponsors.read",
  permission: PERMISSIONS.VIEW_INVOICES,
  risk: "read",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string" } },
    required: ["query"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { sponsors: { type: "array" } },
    required: ["sponsors"],
  },
  async execute(actor, input) {
    if (!input.query?.trim()) {
      throw new ToolError("query requis", "SEARCH_QUERY_REQUIRED");
    }
    return { sponsors: await searchSponsorsForClub(actor.clubId, input.query) };
  },
});

export const createSponsorContract = defineTool<
  {
    sponsor_name: string;
    title: string;
    start_date: string;
    end_date: string;
    amount?: number;
    content?: string;
    sponsor_type?: string;
  },
  { contract: unknown }
>({
  name: "create_sponsor_contract",
  description: "Creates a sponsor contract.",
  action: "sponsors.create",
  permission: PERMISSIONS.MANAGE_INVOICES,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      sponsor_name: { type: "string" },
      title: { type: "string" },
      start_date: { type: "string" },
      end_date: { type: "string" },
      amount: { type: "number" },
      content: { type: "string" },
      sponsor_type: { type: "string" },
    },
    required: ["sponsor_name", "title", "start_date", "end_date"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { contract: { type: "object" } },
    required: ["contract"],
  },
  async execute(actor, input) {
    const contract = await createSponsorContractForClub({
      clubId: actor.clubId,
      actorUserId: actor.userId,
      sponsorName: input.sponsor_name,
      title: input.title,
      startDate: input.start_date,
      endDate: input.end_date,
      amount: input.amount,
      content: input.content,
      sponsorType: input.sponsor_type,
    });
    return { contract };
  },
});

export const updateSponsorContract = defineTool<
  { contract_id: string; title?: string; amount?: number; content?: string },
  { contract: unknown }
>({
  name: "update_sponsor_contract",
  description: "Updates a sponsor contract.",
  action: "sponsors.update",
  permission: PERMISSIONS.MANAGE_INVOICES,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      contract_id: { type: "string" },
      title: { type: "string" },
      amount: { type: "number" },
      content: { type: "string" },
    },
    required: ["contract_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { contract: { type: "object" } },
    required: ["contract"],
  },
  async execute(actor, input) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.amount !== undefined) patch.amount = input.amount;
    if (input.content !== undefined) patch.content = input.content;
    const contract = await updateSponsorContractForClub({
      clubId: actor.clubId,
      contractId: input.contract_id,
      patch,
    });
    return { contract };
  },
});

export const getSponsorRenewals = defineTool<
  Record<string, never>,
  { renewals: unknown[] }
>({
  name: "get_sponsor_renewals",
  description: "Lists sponsor contracts expiring within 30 days or already expired.",
  action: "sponsors.read",
  permission: PERMISSIONS.VIEW_INVOICES,
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { renewals: { type: "array" } },
    required: ["renewals"],
  },
  async execute(actor) {
    return { renewals: await listSponsorRenewalsForClub(actor.clubId) };
  },
});
