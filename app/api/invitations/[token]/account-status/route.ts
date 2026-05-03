import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * GET /api/invitations/[token]/account-status
 *
 * Endpoint PUBLIC (pas d'auth) qui indique au front si l'email associé à
 * une invitation a déjà un compte Obillz. Permet de choisir l'UI :
 *   - accountExists = true  → afficher un formulaire "Connectez-vous"
 *   - accountExists = false → afficher un formulaire "Créez votre mot de passe"
 *
 * Sécurité : la connaissance du token (256 bits) suffit comme preuve. On
 * ne révèle pas l'existence d'un email arbitraire — uniquement celui de
 * l'invitation portée par ce token.
 */

async function readToken(
  params: Promise<{ token: string }> | { token: string }
): Promise<string> {
  const r = await Promise.resolve(params);
  return decodeURIComponent(r.token);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const token = await readToken(params);
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invitation, error: invErr } = await admin
    .rpc("get_invitation_by_token", { p_token: token })
    .maybeSingle();

  if (invErr) {
    console.error("[invitations/account-status] rpc KO:", invErr);
    return NextResponse.json(
      { error: "Erreur serveur", details: invErr.message },
      { status: 500 }
    );
  }
  if (!invitation) {
    return NextResponse.json(
      { error: "Invitation introuvable" },
      { status: 404 }
    );
  }

  const email = (invitation as any).email as string;
  const status = (invitation as any).status as string;
  const expiresAt = (invitation as any).expires_at as string;

  // Inutile de proposer de créer un compte si l'invitation n'est plus
  // utilisable.
  const isPending = status === "pending" && new Date(expiresAt) > new Date();

  let accountExists = false;
  if (isPending) {
    const { data: userId, error: findErr } = await admin.rpc(
      "find_user_id_by_email",
      { p_email: email }
    );
    if (findErr) {
      console.error("[invitations/account-status] find_user KO:", findErr);
      return NextResponse.json(
        { error: "Erreur serveur", details: findErr.message },
        { status: 500 }
      );
    }
    accountExists = !!userId;
  }

  return NextResponse.json(
    {
      email,
      status,
      isPending,
      accountExists,
    },
    { status: 200 }
  );
}
