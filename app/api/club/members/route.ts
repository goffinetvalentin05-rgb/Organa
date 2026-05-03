import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PERMISSIONS,
  requirePermission,
  sanitizePermissions,
} from "@/lib/auth/permissions";
import { logAudit, AuditAction, extractRequestMetadata } from "@/lib/auth/audit";
import {
  buildInvitationUrl,
  defaultInvitationExpiry,
  generateInvitationToken,
} from "@/lib/auth/invitations";
import { sendInvitationEmail } from "@/lib/email/invite-email";
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

  const meta = extractRequestMetadata(request);
  const admin = createAdminClient();

  // ============================================
  // Branche 1 : email inconnu → créer une invitation pending
  // ============================================
  if (!targetUserId) {
    // Vérifie qu'il n'y a pas déjà une invitation pending pour cet email
    const { data: existingInvite } = await supabase
      .from("club_invitations")
      .select("id")
      .eq("club_id", guard.clubId)
      .ilike("email", email)
      .eq("status", "pending")
      .maybeSingle();
    if (existingInvite) {
      return NextResponse.json(
        {
          error:
            "Une invitation est déjà en attente pour cet email. Allez dans la section Invitations pour la relancer ou l'annuler.",
          invitationId: existingInvite.id,
        },
        { status: 409 }
      );
    }

    const token = generateInvitationToken();
    const expiresAt = defaultInvitationExpiry();

    const { data: invitation, error: invitationError } = await admin
      .from("club_invitations")
      .insert({
        club_id: guard.clubId,
        email,
        name: name || null,
        function_title: functionTitle || null,
        role,
        permissions,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        created_by: guard.userId,
        last_sent_at: new Date().toISOString(),
        send_count: 1,
      })
      .select(
        "id, club_id, email, name, function_title, role, permissions, status, expires_at, created_at"
      )
      .single();

    if (invitationError || !invitation) {
      console.error("[API][club/members][POST] invitation insert KO:", invitationError);
      return NextResponse.json(
        {
          error: "Erreur lors de la création de l'invitation",
          details: invitationError?.message,
        },
        { status: 500 }
      );
    }

    // Récupère le profil et l'inviteur pour l'email
    const { data: clubProfile } = await supabase
      .from("profiles")
      .select(
        "company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
      )
      .eq("user_id", guard.clubId)
      .maybeSingle();
    const { data: inviterMembership } = await supabase
      .from("club_memberships")
      .select("name, email")
      .eq("club_id", guard.clubId)
      .eq("user_id", guard.userId)
      .is("deleted_at", null)
      .maybeSingle();

    const origin = new URL(request.url).origin;
    const invitationUrl = buildInvitationUrl(token, origin);

    const emailResult = await sendInvitationEmail({
      to: email,
      recipientName: name || null,
      inviterName: inviterMembership?.name || inviterMembership?.email || null,
      clubName: clubProfile?.company_name || "Club Obillz",
      functionTitle: functionTitle || null,
      invitationUrl,
      expiresAt,
      clubProfile: {
        company_name: clubProfile?.company_name,
        company_email: clubProfile?.company_email,
        email_sender_name: clubProfile?.email_sender_name,
        email_sender_email: clubProfile?.email_sender_email,
        resend_api_key: clubProfile?.resend_api_key,
        email_custom_enabled: clubProfile?.email_custom_enabled,
      },
    });

    await logAudit({
      clubId: guard.clubId,
      action: AuditAction.INVITE_MEMBER,
      resourceType: "club_invitation",
      resourceId: invitation.id,
      metadata: {
        email,
        role,
        function_title: functionTitle || null,
        email_sent: emailResult.ok,
        email_failure: emailResult.ok ? null : emailResult.reason,
      },
      ...meta,
    });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          functionTitle: invitation.function_title,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expires_at,
          invitationUrl,
        },
        email: emailResult,
      },
      { status: 201 }
    );
  }

  // ============================================
  // Branche 2 : email connu → créer directement la membership active
  // ============================================
  // Empêche d'ajouter le même user_id deux fois (unique club_id+user_id)
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
