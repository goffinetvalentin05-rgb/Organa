import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PERMISSIONS,
  requirePermission,
  sanitizePermissions,
} from "@/lib/auth/permissions";
import { logAudit, AuditAction, extractRequestMetadata } from "@/lib/auth/audit";
import type { ClubRole } from "@/lib/auth/rbac";

export const runtime = "nodejs";

/**
 * PATCH /api/club/members/[id]
 *   Modifie le nom, la fonction, les permissions ou le statut d'un membre.
 *   Le rôle peut être modifié uniquement par un owner.
 *
 * DELETE /api/club/members/[id]
 *   Désactive (soft delete) la membership. Le owner ne peut PAS se supprimer
 *   lui-même via cette route ni supprimer le dernier owner.
 */

const ALLOWED_STATUS = new Set(["active", "disabled", "invited"]);
const ALLOWED_ROLES: ClubRole[] = ["member", "committee", "admin"];

async function readParam(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const id = await readParam(params);
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if ("error" in guard) return guard.error;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: target, error: fetchError } = await supabase
    .from("club_memberships")
    .select(
      "id, club_id, user_id, email, name, function_title, role, status, permissions"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !target) {
    return NextResponse.json({ error: "Membership introuvable" }, { status: 404 });
  }
  if (target.club_id !== guard.clubId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Personne ne peut modifier le owner SAUF lui-même (et même lui ne peut pas
  // changer son propre rôle pour ne pas se rétrograder).
  if (target.role === "owner" && target.user_id !== guard.userId) {
    return NextResponse.json(
      { error: "Le compte propriétaire ne peut pas être modifié" },
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {};
  let permissionsChanged = false;
  let statusChanged = false;
  let roleChanged = false;

  if (typeof body.name === "string") {
    updates.name = body.name.trim() || null;
  }
  if (typeof body.functionTitle === "string") {
    updates.function_title = body.functionTitle.trim() || null;
  }

  if (body.permissions !== undefined) {
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "Les permissions du propriétaire ne sont pas modifiables" },
        { status: 400 }
      );
    }
    updates.permissions = sanitizePermissions(body.permissions);
    permissionsChanged = true;
  }

  if (typeof body.status === "string") {
    if (!ALLOWED_STATUS.has(body.status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    if (target.role === "owner" && body.status !== "active") {
      return NextResponse.json(
        { error: "Le propriétaire doit rester actif" },
        { status: 400 }
      );
    }
    updates.status = body.status;
    statusChanged = body.status !== target.status;
  }

  if (typeof body.role === "string") {
    // Seul un owner peut promouvoir / rétrograder.
    if (!guard.isOwner) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut changer le rôle" },
        { status: 403 }
      );
    }
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "On ne peut pas modifier le rôle du propriétaire" },
        { status: 400 }
      );
    }
    if (!(ALLOWED_ROLES as string[]).includes(body.role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    updates.role = body.role;
    roleChanged = body.role !== target.role;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
  }

  // RLS exige is_club_admin pour modifier ; on contourne via service_role
  // après vérification applicative de la permission `manage_users`.
  const admin = createAdminClient();
  const { data: updated, error: updateError } = await admin
    .from("club_memberships")
    .update(updates)
    .eq("id", id)
    .eq("club_id", guard.clubId)
    .select(
      "id, user_id, email, name, function_title, role, status, permissions, created_at, updated_at, created_by"
    )
    .single();

  if (updateError || !updated) {
    console.error("[API][club/members/:id][PATCH] KO:", updateError);
    return NextResponse.json(
      { error: "Erreur lors de la modification", details: updateError?.message },
      { status: 500 }
    );
  }

  const meta = extractRequestMetadata(request);

  if (permissionsChanged) {
    await logAudit({
      clubId: guard.clubId,
      action: "permission_change",
      resourceType: "club_membership",
      resourceId: id,
      metadata: {
        target_user_id: target.user_id,
        target_email: target.email,
        new_permissions: updates.permissions,
      },
      ...meta,
    });
  }
  if (roleChanged) {
    await logAudit({
      clubId: guard.clubId,
      action: AuditAction.CHANGE_ROLE,
      resourceType: "club_membership",
      resourceId: id,
      metadata: {
        target_user_id: target.user_id,
        from: target.role,
        to: updates.role,
      },
      ...meta,
    });
  }
  if (statusChanged) {
    await logAudit({
      clubId: guard.clubId,
      action: "status_change",
      resourceType: "club_membership",
      resourceId: id,
      metadata: {
        target_user_id: target.user_id,
        from: target.status,
        to: updates.status,
      },
      ...meta,
    });
  }

  return NextResponse.json(
    {
      member: {
        id: updated.id,
        userId: updated.user_id,
        email: updated.email,
        name: updated.name,
        functionTitle: updated.function_title,
        role: updated.role,
        status: updated.status,
        permissions: updated.permissions ?? {},
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        createdBy: updated.created_by,
      },
    },
    { status: 200 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const id = await readParam(params);
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("club_memberships")
    .select("id, club_id, user_id, role, email")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Membership introuvable" }, { status: 404 });
  }
  if (target.club_id !== guard.clubId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (target.role === "owner") {
    return NextResponse.json(
      { error: "Le compte propriétaire ne peut pas être supprimé" },
      { status: 400 }
    );
  }
  if (target.user_id === guard.userId) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous supprimer vous-même" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin
    .from("club_memberships")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: guard.userId,
      status: "disabled",
    })
    .eq("id", id)
    .eq("club_id", guard.clubId);

  if (deleteError) {
    console.error("[API][club/members/:id][DELETE] KO:", deleteError);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: deleteError.message },
      { status: 500 }
    );
  }

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: AuditAction.REMOVE_MEMBER,
    resourceType: "club_membership",
    resourceId: id,
    metadata: { target_user_id: target.user_id, email: target.email },
    ...meta,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
