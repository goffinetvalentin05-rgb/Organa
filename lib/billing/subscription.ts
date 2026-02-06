/**
 * Gestion des abonnements et essais gratuits
 *
 * Logique métier:
 * - Essai gratuit de 7 jours avec accès complet
 * - Après 7 jours: mode lecture seule (expired)
 * - Abonnement actif: accès complet (active)
 *
 * Tarifs:
 * - Mensuel: 25 CHF/mois
 * - Annuel: 270 CHF/an (économie de 10%)
 */

import { createClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================

export type SubscriptionStatus = "trial" | "active" | "expired";
export type BillingCycle = "monthly" | "yearly" | null;

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  trialStartedAt: Date | null;
  trialDaysRemaining: number;
  trialEndsAt: Date | null;
  isTrialExpired: boolean;
  canWrite: boolean; // true si l'utilisateur peut créer/modifier/supprimer
  subscriptionStartedAt: Date | null;
  subscriptionEndsAt: Date | null;
}

// ============================================
// Constantes
// ============================================

export const TRIAL_DURATION_DAYS = 7;

export const PRICING = {
  monthly: {
    amount: 25,
    currency: "CHF",
    label: "Mensuel",
    period: "mois",
  },
  yearly: {
    amount: 270,
    currency: "CHF",
    label: "Annuel",
    period: "an",
    savings: "Économisez 10%",
  },
} as const;

// ============================================
// Fonctions principales
// ============================================

/**
 * Récupère les informations complètes sur l'abonnement de l'utilisateur
 *
 * @returns SubscriptionInfo avec toutes les informations de subscription
 * @throws Error si l'utilisateur n'est pas authentifié
 */
