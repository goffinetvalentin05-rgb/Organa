import { createAdminClient } from "@/lib/supabase/admin";
import { checkWriteAccess } from "@/lib/billing/checkAccess";
import {
  effectivePermissions,
  type Permission,
} from "@/lib/auth/permissions";
import type { ClubRole } from "@/lib/auth/rbac";
import type { ToolActor, ToolRisk } from "./types";

export type AuthorizeToolActionInput = {
  userId: string;
  clubId: string;
  /** Sujet authentifié : session cookie ou token gateway. */
  authenticatedUserId: string;
  permission: Permission | Permission[];
  action: string;
  risk?: ToolRisk;
};

export type AuthorizeToolActionResult =
  | { ok: true; actor: ToolActor }
  | { ok: false; status: 401 | 403; error: string; required?: Permission | Permission[] };

function asPermissionList(
  permission: Permission | Permission[]
): Permission[] {
  return Array.isArray(permission) ? permission : [permission];
}

/**
 * Vérifie que l’utilisateur authentifié appartient au club et possède
 * la permission requise. Un `clubId` fourni par une IA est refusé s’il
 * ne correspond pas à une membership active.
 */
export async function authorizeToolAction(
  input: AuthorizeToolActionInput
): Promise<AuthorizeToolActionResult> {
  if (!input.authenticatedUserId || !input.userId || !input.clubId) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }

  if (input.authenticatedUserId !== input.userId) {
    return {
      ok: false,
      status: 403,
      error: "L’utilisateur de l’action ne correspond pas à la session",
    };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, status: 403, error: "Service indisponible" };
  }

  const { data, error } = await admin
    .from("club_memberships")
    .select("role, status, permissions")
    .eq("club_id", input.clubId)
    .eq("user_id", input.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 403, error: "Membership introuvable" };
  }

  if (data.status !== "active") {
    return { ok: false, status: 403, error: "Membership inactive" };
  }

  const role = data.role as ClubRole;
  const eff = effectivePermissions(role, data.status as string, data.permissions);
  const required = asPermissionList(input.permission);
  const matched = required.find((perm) => eff[perm] === true);

  if (!matched) {
    return {
      ok: false,
      status: 403,
      error: `Permission requise : ${required.join(" ou ")}`,
      required: input.permission,
    };
  }

  if (input.risk === "write" || input.risk === "sensitive") {
    const access = await checkWriteAccess(input.clubId);
    if (!access.allowed) {
      return {
        ok: false,
        status: 403,
        error: access.message || "Écriture refusée (abonnement)",
      };
    }
  }

  return {
    ok: true,
    actor: {
      userId: input.userId,
      clubId: input.clubId,
      role,
      isOwner: role === "owner",
      permission: matched,
      action: input.action,
    },
  };
}
