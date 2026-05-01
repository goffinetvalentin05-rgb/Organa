import { createClient } from "@/lib/supabase/server";

/**
 * État MFA pour l’utilisateur courant (Server Components / routes API locales).
 * Politique produit : TOTP obligatoire pour tout accès au tableau de bord.
 */
export interface MfaStatus {
  /** Facteur TOTP enrôlé et vérifié côté Supabase */
  hasVerifiedTotp: boolean;
  /** Session au niveau AAL2 (challenge MFA réussi dans cette session) */
  isAal2: boolean;
  factorsCount: number;
}

/**
 * Récupère l’état MFA de l’utilisateur authentifié.
 */
export async function getMfaStatus(): Promise<MfaStatus> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasVerifiedTotp: false, isAal2: false, factorsCount: 0 };
  }

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totpFactors = factorsData?.totp ?? [];
  const verifiedTotps = totpFactors.filter((f) => f.status === "verified");

  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const isAal2 = aalData?.currentLevel === "aal2";

  return {
    hasVerifiedTotp: verifiedTotps.length > 0,
    isAal2,
    factorsCount: totpFactors.length,
  };
}
