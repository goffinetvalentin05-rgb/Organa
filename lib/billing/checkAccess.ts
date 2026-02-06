/**
 * Contrôle d'accès aux fonctionnalités basé sur l'abonnement
 *
 * Ce module fournit des utilitaires pour vérifier si un utilisateur
 * peut effectuer certaines actions en fonction de son statut d'abonnement.
 */

import {
  getSubscriptionStatus,
  SubscriptionInfo,
  SUBSCRIPTION_ERROR_MESSAGES,
} from "./subscription";

// ============================================
// Types
// ============================================

export interface AccessCheckResult {
  allowed: boolean;
  reason?: "expired" | "readonly" | "action_blocked";
  message?: string;
  cta?: string;
  subscription?: SubscriptionInfo;
}

export interface AccessDeniedResponse {
  error: "SUBSCRIPTION_REQUIRED";
  reason: "expired" | "readonly" | "action_blocked";
  message: string;
  cta: string;
  subscriptionStatus: string;
  trialDaysRemaining?: number;
}

// ============================================
// Fonctions principales
// ============================================

/**
 * Vérifie si l'utilisateur peut effectuer une action d'écriture
 *
 * @returns AccessCheckResult avec le résultat de la vérification
 */
export async function checkWriteAccess(): Promise<AccessCheckResult> {
  try {
    const subscription = await getSubscriptionStatus();

    if (subscription.canWrite) {
      return {
        allowed: true,
        subscription,
      };
    }

    // Accès refusé - déterminer la raison
    const reason = subscription.status === "expired" ? "expired" : "readonly";
    const errorInfo = SUBSCRIPTION_ERROR_MESSAGES[reason];

    return {
      allowed: false,
      reason,
      message: errorInfo.message,
      cta: errorInfo.cta,
      subscription,
    };
  } catch (error) {
    console.error("[ACCESS] Erreur lors de la vérification d'accès", error);

    // En cas d'erreur, bloquer par sécurité
    return {
      allowed: false,
      reason: "action_blocked",
      message: SUBSCRIPTION_ERROR_MESSAGES.action_blocked.message,
      cta: SUBSCRIPTION_ERROR_MESSAGES.action_blocked.cta,
    };
  }
}

/**
 * Génère une réponse JSON pour un accès refusé
 * À utiliser dans les API routes
 *
 * @param checkResult Résultat de la vérification d'accès
 * @returns AccessDeniedResponse formatée pour l'API
 */
export function createAccessDeniedResponse(
  checkResult: AccessCheckResult
): AccessDeniedResponse {
  return {
    error: "SUBSCRIPTION_REQUIRED",
    reason: checkResult.reason || "action_blocked",
    message: checkResult.message || SUBSCRIPTION_ERROR_MESSAGES.action_blocked.message,
    cta: checkResult.cta || SUBSCRIPTION_ERROR_MESSAGES.action_blocked.cta,
    subscriptionStatus: checkResult.subscription?.status || "expired",
    trialDaysRemaining: checkResult.subscription?.trialDaysRemaining,
  };
}

/**
 * Middleware pour vérifier l'accès en écriture dans les API routes
 *
 * Usage:
 * ```ts
 * const accessCheck = await requireWriteAccess();
 * if (accessCheck.response) {
 *   return accessCheck.response;
 * }
 * // Continuer avec l'action...
 * ```
 */
export async function requireWriteAccess(): Promise<{
  allowed: boolean;
  response?: Response;
  subscription?: SubscriptionInfo;
}> {
  const check = await checkWriteAccess();

  if (check.allowed) {
    return {
      allowed: true,
      subscription: check.subscription,
    };
  }

  // Créer une réponse HTTP 403
  const { NextResponse } = await import("next/server");
  const errorResponse = createAccessDeniedResponse(check);

  return {
    allowed: false,
    response: NextResponse.json(errorResponse, { status: 403 }),
  };
}

/**
 * Hook côté client pour vérifier si une action est autorisée
 * Retourne un objet avec les infos nécessaires pour afficher un message
 *
 * @param subscriptionStatus Statut de l'abonnement (passé depuis le contexte client)
 */
export function checkClientAccess(subscriptionStatus: string): {
  canWrite: boolean;
  errorMessage?: string;
  ctaText?: string;
} {
  const canWrite =
    subscriptionStatus === "active" || subscriptionStatus === "trial";

  if (canWrite) {
    return { canWrite: true };
  }

  const errorInfo = SUBSCRIPTION_ERROR_MESSAGES.expired;
  return {
    canWrite: false,
    errorMessage: errorInfo.message,
    ctaText: errorInfo.cta,
  };
}
