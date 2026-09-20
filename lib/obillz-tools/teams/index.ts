import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { MEMBER_CATEGORY_SLUGS } from "@/lib/members/taxonomy";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import { listMembersForClub, updateMemberForClub } from "@/lib/obillz-tools/members/service";

export const getTeams = defineTool<Record<string, never>, { teams: string[] }>({
  name: "get_teams",
  description:
    "Lists team/category values used in the club (clients.category). There is no separate teams table.",
  action: "teams.read",
  permission: PERMISSIONS.VIEW_MEMBERS,
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { teams: { type: "array" } },
    required: ["teams"],
  },
  async execute(actor) {
    const members = await listMembersForClub(actor.clubId);
    const used = [
      ...new Set(
        members.map((m) => m.category).filter((c): c is string => Boolean(c))
      ),
    ].sort();
    return {
      teams: used.length > 0 ? used : [...MEMBER_CATEGORY_SLUGS],
    };
  },
});

export const getTeamMembers = defineTool<
  { category: string },
  { members: unknown[] }
>({
  name: "get_team_members",
  description: "Lists members whose category matches the given team slug or custom name.",
  action: "teams.read",
  permission: PERMISSIONS.VIEW_MEMBERS,
  risk: "read",
  inputSchema: {
    type: "object",
    properties: { category: { type: "string" } },
    required: ["category"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { members: { type: "array" } },
    required: ["members"],
  },
  async execute(actor, input) {
    if (!input?.category) {
      throw new ToolError("category requise", "TEAM_CATEGORY_REQUIRED");
    }
    const members = await listMembersForClub(actor.clubId);
    return {
      members: members.filter((m) => m.category === input.category),
    };
  },
});

export const addMemberToTeam = defineTool<
  { member_id: string; category: string; nom: string },
  { member: unknown }
>({
  name: "add_member_to_team",
  description:
    "Sets a member's category (team). Requires the member's current name because member updates always send nom.",
  action: "teams.update",
  permission: PERMISSIONS.MANAGE_MEMBERS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      member_id: { type: "string" },
      category: { type: "string" },
      nom: { type: "string" },
    },
    required: ["member_id", "category", "nom"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { member: { type: "object" } },
    required: ["member"],
  },
  async execute(actor, input) {
    const member = await updateMemberForClub({
      clubId: actor.clubId,
      actorUserId: actor.userId,
      memberId: input.member_id,
      body: { nom: input.nom, category: input.category },
    });
    return { member };
  },
});

export const removeMemberFromTeam = defineTool<
  { member_id: string; nom: string },
  { member: unknown }
>({
  name: "remove_member_from_team",
  description: "Clears a member's team/category.",
  action: "teams.update",
  permission: PERMISSIONS.MANAGE_MEMBERS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      member_id: { type: "string" },
      nom: { type: "string" },
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
    const member = await updateMemberForClub({
      clubId: actor.clubId,
      actorUserId: actor.userId,
      memberId: input.member_id,
      body: { nom: input.nom, category: "" },
    });
    return { member };
  },
});
