import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * POST /api/associations/inscription
 *
 * Inscription Obillz Associations uniquement.
 * - Accepte email + password
 * - Ignore toute valeur product / product_type envoyée par le client
 * - Fixe côté serveur la metadata Auth product = "association"
 * - Le trigger SQL 057 crée alors profiles.product_type = 'association'
 *
 * Fonctionne avec confirmation email (pas de session requise après signUp).
 */

const PASSWORD_MIN_LENGTH = 8;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { email?: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";
  const password =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "Veuillez entrer une adresse email valide" },
      { status: 400 }
    );
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      {
        error: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
      },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[associations/inscription] Variables Supabase manquantes");
    return NextResponse.json(
      { error: "Configuration serveur incomplète" },
      { status: 500 }
    );
  }

  // Client anon dédié (pas de cookies session) — même mécanisme que le signup Sport,
  // mais metadata produit figée ici, jamais lue depuis le body client.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        product: "association",
      },
    },
  });

  if (signUpError) {
    console.error("[associations/inscription] signUp KO:", signUpError.message);
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
