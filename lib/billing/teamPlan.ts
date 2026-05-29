/**
 * Formules Obillz Standard vs Équipe
 *
 * - standard : compte principal du club, sans gestion multi-utilisateurs
 * - team     : débloque « Utilisateurs & accès » (invitations, rôles, permissions)
 */

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/rbac";
import { STANDARD_PRICING, TEAM_PRICING } from "@/lib/billing/pricing";

export type SubscriptionTier = "standard" | "team";

export const TEAM_PLAN_ERROR_MESSAGE =
  "La gestion des utilisateurs et des accès est disponible avec Obillz Équipe.";

export { STANDARD_PRICING, TEAM_PRICING };

export interface TeamPlanDeniedResponse {
  error: "TEAM_PLAN_REQUIRED";
  message: string;
}

/**
 * Résout le club facturé (propriétaire) pour la vérification de formule.
 */
async function resolveBillingClubId(clubId?: string): Promise<string | null> {
  if (clubId) return clubId;
  const ctx = await getAuthContext();
  return ctx?.current?.clubId ?? null;
}

/**
 * Lit la formule du club depuis profiles.subscription_tier.
 */
export async function getClubSubscriptionTier(
  clubId?: string
): Promise<SubscriptionTier> {
  const billingClubId = await resolveBillingClubId(clubId);
  if (!billingClubId) return "standard";

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_tier, is_founder, subscription_status")
    .eq("user_id", billingClubId)
    .maybeSingle();

  if (error || !profile) {
    return "standard";
  }

  if (profile.is_founder === true) {
    return "team";
  }

  const tier = profile.subscription_tier;
  return tier === "team" ? "team" : "standard";
}

/**
 * Abonnement payant actif sur le club facturé (hors essai gratuit).
 */
async function isBillingClubSubscriptionActive(
  billingClubId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, is_founder")
    .eq("user_id", billingClubId)
    .maybeSingle();

  if (!profile) return false;
  if (profile.is_founder === true) return true;
  return profile.subscription_status === "active";
}

/**
 * Indique si le club peut gérer les utilisateurs et les accès (formule Équipe active).
 */
export async function canManageTeamAccess(clubId?: string): Promise<boolean> {
  const billingClubId = await resolveBillingClubId(clubId);
  if (!billingClubId) return false;

  const tier = await getClubSubscriptionTier(billingClubId);
  if (tier !== "team") return false;

  return isBillingClubSubscriptionActive(billingClubId);
}

/**
 * Garde-fou API : renvoie une Response 403 si la formule n'est pas Équipe.
 */
export async function requireTeamPlan(clubId?: string): Promise<{
  allowed: boolean;
  tier: SubscriptionTier;
  response?: Response;
}> {
  const tier = await getClubSubscriptionTier(clubId);

  if (tier === "team") {
    return { allowed: true, tier };
  }

  const { NextResponse } = await import("next/server");
  const body: TeamPlanDeniedResponse = {
    error: "TEAM_PLAN_REQUIRED",
    message: TEAM_PLAN_ERROR_MESSAGE,
  };

  return {
    allowed: false,
    tier,
    response: NextResponse.json(body, { status: 403 }),
  };
}
