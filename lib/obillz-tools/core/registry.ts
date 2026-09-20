import type { ObillzTool } from "./types";

const tools = new Map<string, ObillzTool<unknown, unknown>>();

export function registerTool<TIn, TOut>(tool: ObillzTool<TIn, TOut>): ObillzTool<TIn, TOut> {
  if (tools.has(tool.name)) {
    throw new Error(`Tool déjà enregistré : ${tool.name}`);
  }
  tools.set(tool.name, tool as ObillzTool<unknown, unknown>);
  return tool;
}

export function getTool(name: string): ObillzTool<unknown, unknown> | undefined {
  return tools.get(name);
}

export function listTools(): ObillzTool<unknown, unknown>[] {
  return [...tools.values()];
}

export function listToolDescriptors() {
  return listTools().map((tool) => ({
    name: tool.name,
    description: tool.description,
    action: tool.action,
    permission: tool.permission,
    risk: tool.risk,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
  }));
}
