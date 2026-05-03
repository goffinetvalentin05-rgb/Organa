import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { logAudit, extractRequestMetadata } from "@/lib/auth/audit";
import { buildInvitationUrl } from "@/lib/auth/invitations";
import { sendInvitationEmail } from "@/lib/email/invite-email";

export const runtime = "nodejs";

/**
 * DELETE /api/club/invitations/[id]
 *   Annule une invitation pending (status='cancelled').
 *
 * POST /api/club/invitations/[id]?action=resend
 *   Renvoie l'email pour une invitation pending. Met à jour last_sent_at /
 *   send_count.
 */

async function readId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  const r = await Promise.resolve(params);
  return r.id;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const id = await readId(params);
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from("club_invitations")
    .select("id, club_id, status, email")
    .eq("id", id)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (invitation.club_id !== guard.clubId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (invitation.status === "accepted") {
    return NextResponse.json(
      { error: "Cette invitation a déjà été acceptée" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("club_invitations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: guard.userId,
    })
    .eq("id", id)
    .eq("club_id", guard.clubId);

  if (error) {
    console.error("[API][club/invitations/:id][DELETE] KO:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation", details: error.message },
      { status: 500 }
    );
  }

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: "invite_cancelled",
    resourceType: "club_invitation",
    resourceId: id,
    metadata: { email: invitation.email },
    ...meta,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const id = await readId(params);
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action !== "resend") {
    return NextResponse.json(
      { error: "Action non supportée. Utilisez ?action=resend" },
      { status: 400 }
    );
  }

  const guard = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const { data: invitation } = await supabase
    .from("club_invitations")
    .select(
      "id, club_id, email, name, function_title, role, permissions, status, token, expires_at, send_count"
    )
    .eq("id", id)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (invitation.club_id !== guard.clubId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: `Invitation non renvoyable (statut=${invitation.status})` },
      { status: 400 }
    );
  }

  // Profil + inviteur
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
  const invitationUrl = buildInvitationUrl(invitation.token, origin);

  const emailResult = await sendInvitationEmail({
    to: invitation.email,
    recipientName: invitation.name || null,
    inviterName: inviterMembership?.name || inviterMembership?.email || null,
    clubName: clubProfile?.company_name || "Club Obillz",
    functionTitle: invitation.function_title || null,
    invitationUrl,
    expiresAt: invitation.expires_at,
    clubProfile: {
      company_name: clubProfile?.company_name,
      company_email: clubProfile?.company_email,
      email_sender_name: clubProfile?.email_sender_name,
      email_sender_email: clubProfile?.email_sender_email,
      resend_api_key: clubProfile?.resend_api_key,
      email_custom_enabled: clubProfile?.email_custom_enabled,
    },
  });

  // Met à jour le compteur même si l'email a échoué — utile pour le debug
  const admin = createAdminClient();
  await admin
    .from("club_invitations")
    .update({
      last_sent_at: new Date().toISOString(),
      send_count: (invitation.send_count ?? 0) + 1,
    })
    .eq("id", id)
    .eq("club_id", guard.clubId);

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: "invite_resent",
    resourceType: "club_invitation",
    resourceId: id,
    metadata: {
      email: invitation.email,
      email_sent: emailResult.ok,
      email_failure: emailResult.ok ? null : emailResult.reason,
    },
    ...meta,
  });

  return NextResponse.json(
    {
      success: true,
      email: emailResult,
      invitationUrl,
    },
    { status: 200 }
  );
}
