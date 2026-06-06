/**
 * Accès produit Obillz (facturation Stripe).
 *
 * Depuis la tarification unifiée, toutes les fonctionnalités — y compris
 * « Utilisateurs & accès » — sont disponibles pour tout club avec un
 * abonnement actif (legacy Standard 390 CHF/an ou nouveau 490 CHF/an).
 *
 * `subscription_tier` (standard / team) est conservé à des fins de suivi
 * Stripe mais ne conditionne plus l'accès aux fonctionnalités.
 */

import { createClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/rbac";
import { STANDARD_PRICING, TEAM_PRICING } from "@/lib/billing/pricing";

export type SubscriptionTier = "standard" | "team";

export const SUBSCRIPTION_REQUIRED_MESSAGE =
  "La gestion des utilisateurs et des accès nécessite un abonnement actif.";

/** @deprecated Utiliser SUBSCRIPTION_REQUIRED_MESSAGE */
export const TEAM_PLAN_ERROR_MESSAGE = SUBSCRIPTION_REQUIRED_MESSAGE;

export { STANDARD_PRICING, TEAM_PRICING };

export interface SubscriptionRequiredResponse {
  error: "SUBSCRIPTION_REQUIRED";
  message: string;
}

/** @deprecated Utiliser SubscriptionRequiredResponse */
export interface TeamPlanDeniedResponse {
  error: "TEAM_PLAN_REQUIRED";
  message: string;
}

/**
 * Résout le club facturé (propriétaire) pour la vérification d'abonnement.
 */
async function resolveBillingClubId(clubId?: string): Promise<string | null> {
  if (clubId) return clubId;
  const ctx = await getAuthContext();
  return ctx?.current?.clubId ?? null;
}

/**
 * Lit la formule Stripe enregistrée (suivi / analytics — pas de gating fonctionnel).
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
 * Indique si le club facturé a un accès produit complet (abonnement ou essai).
 */
async function hasBillingClubProductAccess(
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
  return (
    profile.subscription_status === "active" ||
    profile.subscription_status === "trial"
  );
}

/**
 * Indique si le club peut gérer les utilisateurs et les accès.
 * Requiert un abonnement actif ou une période d'essai en cours.
 */
export async function canManageTeamAccess(clubId?: string): Promise<boolean> {
  const billingClubId = await resolveBillingClubId(clubId);
  if (!billingClubId) return false;

  return hasBillingClubProductAccess(billingClubId);
}

/**
 * Garde-fou API : renvoie une Response 403 si le club n'a pas d'abonnement actif.
 */
export async function requireTeamPlan(clubId?: string): Promise<{
  allowed: boolean;
  tier: SubscriptionTier;
  response?: Response;
}> {
  const tier = await getClubSubscriptionTier(clubId);
  const allowed = await canManageTeamAccess(clubId);

  if (allowed) {
    return { allowed: true, tier };
  }

  const { NextResponse } = await import("next/server");
  const body: SubscriptionRequiredResponse = {
    error: "SUBSCRIPTION_REQUIRED",
    message: SUBSCRIPTION_REQUIRED_MESSAGE,
  };

  return {
    allowed: false,
    tier,
    response: NextResponse.json(body, { status: 403 }),
  };
}
