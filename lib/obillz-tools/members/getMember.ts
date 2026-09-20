import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import { getMemberForClub } from "./service";

export const getMember = defineTool<{ member_id: string }, { member: unknown }>({
  name: "get_member",
  description: "Returns one member of the user's Obillz club by id.",
  action: "members.read",
  permission: PERMISSIONS.VIEW_MEMBERS,
  risk: "read",
  inputSchema: {
    type: "object",
    properties: { member_id: { type: "string" } },
    required: ["member_id"],
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
    const member = await getMemberForClub(actor.clubId, input.member_id);
    return { member };
  },
});
