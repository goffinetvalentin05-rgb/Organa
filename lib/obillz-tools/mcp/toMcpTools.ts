import type { ObillzTool } from "../core/types";

/**
 * Forme MCP `tools/list` / `tools/call` — sans serveur HTTP ni OAuth.
 * Un gateway futur peut sérialiser ces descripteurs tels quels.
 */
export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: ObillzTool["inputSchema"];
};

export function toMcpToolDefinition(tool: ObillzTool): McpToolDefinition {
  return {
    name: tool.name,
    description: [
      tool.description,
      `Permission Obillz : ${Array.isArray(tool.permission) ? tool.permission.join(" | ") : tool.permission}.`,
      `Risque : ${tool.risk}.`,
    ].join(" "),
    inputSchema: tool.inputSchema,
  };
}

export function toMcpToolList(tools: ObillzTool[]): McpToolDefinition[] {
  return tools.map(toMcpToolDefinition);
}
