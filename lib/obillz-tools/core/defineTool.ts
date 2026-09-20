import type { ObillzTool } from "./types";
import { registerTool } from "./registry";

export function defineTool<TIn, TOut>(tool: ObillzTool<TIn, TOut>): ObillzTool<TIn, TOut> {
  return registerTool(tool);
}
