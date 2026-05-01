import { createClient } from "@/lib/supabase/server";
import type { ClubRole } from "@/lib/auth/rbac";

/**
 * Types d'actions auditées. Cette liste est volontairement extensible —
 * un client peut envoyer une action non répertoriée (string libre côté DB),
 * mais on encourage l'usage des constantes ci-dessous pour la cohérence.
 */
export const AuditAction = {
  // Auth
  LOGIN: "login",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_RESET_REQUEST: "password_reset_request",

  // MFA
  MFA_ENROLL: "mfa_enroll",
  MFA_VERIFY: "mfa_verify",
  MFA_DISABLE: "mfa_disable",
  MFA_RECOVERY_USED: "mfa_recovery_used",

  // CRUD générique (resource_type précise quoi)
  CREATE: "create",
  UPDATE: "update",
  SOFT_DELETE: "soft_delete",
  HARD_DELETE: "hard_delete",
  RESTORE: "restore",

  // Données
  EXPORT: "export",
  IMPORT: "import",

  // Membership / permissions
  INVITE_MEMBER: "invite_member",
  ACCEPT_INVITATION: "accept_invitation",
  REMOVE_MEMBER: "remove_member",
  CHANGE_ROLE: "change_role",

  // Intégrations
  INTEGRATION_CONNECT: "integration_connect",
  INTEGRATION_DISCONNECT: "integration_disconnect",
  INTEGRATION_KEY_ROTATED: "integration_key_rotated",

  // Storage
  FILE_UPLOAD: "file_upload",
  FILE_DOWNLOAD: "file_download",
  FILE_DELETE: "file_delete",
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

export type AuditOutcome = "success" | "failure" | "denied";

export interface AuditLogInput {
  /** Le club concerné. NULL autorisé seulement pour login_failed. */
  clubId: string | null;
  action: AuditActionValue | string;
  resourceType?: string | null;
  resourceId?: string | null;
  outcome?: AuditOutcome;
  metadata?: Record<string, unknown>;
  /** Optionnels (extraits de la requête côté API route). */
  ipAddress?: string | null;
  userAgent?: string | null;
  requestPath?: string | null;
  requestMethod?: string | null;
  /** Si l'action a lieu pour le compte d'un autre user (ex: login_failed). */
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: ClubRole | null;
}

/**
 * Insère une ligne dans audit_logs.
 *
 * Best-effort : ne JAMAIS lever — un échec d'audit ne doit pas casser
 * l'action utilisateur en cours. On log dans console.error.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      club_id: input.clubId,
      actor_id: input.actorId ?? user?.id ?? null,
      actor_email: input.actorEmail ?? user?.email ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      outcome: input.outcome ?? "success",
      metadata: input.metadata ?? {},
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      request_path: input.requestPath ?? null,
      request_method: input.requestMethod ?? null,
    };

    const { error } = await supabase.from("audit_logs").insert(payload);
    if (error) {
      console.error("[AUDIT] Échec d'écriture audit_logs:", error.message, payload);
    }
  } catch (err) {
    console.error("[AUDIT] Exception lors du log audit:", err);
  }
}

/**
 * Helper pour extraire IP/UA/path depuis une Request.
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
  requestPath: string | null;
  requestMethod: string | null;
} {
  let ip: string | null = null;
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    ip = xff.split(",")[0]?.trim() ?? null;
  } else {
    ip = request.headers.get("x-real-ip");
  }
  let path: string | null = null;
  try {
    path = new URL(request.url).pathname;
  } catch {
    path = null;
  }
  return {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
    requestPath: path,
    requestMethod: request.method,
  };
}
