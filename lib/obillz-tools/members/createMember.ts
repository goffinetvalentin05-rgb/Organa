import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { createMemberForClub } from "./service";

export const createMember = defineTool<
  {
    nom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    postal_code?: string;
    city?: string;
    role?: string;
    category?: string;
  },
  { member: unknown }
>({
  name: "create_member",
  description: "Creates a member in the user's Obillz club.",
  action: "members.create",
  permission: PERMISSIONS.MANAGE_MEMBERS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      nom: { type: "string" },
      email: { type: "string" },
      telephone: { type: "string" },
      adresse: { type: "string" },
      postal_code: { type: "string" },
      city: { type: "string" },
      role: { type: "string" },
      category: { type: "string", description: "Team/category slug" },
    },
    required: ["nom"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { member: { type: "object" } },
    required: ["member"],
  },
  async execute(actor, input) {
    const member = await createMemberForClub({
      clubId: actor.clubId,
      actorUserId: actor.userId,
      body: input as Record<string, unknown>,
    });
    return { member };
  },
});
