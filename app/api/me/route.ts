import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus, PRICING } from "@/lib/billing/subscription";
import { getAuthContext } from "@/lib/auth/rbac";

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

    // Récupérer le nom du club actif (depuis le profil du clubId courant)
    // Sert à l'affichage de la barre supérieure du dashboard.
    let clubName: string | null = null;
    let clubId: string | null = null;
    try {
      const ctx = await getAuthContext();
      clubId = ctx?.current?.clubId ?? null;
      if (clubId) {
        const { data: clubProfile, error: clubProfileError } = await supabase
          .from("profiles")
          .select("company_name")
          .eq("user_id", clubId)
          .maybeSingle();
        if (clubProfileError) {
          console.warn("[API /me] Lecture company_name club échouée", {
            clubId,
            error: clubProfileError.message,
          });
        }
        const raw = clubProfile?.company_name;
        if (typeof raw === "string" && raw.trim()) {
          clubName = raw.trim();
        }
      }
    } catch (clubErr) {
      console.warn("[API /me] Récupération clubName impossible", clubErr);
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          plan: plan, // Rétrocompatibilité
          clubId,
          clubName,
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

