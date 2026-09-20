import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import { archiveMemberForClub } from "./service";

export const archiveMember = defineTool<
  { member_id: string },
  { success: true; id: string }
>({
  name: "archive_member",
  description: "Deletes a member from the user's Obillz club (sensitive).",
  action: "members.archive",
  permission: PERMISSIONS.DELETE_MEMBERS,
  risk: "sensitive",
  inputSchema: {
    type: "object",
    properties: { member_id: { type: "string" } },
    required: ["member_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { success: { type: "boolean" }, id: { type: "string" } },
    required: ["success", "id"],
  },
  async preview(_actor, input) {
    return {
      action: "members.archive",
      summary: `Supprimer le membre ${input.member_id}`,
      targets: [{ id: input.member_id, label: input.member_id }],
    };
  },
  async execute(actor, input) {
    if (!input?.member_id) {
      throw new ToolError("member_id requis", "MEMBER_ID_REQUIRED");
    }
    return archiveMemberForClub({
      clubId: actor.clubId,
      memberId: input.member_id,
    });
  },
});
