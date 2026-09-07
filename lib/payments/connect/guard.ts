import { NextResponse } from "next/server";
import {
  getMyPermissions,
  PERMISSIONS,
  type Permission,
} from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import type { ClubRole } from "@/lib/auth/rbac";

export type ClubPaymentsGuard = {
  clubId: string;
  userId: string;
  role: ClubRole;
  isOwner: boolean;
  canManage: boolean;
};

function canViewClubPayments(permissions: Record<Permission, boolean>) {
  return (
    permissions[PERMISSIONS.VIEW_SHOP] ||
    permissions[PERMISSIONS.MANAGE_SHOP] ||
    permissions[PERMISSIONS.ACCESS_SETTINGS]
  );
}

function canManageClubPayments(permissions: Record<Permission, boolean>) {
  return (
    permissions[PERMISSIONS.MANAGE_SHOP] ||
    permissions[PERMISSIONS.ACCESS_SETTINGS]
  );
}

/**
 * Accès au compte Stripe Connect du club (pas d’un module).
 * Le `club_id` vient exclusivement du membership courant.
 */
export async function requireClubPaymentsAccess(
  mode: "view" | "manage"
): Promise<ClubPaymentsGuard | { error: Response }> {
  const perms = await getMyPermissions();
  if (!perms || !perms.clubId) {
    return {
      error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  const canManage = canManageClubPayments(perms.permissions);
  const canView = canViewClubPayments(perms.permissions) || canManage;

  if (mode === "view" && !canView) {
    return {
      error: NextResponse.json(
        { error: "Permission requise pour consulter les paiements du club." },
        { status: 403 }
      ),
    };
  }

  if (mode === "manage" && !canManage) {
    return {
      error: NextResponse.json(
        { error: "Permission requise pour configurer les paiements du club." },
        { status: 403 }
      ),
    };
  }

  if (mode === "manage") {
    const access = await requireWriteAccess(perms.clubId);
    if (access.response) return { error: access.response };
  }

  return {
    clubId: perms.clubId,
    userId: "",
    role: (perms.role || "member") as ClubRole,
    isOwner: perms.isOwner,
    canManage,
  };
}
