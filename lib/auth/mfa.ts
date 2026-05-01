import { createClient } from "@/lib/supabase/server";
import type { ClubRole } from "@/lib/auth/rbac";

/**
 * Politique MFA :
 *   - owner / admin / committee : MFA TOTP OBLIGATOIRE.
 *   - member : MFA recommandée mais non bloquante.
 *
 * Période de grâce : à partir du 1er login d'un compte sensible existant,
 * on lui laisse MFA_GRACE_PERIOD_DAYS jours pour activer son TOTP avant
 * de bloquer l'accès au tableau de bord.
 *
 * Cette grâce est calculée par rapport à la date de création du compte
 * (auth.users.created_at). Pour les NOUVEAUX comptes (créés après l'entrée
 * en vigueur), on souhaite imposer la MFA dès la première session.
 */
export const MFA_GRACE_PERIOD_DAYS = 7;

/** Date d'entrée en vigueur de la politique. Avant cette date,
 *  les comptes existants sont en période de grâce. Après, MFA dès J0. */
export const MFA_POLICY_EFFECTIVE_DATE = new Date(
  process.env.MFA_POLICY_EFFECTIVE_DATE ?? "2026-05-01T00:00:00Z"
);

export const MFA_REQUIRED_ROLES: ClubRole[] = ["owner", "admin", "committee"];

export interface MfaStatus {
  /** L'utilisateur a-t-il un facteur TOTP enrôlé ET vérifié ? */
  hasVerifiedTotp: boolean;
  /** L'utilisateur a-t-il déjà passé la vérification MFA dans la session courante (AAL2) ? */
  isAal2: boolean;
  /** Liste des facteurs (utile pour debug/UI). */
  factorsCount: number;
}

/**
 * Récupère l'état MFA de l'utilisateur authentifié.
 */
export async function getMfaStatus(): Promise<MfaStatus> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasVerifiedTotp: false, isAal2: false, factorsCount: 0 };
  }

  // Récupère les facteurs MFA enrôlés
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const totpFactors = factorsData?.totp ?? [];
  const verifiedTotps = totpFactors.filter((f) => f.status === "verified");

  // Récupère le niveau d'authentification courant (AAL1 ou AAL2)
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const isAal2 = aalData?.currentLevel === "aal2";

  return {
    hasVerifiedTotp: verifiedTotps.length > 0,
    isAal2,
    factorsCount: totpFactors.length,
  };
}

/**
 * Décide si la MFA doit être imposée à l'utilisateur courant pour le rôle
 * sensible donné, en tenant compte de la période de grâce.
 *
 * @param role - rôle effectif de l'utilisateur dans le club courant
 * @param userCreatedAt - auth.users.created_at de l'utilisateur
 * @param status - état MFA renvoyé par getMfaStatus()
 * @returns description de la décision
 */
export function evaluateMfaPolicy(
  role: ClubRole,
  userCreatedAt: Date | string | null | undefined,
  status: MfaStatus
): {
  required: boolean;
  blocking: boolean;
  reason:
    | "ok"
    | "not_required_for_role"
    | "grace_period_active"
    | "totp_missing"
    | "needs_aal2";
  graceDaysRemaining: number;
} {
  if (!MFA_REQUIRED_ROLES.includes(role)) {
    return {
      required: false,
      blocking: false,
      reason: "not_required_for_role",
      graceDaysRemaining: 0,
    };
  }

  // Si TOTP enrôlé et session AAL2, tout va bien
  if (status.hasVerifiedTotp && status.isAal2) {
    return {
      required: true,
      blocking: false,
      reason: "ok",
      graceDaysRemaining: 0,
    };
  }

  // Si TOTP enrôlé mais session encore AAL1 → besoin d'une vérif AAL2
  if (status.hasVerifiedTotp && !status.isAal2) {
    return {
      required: true,
      blocking: true,
      reason: "needs_aal2",
      graceDaysRemaining: 0,
    };
  }

  // Pas de TOTP enrôlé → vérifier la grâce
  const created = userCreatedAt ? new Date(userCreatedAt) : null;
  const referenceDate =
    created && created < MFA_POLICY_EFFECTIVE_DATE
      ? MFA_POLICY_EFFECTIVE_DATE
      : created ?? new Date();

  const graceEnd = new Date(
    referenceDate.getTime() + MFA_GRACE_PERIOD_DAYS * 24 * 3600 * 1000
  );
  const now = new Date();
  const remainingMs = graceEnd.getTime() - now.getTime();
  const graceDaysRemaining = Math.max(
    0,
    Math.ceil(remainingMs / (24 * 3600 * 1000))
  );

  if (graceDaysRemaining > 0) {
    return {
      required: true,
      blocking: false,
      reason: "grace_period_active",
      graceDaysRemaining,
    };
  }

  return {
    required: true,
    blocking: true,
    reason: "totp_missing",
    graceDaysRemaining: 0,
  };
}
