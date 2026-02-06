import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus, PRICING } from "@/lib/billing/subscription";

// Forcer le runtime Node.js (pas Edge)
export const runtime = "nodejs";

// Retourne le user connecté avec les informations d'abonnement
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

    // Récupérer le statut d'abonnement (nouvelle source de vérité)
    let subscription;
    try {
      subscription = await getSubscriptionStatus();
    } catch (error: any) {
      console.error("[API][me] Erreur récupération abonnement", error);
      // En cas d'erreur, retourner un état expired par défaut
      subscription = {
        status: "expired" as const,
        billingCycle: null,
        trialStartedAt: null,
        trialDaysRemaining: 0,
        trialEndsAt: null,
        isTrialExpired: true,
        canWrite: false,
        subscriptionStartedAt: null,
        subscriptionEndsAt: null,
      };
    }

    // Mapper vers l'ancien format 'plan' pour rétrocompatibilité
    const plan = subscription.canWrite ? "pro" : "free";

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          plan: plan, // Rétrocompatibilité
        },
        subscription: {
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          trialDaysRemaining: subscription.trialDaysRemaining,
          trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
          isTrialExpired: subscription.isTrialExpired,
          canWrite: subscription.canWrite,
          subscriptionEndsAt: subscription.subscriptionEndsAt?.toISOString() || null,
        },
        pricing: PRICING,
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

