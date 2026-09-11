import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { legalAcceptanceError } from "@/lib/legal/requireAcceptance";
import { recordClubLegalAcceptance } from "@/lib/legal/recordAcceptance";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const PASSWORD_MIN_LENGTH = 8;

function readString(body: unknown, key: string): string {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * POST /api/auth/signup
 * Inscription propriétaire club sport. Exige l’acceptation CGU + DPA.
 * Les invitations staff n’utilisent pas cette route.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const acceptanceError = legalAcceptanceError(body);
  if (acceptanceError) {
    return NextResponse.json({ error: acceptanceError }, { status: 400 });
  }

  const email = readString(body, "email").toLowerCase();
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
    console.error("[auth/signup] Variables Supabase manquantes");
    return NextResponse.json(
      { error: "Configuration serveur incomplète" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("[auth/signup] signUp KO:", signUpError.message);
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  const userId = signUpData.user?.id;
  if (userId) {
    try {
      const admin = createAdminClient();
      const { error: legalError } = await recordClubLegalAcceptance(admin, {
        clubId: userId,
        userId,
      });
      if (legalError) {
        return NextResponse.json(
          {
            error:
              "Compte créé mais l’enregistrement de l’acceptation a échoué. Contactez contact@obillz.com.",
          },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error("[auth/signup] legal acceptance KO:", err);
      return NextResponse.json(
        {
          error:
            "Compte créé mais l’enregistrement de l’acceptation a échoué. Contactez contact@obillz.com.",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
