import { authorizeToolAction } from "./authorize";
import {
  consumeToolConfirmation,
  createToolConfirmation,
  defaultPreview,
} from "./confirmation";
import { isToolError } from "./errors";
import { logToolAction } from "./logging";
import { getTool } from "./registry";
import type { RunToolInput, ToolEnvelope } from "./types";

export async function runTool(input: RunToolInput): Promise<ToolEnvelope> {
  const tool = getTool(input.name);
  if (!tool) {
    return { status: "error", error: `Tool inconnu : ${input.name}`, code: "UNKNOWN_TOOL" };
  }

  const auth = await authorizeToolAction({
    userId: input.userId,
    clubId: input.clubId,
    authenticatedUserId: input.authenticatedUserId,
    permission: tool.permission,
    action: tool.action,
    risk: tool.risk,
  });

  if (!auth.ok) {
    await logToolAction({
      actor: {
        clubId: input.clubId,
        userId: input.userId,
        action: tool.action,
      },
      toolName: tool.name,
      actionType: tool.action,
      parameters: input.input,
      result: { error: auth.error },
      status: "denied",
      source: input.source,
    });
    return {
      status: "denied",
      error: auth.error,
      required: auth.required ?? tool.permission,
    };
  }

  const { actor } = auth;

  if (tool.risk === "sensitive") {
    const wantsConfirm = input.confirm === true && Boolean(input.confirmationId);
    if (!wantsConfirm) {
      const preview = tool.preview
        ? await tool.preview(actor, input.input)
        : defaultPreview(tool.action, tool.name, input.input);
      const stored = await createToolConfirmation({
        actor,
        toolName: tool.name,
        input: input.input,
        preview,
      });
      await logToolAction({
        actor,
        toolName: tool.name,
        actionType: tool.action,
        parameters: input.input,
        result: { confirmationId: stored.id, preview },
        status: "needs_confirmation",
        source: input.source,
      });
      return {
        status: "needs_confirmation",
        confirmationId: stored.id,
        preview,
      };
    }

    const consumed = await consumeToolConfirmation({
      confirmationId: input.confirmationId as string,
      actor,
      toolName: tool.name,
      input: input.input,
    });
    if (!consumed.ok) {
      return { status: "error", error: consumed.error, code: "CONFIRMATION_INVALID" };
    }
  }

  try {
    const result = await tool.execute(actor, input.input);
    await logToolAction({
      actor,
      toolName: tool.name,
      actionType: tool.action,
      parameters: input.input,
      result,
      status: "completed",
      source: input.source,
    });
    return { status: "completed", result };
  } catch (err) {
    const message = isToolError(err)
      ? err.message
      : err instanceof Error
        ? err.message
        : "Erreur d’exécution du tool";
    const code = isToolError(err) ? err.code : "TOOL_FAILED";
    await logToolAction({
      actor,
      toolName: tool.name,
      actionType: tool.action,
      parameters: input.input,
      result: { error: message, code },
      status: "error",
      source: input.source,
    });
    return { status: "error", error: message, code };
  }
}
