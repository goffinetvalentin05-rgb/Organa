import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { listMembersForClub } from "./service";

export const getMembers = defineTool<
  { role?: string; category?: string },
  { members: unknown[] }
>({
  name: "get_members",
  description:
    "Lists members of the user's Obillz club. Optional filters: role, category (team).",
  action: "members.read",
  permission: PERMISSIONS.VIEW_MEMBERS,
  risk: "read",
  inputSchema: {
    type: "object",
    properties: {
      role: { type: "string", description: "Member role slug, e.g. player, coach" },
      category: { type: "string", description: "Team/category slug, e.g. juniors_a" },
    },
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { members: { type: "array" } },
    required: ["members"],
  },
  async execute(actor, input) {
    let members = await listMembersForClub(actor.clubId);
    if (input?.role) {
      members = members.filter((m) => m.role === input.role);
    }
    if (input?.category) {
      members = members.filter((m) => m.category === input.category);
    }
    return { members };
  },
});
