import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import { listMembersForClub, searchMembersList } from "./service";

export const searchMembers = defineTool<
  { query: string },
  { members: unknown[] }
>({
  name: "search_members",
  description:
    "Finds members by name, email or city. Use this to resolve a spoken name like « Jean Dupont ».",
  action: "members.read",
  permission: PERMISSIONS.VIEW_MEMBERS,
  risk: "read",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string" } },
    required: ["query"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { members: { type: "array" } },
    required: ["members"],
  },
  async execute(actor, input) {
    if (!input?.query || !String(input.query).trim()) {
      throw new ToolError("query requis", "SEARCH_QUERY_REQUIRED");
    }
    const members = searchMembersList(
      await listMembersForClub(actor.clubId),
      input.query
    );
    return { members };
  },
});
