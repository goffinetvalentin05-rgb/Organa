/**
 * Source unique de vérité pour récupérer le plan de l'utilisateur
 *
 * DÉPRÉCIÉ: Utilisez getSubscriptionStatus() de subscription.ts à la place
 *
 * Cette fonction est conservée pour rétrocompatibilité.
 * Elle mappe les nouveaux statuts d'abonnement vers l'ancien système:
 * - trial/active → 'pro' (accès complet)
 * - expired → 'free' (accès limité/lecture seule)
 */

import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatus } from "./subscription";

export type Plan = "free" | "pro";

export interface PlanResult {
  plan: Plan;
  /** @deprecated Utilisez getSubscriptionStatus() pour plus de détails */
  subscriptionStatus?: "trial" | "active" | "expired";
  trialDaysRemaining?: number;
}

/**
 * Récupère le plan de l'utilisateur authentifié
 *
 * @deprecated Utilisez getSubscriptionStatus() de subscription.ts
 * @returns PlanResult avec le plan de l'utilisateur
 * @throws Error si l'utilisateur n'est pas authentifié
 */
export async function getPlan(): Promise<PlanResult> {
  try {
    const subscription = await getSubscriptionStatus();

    // Mapper le nouveau système vers l'ancien
    // trial et active = accès complet = "pro"
    // expired = accès limité = "free"
    const plan: Plan = subscription.canWrite ? "pro" : "free";

    console.log(
      `[BILLING][getPlan] status=${subscription.status} → plan=${plan} (rétrocompat)`
    );

    return {
      plan,
      subscriptionStatus: subscription.status,
      trialDaysRemaining: subscription.trialDaysRemaining,
    };
  } catch (error) {
    console.error("[BILLING][getPlan] Erreur, fallback vers logique legacy", error);

    // Fallback vers l'ancienne logique si la nouvelle échoue
    return await getLegacyPlan();
  }
}

/**
 * Ancienne logique de plan (fallback)
 */
async function getLegacyPlan(): Promise<PlanResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[BILLING][getPlan] Utilisateur non authentifié", {
      error: userError,
    });
    throw new Error("Utilisateur non authentifié");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: user.id,
      plan: "free",
      subscription_status: "trial",
      trial_started_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error(
        "[BILLING][getPlan] Erreur lors de la création du profil",
        insertError
      );
    }

    return { plan: "free", subscriptionStatus: "trial" };
  }

  if (profileError) {
    console.error(
      "[BILLING][getPlan] Erreur lors de la lecture du profil",
      profileError
    );
    return { plan: "free" };
  }

  const plan = profile?.plan === "pro" ? "pro" : "free";

  return {
    plan,
    subscriptionStatus: profile?.subscription_status,
  };
}

