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
 * GET /api/club/invitations
 *   Liste les invitations du club courant. Nécessite manage_users.
 *
 * POST /api/club/invitations
 *   Crée une invitation, l'envoie par email et renvoie l'invitation
 *   créée (avec son token / URL).
 *
 *   Body : { name?, email, functionTitle?, role?, permissions? }
 */

interface InvitationRow {
  id: string;
  club_id: string;
  email: string;
  name: string | null;
  function_title: string | null;
  role: ClubRole;
  permissions: Record<string, boolean> | null;
  status: "pending" | "accepted" | "cancelled" | "expired";
  expires_at: string;
  created_at: string;
  updated_at: string;
  last_sent_at: string | null;
  send_count: number;
  created_by: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
}

function formatInvitation(row: InvitationRow, includeToken: boolean) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    functionTitle: row.function_title,
    role: row.role,
    permissions: row.permissions ?? {},
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSentAt: row.last_sent_at,
    sendCount: row.send_count,
    createdBy: row.created_by,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    cancelledAt: row.cancelled_at,
    ...(includeToken
      ? { invitationUrl: null as string | null }
      : {}),
  };
}

const ALLOWED_ROLES: ClubRole[] = ["member", "committee", "admin"];

export async function GET() {
  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if ("error" in guard) return guard.error;

  // Marquer les invitations expirées au passage (best-effort)
  const supabase = await createClient();
  try {
    await supabase.rpc("expire_old_invitations");
  } catch {
    // ignore — best-effort
  }

  const { data, error } = await supabase
    .from("club_invitations")
    .select(
      "id, club_id, email, name, function_title, role, permissions, status, expires_at, created_at, updated_at, last_sent_at, send_count, created_by, accepted_by, accepted_at, cancelled_at"
    )
    .eq("club_id", guard.clubId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API][club/invitations][GET] KO:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      invitations: (data || []).map((r) =>
        formatInvitation(r as InvitationRow, false)
      ),
    },
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

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const functionTitle =
    typeof body.functionTitle === "string" ? body.functionTitle.trim() : "";
  const inputRole = typeof body.role === "string" ? body.role : "member";
  const role: ClubRole = (ALLOWED_ROLES as string[]).includes(inputRole)
    ? (inputRole as ClubRole)
    : "member";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // Le rôle 'admin' (= co-président) est réservé à l'owner
  if (role === "admin" && !guard.isOwner) {
    return NextResponse.json(
      { error: "Seul le propriétaire peut inviter en tant que co-administrateur" },
      { status: 403 }
    );
  }

  const permissions = sanitizePermissions(body.permissions);
  const supabase = await createClient();

  // Vérif : pas déjà membre actif
  const { data: existingMember } = await supabase
    .from("club_memberships")
    .select("id")
    .eq("club_id", guard.clubId)
    .ilike("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      { error: "Cette personne est déjà membre du club" },
      { status: 409 }
    );
  }

  // Vérif : pas déjà une invitation pending
  const { data: existingInvite } = await supabase
    .from("club_invitations")
    .select("id, status")
    .eq("club_id", guard.clubId)
    .ilike("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      {
        error:
          "Une invitation est déjà en attente pour cet email. Vous pouvez la relancer ou l'annuler.",
        invitationId: existingInvite.id,
      },
      { status: 409 }
    );
  }

  // Profil club pour résoudre Resend custom + nom du club
  const { data: clubProfile } = await supabase
    .from("profiles")
    .select(
      "company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
    )
    .eq("user_id", guard.clubId)
    .maybeSingle();

  // Récupère le nom de l'inviteur depuis sa membership (sinon email)
  const { data: inviterMembership } = await supabase
    .from("club_memberships")
    .select("name, email")
    .eq("club_id", guard.clubId)
    .eq("user_id", guard.userId)
    .is("deleted_at", null)
    .maybeSingle();

  const token = generateInvitationToken();
  const expiresAt = defaultInvitationExpiry();

  // INSERT : on contourne via service_role (la RLS exige is_club_admin
  // mais un committee avec manage_users doit pouvoir inviter — on a déjà
  // validé la permission applicative ci-dessus).
  const admin = createAdminClient();
  const { data: inserted, error: insertError } = await admin
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
      "id, club_id, email, name, function_title, role, permissions, status, expires_at, created_at, updated_at, last_sent_at, send_count, created_by, accepted_by, accepted_at, cancelled_at"
    )
    .single();

  if (insertError || !inserted) {
    console.error("[API][club/invitations][POST] insert KO:", insertError);
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'invitation",
        details: insertError?.message,
      },
      { status: 500 }
    );
  }

  // Construire l'URL d'invitation
  const origin = new URL(request.url).origin;
  const invitationUrl = buildInvitationUrl(token, origin);

  // Envoyer l'email (best-effort)
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

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: AuditAction.INVITE_MEMBER,
    resourceType: "club_invitation",
    resourceId: inserted.id,
    metadata: {
      email,
      role,
      function_title: functionTitle || null,
      email_sent: emailResult.ok,
      email_mode: emailResult.ok ? emailResult.mode : null,
      email_failure: emailResult.ok ? null : emailResult.reason,
    },
    ...meta,
  });

  return NextResponse.json(
    {
      invitation: {
        ...formatInvitation(inserted as InvitationRow, true),
        invitationUrl,
      },
      email: emailResult,
    },
    { status: 201 }
  );
}
