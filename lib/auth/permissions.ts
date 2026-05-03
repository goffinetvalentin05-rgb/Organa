import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext, type AuthContext, type ClubRole } from "@/lib/auth/rbac";
import {
  ALL_PERMISSIONS,
  emptyPermissionMap,
  fullPermissionMap,
  sanitizePermissions,
  type Permission,
} from "@/lib/auth/permissions-shared";

/**
 * Helpers serveur pour le contrôle d'accès basé sur les permissions
 * granulaires (`club_memberships.permissions`).
 *
 * Pour les constantes (PERMISSIONS, PERMISSION_LABELS, etc.) et les helpers
 * purs utilisables côté client, voir `permissions-shared.ts`.
 */

// Re-exports pour compatibilité ascendante (les API routes existantes
// peuvent continuer à importer depuis "@/lib/auth/permissions").
export {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  fullPermissionMap,
  emptyPermissionMap,
  suggestedDefaultPermissions,
  sanitizePermissions,
  type Permission,
} from "@/lib/auth/permissions-shared";

export interface Membership {
  clubId: string;
  userId: string;
  role: ClubRole;
  status: "invited" | "active" | "disabled";
  permissions: Record<Permission, boolean>;
}

/**
 * Calcule la map de permissions effective pour un membership donné.
 * Owner et admin sont toujours pleinement autorisés.
 */
export function effectivePermissions(
  role: ClubRole,
  status: string | null | undefined,
  raw: unknown
): Record<Permission, boolean> {
  if (role === "owner" || role === "admin") {
    return fullPermissionMap();
  }
  if (status !== "active") {
    return emptyPermissionMap();
  }
  return sanitizePermissions(raw);
}

/**
 * Vérifie si l'utilisateur courant possède la permission demandée
 * sur son club courant.
 */
export async function checkPermission(
  permission: Permission
): Promise<
  | { ok: true; clubId: string; userId: string; role: ClubRole; isOwner: boolean }
  | { ok: false; status: 401 | 403; error: string }
> {
  const ctx = await getAuthContext();
  if (!ctx || !ctx.current) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_memberships")
    .select("role, status, permissions")
    .eq("club_id", ctx.current.clubId)
    .eq("user_id", ctx.user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 403, error: "Membership introuvable" };
  }

  const eff = effectivePermissions(
    data.role as ClubRole,
    data.status as string,
    data.permissions
  );

  if (!eff[permission]) {
    return {
      ok: false,
      status: 403,
      error: `Permission requise : ${permission}`,
    };
  }

  return {
    ok: true,
    clubId: ctx.current.clubId,
    userId: ctx.user.id,
    role: data.role as ClubRole,
    isOwner: data.role === "owner",
  };
}

/**
 * À utiliser dans les API routes :
 *   const guard = await requirePermission(PERMISSIONS.MANAGE_INVOICES);
 *   if ("error" in guard) return guard.error;
 *   const { clubId, userId } = guard;
 */
export async function requirePermission(permission: Permission): Promise<
  | { clubId: string; userId: string; role: ClubRole; isOwner: boolean; ctx: AuthContext }
  | { error: Response }
> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }
  if (!ctx.current) {
    return {
      error: NextResponse.json({ error: "Aucun club actif" }, { status: 403 }),
    };
  }

  const result = await checkPermission(permission);
  if (!result.ok) {
    return {
      error: NextResponse.json(
        { error: result.error, required: permission },
        { status: result.status }
      ),
    };
  }
  return {
    ctx,
    clubId: result.clubId,
    userId: result.userId,
    role: result.role,
    isOwner: result.isOwner,
  };
}

/**
 * Récupère les permissions effectives de l'utilisateur courant sur son
 * club courant. Utilisé par /api/me/permissions.
 */
export async function getMyPermissions(): Promise<{
  clubId: string | null;
  role: ClubRole | null;
  isOwner: boolean;
  permissions: Record<Permission, boolean>;
} | null> {
  const ctx = await getAuthContext();
  if (!ctx || !ctx.current) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_memberships")
    .select("role, status, permissions")
    .eq("club_id", ctx.current.clubId)
    .eq("user_id", ctx.user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    return {
      clubId: ctx.current.clubId,
      role: ctx.current.role,
      isOwner: ctx.current.role === "owner",
      permissions: emptyPermissionMap(),
    };
  }

  const eff = effectivePermissions(
    data.role as ClubRole,
    data.status as string,
    data.permissions
  );

  return {
    clubId: ctx.current.clubId,
    role: data.role as ClubRole,
    isOwner: data.role === "owner",
    permissions: eff,
  };
}
