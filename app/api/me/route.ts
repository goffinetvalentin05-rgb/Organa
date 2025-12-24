import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

// Retourne uniquement le user connecté (plus aucune notion d'organisation)
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[AUTH][API /me] Aucun utilisateur authentifié", {
        error: userError,
      });
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    console.log("[AUTH][API /me] Utilisateur authentifié", {
      id: user.id,
      email: user.email,
    });

    // Récupérer le plan de l'utilisateur (source unique de vérité)
    const { getPlan } = await import("@/lib/billing/getPlan");
    let planResult;
    try {
      planResult = await getPlan();
    } catch (error: any) {
      console.error("[API][me] Erreur récupération plan", error);
      // En cas d'erreur, retourner 'free' par défaut
      planResult = { plan: "free" };
    }
    const plan = planResult.plan;

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          plan: plan,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[AUTH][API /me] Erreur lors de la récupération du user", error);
    return NextResponse.json(
      { error: "Non authentifié", details: error.message },
      { status: 401 }
    );
  }
}

