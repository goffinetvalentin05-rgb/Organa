import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED } from "@/lib/associations/public-launch";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * POST /api/associations/inscription
 *
 * Inscription Obillz Associations uniquement.
 * - Accepte email, password, associationName, firstName, lastName
 * - Ignore toute valeur product / product_type du client
 * - Force metadata Auth product = "association"
 * - Met à jour profiles.company_name via service role (sans toucher Stripe)
 */

const PASSWORD_MIN_LENGTH = 8;

function readString(body: unknown, key: string): string {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  if (!ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED) {
    return NextResponse.json(
      {
        error:
          "Obillz Associations arrive prochainement. Les inscriptions publiques ne sont pas encore ouvertes.",
        code: "ASSOCIATIONS_COMING_SOON",
      },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const email = readString(body, "email").toLowerCase();
  const password =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";
  const associationName = readString(body, "associationName");
  const firstName = readString(body, "firstName");
  const lastName = readString(body, "lastName");

  if (!associationName) {
    return NextResponse.json(
      { error: "Indiquez le nom de votre association" },
      { status: 400 }
    );
  }
  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "Indiquez votre prénom et votre nom" },
      { status: 400 }
    );
  }
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

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        product: "association",
        association_name: associationName,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (signUpError) {
    console.error("[associations/inscription] signUp KO:", signUpError.message);
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  const userId = signUpData.user?.id;
  if (userId) {
    try {
      const admin = createAdminClient();
      const now = new Date().toISOString();

      const { data: existing } = await admin
        .from("profiles")
        .select("user_id, product_type")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await admin.from("profiles").insert({
          user_id: userId,
          product_type: "association",
          company_name: associationName,
          subscription_status: "trial",
          trial_started_at: now,
          plan: "free",
        });
      } else if (existing.product_type === "association") {
        await admin
          .from("profiles")
          .update({ company_name: associationName })
          .eq("user_id", userId)
          .eq("product_type", "association");
      }
      // Si product_type === 'sport' : ne rien écrire (ne jamais convertir).

      await admin
        .from("club_memberships")
        .update({
          name: `${firstName} ${lastName}`,
          email,
        })
        .eq("club_id", userId)
        .eq("user_id", userId);
    } catch (err) {
      console.error("[associations/inscription] post-signup enrich KO:", err);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
