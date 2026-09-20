import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import { updateMemberForClub } from "./service";

export const updateMember = defineTool<
  {
    member_id: string;
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
  name: "update_member",
  description: "Updates a member in the user's Obillz club.",
  action: "members.update",
  permission: PERMISSIONS.MANAGE_MEMBERS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      member_id: { type: "string" },
      nom: { type: "string" },
      email: { type: "string" },
      telephone: { type: "string" },
      adresse: { type: "string" },
      postal_code: { type: "string" },
      city: { type: "string" },
      role: { type: "string" },
      category: { type: "string" },
    },
    required: ["member_id", "nom"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { member: { type: "object" } },
    required: ["member"],
  },
  async execute(actor, input) {
    if (!input?.member_id) {
      throw new ToolError("member_id requis", "MEMBER_ID_REQUIRED");
    }
    const member = await updateMemberForClub({
      clubId: actor.clubId,
      actorUserId: actor.userId,
      memberId: input.member_id,
      body: input as Record<string, unknown>,
    });
    return { member };
  },
});