export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  const supabase = await createClient();

  // 1. Récupérer l'utilisateur authentifié
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "[BILLING][getSubscriptionStatus] Utilisateur non authentifié",
      { error: userError }
    );
    throw new Error("Utilisateur non authentifié");
  }

  // 2. Lire le profil depuis profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "subscription_status, trial_started_at, billing_cycle, subscription_started_at, subscription_ends_at, created_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // 3. Si aucun profil existe, le créer avec trial
  if (!profile) {
    console.log(
      `[BILLING][getSubscriptionStatus] Profil inexistant pour user_id=${user.id}, création avec trial`
    );

    const now = new Date();
    const { error: insertError } = await supabase.from("profiles").insert({
      user_id: user.id,
      subscription_status: "trial",
      trial_started_at: now.toISOString(),
      plan: "free", // Garder pour rétrocompatibilité
    });

    if (insertError) {
      console.error(
        "[BILLING][getSubscriptionStatus] Erreur lors de la création du profil",
        insertError
      );
      // En cas d'erreur, retourner un état expired par défaut
      return createExpiredSubscription();
    }

    // Profil créé, retourner l'état trial
    return createTrialSubscription(now);
  }

  if (profileError) {
    console.error(
      "[BILLING][getSubscriptionStatus] Erreur lors de la lecture du profil",
      profileError
    );
    return createExpiredSubscription();
  }

  // 4. Calculer le statut effectif
  const trialStartedAt = profile.trial_started_at
    ? new Date(profile.trial_started_at)
    : profile.created_at
      ? new Date(profile.created_at)
      : null;

  const subscriptionStartedAt = profile.subscription_started_at
    ? new Date(profile.subscription_started_at)
    : null;

  const subscriptionEndsAt = profile.subscription_ends_at
    ? new Date(profile.subscription_ends_at)
    : null;

  const billingCycle = profile.billing_cycle as BillingCycle;
  let status = profile.subscription_status as SubscriptionStatus;

  // 5. Si le statut est 'active', vérifier que l'abonnement n'est pas expiré
  if (status === "active") {
    // TODO: Vérifier avec Stripe si l'abonnement est toujours actif
    return {
      status: "active",
      billingCycle,
      trialStartedAt,
      trialDaysRemaining: 0,
      trialEndsAt: null,
      isTrialExpired: true,
      canWrite: true,
      subscriptionStartedAt,
      subscriptionEndsAt,
    };
  }

  // 6. Si le statut est 'trial', vérifier si le trial n'est pas expiré
  if (status === "trial" && trialStartedAt) {
    const trialEndsAt = new Date(trialStartedAt);
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    const now = new Date();
    const isTrialExpired = now > trialEndsAt;

    if (isTrialExpired) {
      // Mettre à jour le statut en 'expired'
      await supabase
        .from("profiles")
        .update({ subscription_status: "expired" })
        .eq("user_id", user.id);

      console.log(
        `[BILLING][getSubscriptionStatus] Trial expiré pour user_id=${user.id}`
      );

      return {
        status: "expired",
        billingCycle: null,
        trialStartedAt,
        trialDaysRemaining: 0,
        trialEndsAt,
        isTrialExpired: true,
        canWrite: false,
        subscriptionStartedAt: null,
        subscriptionEndsAt: null,
      };
    }

    // Trial encore valide
    const trialDaysRemaining = Math.ceil(
      (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(
      `[BILLING][getSubscriptionStatus] user_id=${user.id} status=trial days_remaining=${trialDaysRemaining}`
    );

    return {
      status: "trial",
      billingCycle: null,
      trialStartedAt,
      trialDaysRemaining,
      trialEndsAt,
      isTrialExpired: false,
      canWrite: true,
      subscriptionStartedAt: null,
      subscriptionEndsAt: null,
    };
  }

  // 7. Statut 'expired' ou autre
  console.log(
    `[BILLING][getSubscriptionStatus] user_id=${user.id} status=expired`
  );

  return {
    status: "expired",
    billingCycle: null,
    trialStartedAt,
    trialDaysRemaining: 0,
    trialEndsAt: trialStartedAt
      ? new Date(
          trialStartedAt.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000
        )
      : null,
    isTrialExpired: true,
    canWrite: false,
    subscriptionStartedAt: null,
    subscriptionEndsAt: null,
  };
}

/**
 * Vérifie si l'utilisateur peut effectuer une action d'écriture
 * (créer, modifier, supprimer)
 *
 * @returns true si l'utilisateur peut écrire, false sinon
 */
export async function canPerformWriteAction(): Promise<boolean> {
  try {
    const subscription = await getSubscriptionStatus();
    return subscription.canWrite;
  } catch (error) {
    console.error("[BILLING][canPerformWriteAction] Erreur", error);
    return false;
  }
}

/**
 * Active l'abonnement après un paiement réussi
 *
 * @param userId ID de l'utilisateur
 * @param billingCycle Cycle de facturation (monthly ou yearly)
 * @param stripeSubscriptionId ID de l'abonnement Stripe
 */
export async function activateSubscription(
  userId: string,
  billingCycle: "monthly" | "yearly",
  stripeSubscriptionId?: string
): Promise<void> {
  const supabase = await createClient();

  const now = new Date();
  const endsAt = new Date(now);

  // Calculer la date de fin selon le cycle
  if (billingCycle === "yearly") {
    endsAt.setFullYear(endsAt.getFullYear() + 1);
  } else {
    endsAt.setMonth(endsAt.getMonth() + 1);
  }

  const updateData: Record<string, unknown> = {
    subscription_status: "active",
    billing_cycle: billingCycle,
    subscription_started_at: now.toISOString(),
    subscription_ends_at: endsAt.toISOString(),
    plan: "pro", // Garder pour rétrocompatibilité
  };

  if (stripeSubscriptionId) {
    updateData.stripe_subscription_id = stripeSubscriptionId;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("user_id", userId);

  if (error) {
    console.error(
      "[BILLING][activateSubscription] Erreur lors de l'activation",
      error
    );
    throw new Error("Erreur lors de l'activation de l'abonnement");
  }

  console.log(
    `[BILLING][activateSubscription] Abonnement activé pour user_id=${userId} cycle=${billingCycle}`
  );
}

/**
 * Désactive l'abonnement (annulation ou expiration)
 *
 * @param userId ID de l'utilisateur
 */
export async function deactivateSubscription(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status: "expired",
      billing_cycle: null,
      plan: "free", // Garder pour rétrocompatibilité
    })
    .eq("user_id", userId);

  if (error) {
    console.error(
      "[BILLING][deactivateSubscription] Erreur lors de la désactivation",
      error
    );
    throw new Error("Erreur lors de la désactivation de l'abonnement");
  }

  console.log(
    `[BILLING][deactivateSubscription] Abonnement désactivé pour user_id=${userId}`
  );
}

// ============================================
// Fonctions utilitaires privées
// ============================================

function createTrialSubscription(trialStartedAt: Date): SubscriptionInfo {
  const trialEndsAt = new Date(trialStartedAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

  const now = new Date();
  const trialDaysRemaining = Math.ceil(
    (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    status: "trial",
    billingCycle: null,
    trialStartedAt,
    trialDaysRemaining,
    trialEndsAt,
    isTrialExpired: false,
    canWrite: true,
    subscriptionStartedAt: null,
    subscriptionEndsAt: null,
  };
}

function createExpiredSubscription(): SubscriptionInfo {
  return {
    status: "expired",
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

// ============================================
// Messages d'erreur
// ============================================

export const SUBSCRIPTION_ERROR_MESSAGES = {
  expired: {
    title: "Votre essai est terminé",
    message:
      "Votre période d'essai de 7 jours est terminée. Abonnez-vous pour continuer à utiliser toutes les fonctionnalités.",
    cta: "Passer à l'abonnement",
  },
  readonly: {
    title: "Mode lecture seule",
    message:
      "Vous pouvez consulter vos données mais les modifications sont désactivées.",
    cta: "Débloquer l'accès complet",
  },
  action_blocked: {
    title: "Action non disponible",
    message:
      "Cette action nécessite un abonnement actif. Abonnez-vous pour débloquer toutes les fonctionnalités.",
    cta: "S'abonner maintenant",
  },
} as const;
