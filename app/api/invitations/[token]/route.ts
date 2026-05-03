import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit, extractRequestMetadata } from "@/lib/auth/audit";

export const runtime = "nodejs";

/**
 * GET /api/invitations/[token]
 *   Endpoint PUBLIC (pas d'auth requise) qui renvoie les infos de
 *   l'invitation associée au token. Utilisé par la page d'acceptation
 *   pour afficher "Vous avez été invité par <club> à rejoindre Obillz".
 *
 *   Le token est suffisamment long (256 bits) pour ne pas être devinable.
 *   On NE retourne PAS les permissions détaillées (rester discret).
 *
 * POST /api/invitations/[token]
 *   Accepte l'invitation. Requiert un utilisateur authentifié dont
 *   l'email correspond exactement à celui de l'invitation.
 */

async function readToken(
  params: Promise<{ token: string }> | { token: string }
): Promise<string> {
  const r = await Promise.resolve(params);
  return decodeURIComponent(r.token);
}

interface InvitationPublic {
  id: string;
  clubId: string;
  email: string;
  name: string | null;
  functionTitle: string | null;
  role: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  expiresAt: string;
  clubName: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const token = await readToken(params);
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  // Bypass RLS (table protégée) ; le token EST le secret d'autorisation.
  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("get_invitation_by_token", { p_token: token })
    .maybeSingle();

  if (error) {
    console.error("[API][invitations/:token][GET] rpc KO:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Invitation introuvable" },
      { status: 404 }
    );
  }

  const invitation: InvitationPublic = {
    id: (data as any).id,
    clubId: (data as any).club_id,
    email: (data as any).email,
    name: (data as any).name,
    functionTitle: (data as any).function_title,
    role: (data as any).role,
    status: (data as any).status,
    expiresAt: (data as any).expires_at,
    clubName: (data as any).club_name,
  };

  return NextResponse.json({ invitation }, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const token = await readToken(params);
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "Vous devez être connecté pour accepter une invitation",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }

  // L'utilisateur courant appelle la RPC qui vérifie que son email
  // correspond bien à celui de l'invitation et crée la membership.
  const { data, error } = await supabase
    .rpc("accept_invitation", { p_token: token })
    .maybeSingle();

  if (error) {
    const msg = error.message || "Erreur lors de l'acceptation";
    const status =
      msg.includes("expirée") ||
      msg.includes("statut=") ||
      msg.includes("ne correspond pas")
        ? 400
        : msg.includes("Non authentifié")
          ? 401
          : msg.includes("introuvable")
            ? 404
            : 500;
    console.warn("[API][invitations/:token][POST] accept KO:", msg);
    return NextResponse.json({ error: msg }, { status });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Acceptation impossible" },
      { status: 500 }
    );
  }

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: (data as any).club_id,
    action: "accept_invitation",
    resourceType: "club_membership",
    resourceId: String((data as any).membership_id),
    metadata: {},
    ...meta,
  });

  return NextResponse.json(
    {
      success: true,
      membershipId: (data as any).membership_id,
      clubId: (data as any).club_id,
    },
    { status: 200 }
  );
}
