import type { ClubRole } from "@/lib/auth/rbac";
import type { Permission } from "@/lib/auth/permissions-shared";

export type ToolRisk = "read" | "write" | "sensitive";

export type ToolSource = "chatgpt" | "claude" | "gemini" | "obillz" | "api";

export const TOOL_SOURCES: ToolSource[] = [
  "chatgpt",
  "claude",
  "gemini",
  "obillz",
  "api",
];

export type JsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
};

export type ToolActor = {
  userId: string;
  clubId: string;
  role: ClubRole;
  isOwner: boolean;
  /** Permission réellement utilisée pour cette action. */
  permission: Permission;
  action: string;
};

export type ConfirmationPreview = {
  action: string;
  summary: string;
  count?: number;
  unitAmount?: number;
  totalAmount?: number;
  currency?: string;
  targets?: Array<{ id: string; label: string }>;
};

export type ToolResultStatus =
  | "completed"
  | "needs_confirmation"
  | "denied"
  | "error";

export type ToolEnvelope<T = unknown> =
  | { status: "completed"; result: T }
  | {
      status: "needs_confirmation";
      confirmationId: string;
      preview: ConfirmationPreview;
    }
  | { status: "denied"; error: string; required?: Permission | Permission[] }
  | { status: "error"; error: string; code?: string };

export type ObillzTool<TIn = unknown, TOut = unknown> = {
  name: string;
  description: string;
  /** Nom d’action interne pour les logs, ex. `finance.invoice.create`. */
  action: string;
  permission: Permission | Permission[];
  risk: ToolRisk;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  execute: (actor: ToolActor, input: TIn) => Promise<TOut>;
  preview?: (actor: ToolActor, input: TIn) => Promise<ConfirmationPreview>;
};

export type RunToolInput = {
  name: string;
  input: unknown;
  userId: string;
  clubId: string;
  /** Sujet authentifié (session ou token gateway). Doit égaler `userId`. */
  authenticatedUserId: string;
  source: ToolSource;
  confirm?: boolean;
  confirmationId?: string;
};
