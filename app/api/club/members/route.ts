import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PERMISSIONS,
  requirePermission,
  sanitizePermissions,
  fullPermissionMap,
} from "@/lib/auth/permissions";
import { logAudit, AuditAction, extractRequestMetadata } from "@/lib/auth/audit";
import type { ClubRole } from "@/lib/auth/rbac";

export const runtime = "nodejs";

/**
 * GET /api/club/members
 *   Liste les utilisateurs du club courant. Nécessite `manage_users`.
 *
 * POST /api/club/members
 *   Ajoute un utilisateur au club courant (Phase 1 : crée directement la
 *   membership pour un email donné, sans système d'invitation email).
 *
 *   Body : { name, email, functionTitle?, permissions?, role? }
 *
 *   Si l'email correspond déjà à un utilisateur Supabase Auth, on rattache
 *   directement la membership avec status='active'. Sinon on crée la
 *   membership avec status='invited' (Phase 2 enverra le mail d'invitation).
 */

interface MemberRow {
  id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  function_title: string | null;
  role: ClubRole;
  status: "invited" | "active" | "disabled";
  permissions: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

function formatMember(row: MemberRow) {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    functionTitle: row.function_title,
    role: row.role,
    status: row.status,
    permissions: row.permissions ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

export async function GET() {
  // VIEW_MEMBERS suffit pour lister les accès (pour l'auto-référence) ;
  // pour l'édition on utilisera MANAGE_USERS dans POST/PATCH/DELETE.
  // La page Paramètres → Utilisateurs requiert MANAGE_USERS, mais d'autres
  // contextes (ex: badge "Créé par") peuvent appeler cette route en lecture.
  const guard = await requirePermission(PERMISSIONS.VIEW_MEMBERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_memberships")
    .select(
      "id, user_id, email, name, function_title, role, status, permissions, created_at, updated_at, created_by"
    )
    .eq("club_id", guard.clubId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[API][club/members][GET] Supabase:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des membres", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { members: (data || []).map(formatMember as any) },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if ("error" in guard) return guard.error;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const functionTitle =
    typeof body.functionTitle === "string" ? body.functionTitle.trim() : "";
  const inputRole = typeof body.role === "string" ? body.role : "member";

  // Le owner ne peut PAS être créé via cette API (un seul owner = créateur).
  // On accepte uniquement member / committee / admin.
  const allowedRoles: ClubRole[] = ["member", "committee", "admin"];
  const role: ClubRole = (allowedRoles as string[]).includes(inputRole)
    ? (inputRole as ClubRole)
    : "member";

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const permissions = sanitizePermissions(body.permissions);

  const supabase = await createClient();

  // Existe-t-il déjà une membership active sur ce club avec cet email ?
  const { data: existing } = await supabase
    .from("club_memberships")
    .select("id, user_id, email")
    .eq("club_id", guard.clubId)
    .ilike("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Un accès existe déjà pour cet email" },
      { status: 409 }
    );
  }

  // Résout un user_id existant pour cet email via la RPC SECURITY DEFINER.
  // Phase 1 : on n'invite que des users qui ont déjà un compte Obillz.
  // Phase 2 ajoutera un vrai flux d'invitation email (création + RSVP).
  const { data: targetUserId, error: rpcError } = await supabase.rpc(
    "find_user_id_by_email",
    { p_email: email }
  );

  if (rpcError) {
    console.error("[API][club/members][POST] find_user_id_by_email KO:", rpcError);
    return NextResponse.json(
      { error: "Erreur lors de la recherche de l'utilisateur" },
      { status: 500 }
    );
  }

  if (!targetUserId) {
    return NextResponse.json(
      {
        error:
          "Cet email ne correspond pas à un compte Obillz existant. Demandez à la personne de créer un compte avant de l'ajouter (un système d'invitation email arrivera bientôt).",
      },
      { status: 422 }
    );
  }

  // Empêche d'ajouter le même user_id deux fois (l'unique a club_id+user_id)
  const { data: dupByUser } = await supabase
    .from("club_memberships")
    .select("id")
    .eq("club_id", guard.clubId)
    .eq("user_id", targetUserId)
    .is("deleted_at", null)
    .maybeSingle();
  if (dupByUser) {
    return NextResponse.json(
      { error: "Cet utilisateur est déjà membre de votre club" },
      { status: 409 }
    );
  }

  // L'INSERT passe par le client admin car la RLS sur club_memberships
  // exige `is_club_admin(club_id)` ; un committee avec la permission
  // applicative `manage_users` doit pouvoir créer un membre, donc on
  // contourne la RLS APRÈS avoir validé la permission applicative.
  const admin = createAdminClient();

  const insertPayload: Record<string, unknown> = {
    club_id: guard.clubId,
    user_id: targetUserId,
    email,
    name,
    function_title: functionTitle || null,
    role,
    status: "active",
    permissions,
    created_by: guard.userId,
    accepted_at: new Date().toISOString(),
    invited_at: new Date().toISOString(),
    invited_by: guard.userId,
  };

  const { data: inserted, error: insertError } = await admin
    .from("club_memberships")
    .insert(insertPayload)
    .select(
      "id, user_id, email, name, function_title, role, status, permissions, created_at, updated_at, created_by"
    )
    .single();

  if (insertError || !inserted) {
    console.error("[API][club/members][POST] insert KO:", insertError);
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'accès",
        details: insertError?.message,
      },
      { status: 500 }
    );
  }

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: AuditAction.INVITE_MEMBER,
    resourceType: "club_membership",
    resourceId: inserted.id,
    metadata: {
      email,
      name,
      role,
      function_title: functionTitle || null,
      permissions_count: Object.values(permissions).filter(Boolean).length,
    },
    ...meta,
  });

  return NextResponse.json(
    { member: formatMember(inserted as MemberRow) },
    { status: 201 }
  );
}
