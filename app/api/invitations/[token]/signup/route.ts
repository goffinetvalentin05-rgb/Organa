import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * POST /api/invitations/[token]/signup
 *
 * Crée un compte Supabase Auth pour le destinataire d'une invitation
 * (email pré-vérifié via le token : la personne a reçu l'email à cette
 * adresse, c'est la preuve qu'elle la contrôle).
 *
 *   Body : { password: string }
 *   Réponse 201 : { ok: true, email: string }
 *
 * Le client (page d'invitation) enchaîne ensuite :
 *   1) supabase.auth.signInWithPassword({ email, password })
 *   2) POST /api/invitations/[token] pour accepter l'invitation
 */

async function readToken(
  params: Promise<{ token: string }> | { token: string }
): Promise<string> {
  const r = await Promise.resolve(params);
  return decodeURIComponent(r.token);
}

const PASSWORD_MIN_LENGTH = 8;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const token = await readToken(params);
  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const password = typeof body?.password === "string" ? body.password : "";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      {
        error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1. Vérifier l'invitation (existe, pending, non expirée)
  const { data: invitation, error: invErr } = await admin
    .rpc("get_invitation_by_token", { p_token: token })
    .maybeSingle();

  if (invErr) {
    console.error("[invitations/signup] rpc KO:", invErr);
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

  const email = ((invitation as any).email as string).toLowerCase();
  const status = (invitation as any).status as string;
  const expiresAt = (invitation as any).expires_at as string;
  const inviteName = ((invitation as any).name as string | null) || null;

  if (status !== "pending") {
    return NextResponse.json(
      {
        error:
          status === "accepted"
            ? "Cette invitation a déjà été acceptée. Connectez-vous directement."
            : status === "cancelled"
              ? "Cette invitation a été annulée."
              : "Cette invitation a expiré.",
      },
      { status: 400 }
    );
  }
  if (new Date(expiresAt) <= new Date()) {
    return NextResponse.json(
      { error: "Cette invitation a expiré." },
      { status: 400 }
    );
  }

  // 2. Vérifier qu'il n'y a pas déjà un compte (sinon → connexion, pas signup)
  const { data: existingId, error: findErr } = await admin.rpc(
    "find_user_id_by_email",
    { p_email: email }
  );
  if (findErr) {
    console.error("[invitations/signup] find_user KO:", findErr);
    return NextResponse.json(
      { error: "Erreur serveur", details: findErr.message },
      { status: 500 }
    );
  }
  if (existingId) {
    return NextResponse.json(
      {
        error:
          "Un compte existe déjà pour cette adresse. Connectez-vous avec votre mot de passe.",
        code: "ACCOUNT_EXISTS",
      },
      { status: 409 }
    );
  }

  // 3. Créer le compte Supabase (email déjà confirmé : la personne a reçu
  //    l'invitation à cette adresse, c'est la preuve de possession).
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: inviteName ?? undefined,
        invited_via: "club_invitation",
      },
    }
  );

  if (createErr || !created?.user) {
    console.error("[invitations/signup] createUser KO:", createErr);
    const msg = createErr?.message || "Création du compte impossible";
    // Cas où Supabase refuse à cause d'une politique de mot de passe etc.
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      email,
      userId: created.user.id,
    },
    { status: 201 }
  );
}
