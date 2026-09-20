import { createAdminClient } from "@/lib/supabase/admin";
import { AuditAction, logAudit } from "@/lib/auth/audit";
import { redactToolPayload } from "./redact";
import type { ToolActor, ToolSource } from "./types";

export type AiActionLogStatus =
  | "completed"
  | "needs_confirmation"
  | "denied"
  | "error";

export async function logToolAction(params: {
  actor: Pick<ToolActor, "clubId" | "userId" | "action"> | {
    clubId: string;
    userId: string;
    action: string;
  };
  toolName: string;
  actionType: string;
  parameters: unknown;
  result: unknown;
  status: AiActionLogStatus;
  source: ToolSource;
}): Promise<void> {
  const safeParams = redactToolPayload(params.parameters);
  const safeResult = redactToolPayload(params.result);

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("ai_action_logs").insert({
      club_id: params.actor.clubId,
      user_id: params.actor.userId,
      tool_name: params.toolName,
      action_type: params.actionType,
      parameters: safeParams ?? {},
      result: safeResult ?? null,
      status: params.status,
      source: params.source,
    });
    if (error) {
      console.error("[AI_ACTION_LOG] Échec d'écriture:", error.message);
    }
  } catch (err) {
    console.error("[AI_ACTION_LOG] Exception:", err);
  }

  const auditAction =
    params.status === "denied"
      ? "ai_tool_denied"
      : params.status === "error"
        ? "ai_tool_error"
        : params.status === "needs_confirmation"
          ? "ai_tool_preview"
          : AuditAction.CREATE;

  await logAudit({
    clubId: params.actor.clubId,
    actorId: params.actor.userId,
    action:
      params.status === "completed" ? `ai_tool:${params.actionType}` : auditAction,
    resourceType: "obillz_tool",
    resourceId: params.toolName,
    outcome:
      params.status === "denied"
        ? "denied"
        : params.status === "error"
          ? "failure"
          : "success",
    metadata: {
      source: params.source,
      tool_name: params.toolName,
      action_type: params.actionType,
      status: params.status,
    },
  });
}
