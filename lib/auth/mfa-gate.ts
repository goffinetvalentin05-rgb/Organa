import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Décision du garde MFA obligatoire pour le tableau de bord Obillz.
 * Aucune dépendance Next/server — utilisable dans middleware Edge.
 */
export type MandatoryMfaDecision =
  | { action: "allow" }
  | { action: "redirect_setup" }
  | { action: "redirect_verify" }
  | { action: "error"; message: string };

/**
 * Politique : tout utilisateur connecté doit avoir un TOTP vérifié et une session AAL2
 * pour accéder au tableau de bord (hors routes MFA explicites).
 */
export async function evaluateMandatoryDashboardMfa(
  supabase: SupabaseClient,
  user: User
): Promise<MandatoryMfaDecision> {
  try {
    const { data: aalData, error: aalErr } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalErr) {
      return { action: "error", message: aalErr.message };
    }
    if (aalData?.currentLevel === "aal2") {
      return { action: "allow" };
    }

    const { data: factorsData, error: facErr } =
      await supabase.auth.mfa.listFactors();
    if (facErr) {
      return { action: "error", message: facErr.message };
    }

    const verifiedTotps = (factorsData?.totp ?? []).filter(
      (f: { status: string }) => f.status === "verified"
    );

    if (verifiedTotps.length > 0) {
      return { action: "redirect_verify" };
    }

    return { action: "redirect_setup" };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur inattendue lors du contrôle MFA";
    return { action: "error", message };
  }
}
