/** Tarifs Obillz — source unique (landing, dashboard, API) */

export const TRIAL_DURATION_DAYS = 7;

export const STANDARD_PRICING = {
  monthly: {
    amount: 39,
    currency: "CHF",
    label: "Standard mensuel",
    period: "mois",
  },
  yearly: {
    amount: 390,
    currency: "CHF",
    label: "Standard annuel",
    period: "an",
    savings: "2 mois offerts",
  },
} as const;

export const TEAM_PRICING = {
  monthly: {
    amount: 49,
    currency: "CHF",
    label: "Obillz mensuel",
    period: "mois",
  },
  yearly: {
    amount: 490,
    currency: "CHF",
    label: "Obillz annuel",
    period: "an",
    savings: "2 mois offerts",
  },
} as const;

/** Tarif public actuel (nouveaux abonnements) */
export const PRICING = TEAM_PRICING;

export type PlanPricing = typeof STANDARD_PRICING | typeof TEAM_PRICING;

export const STANDARD_PLAN_FEATURES = [
  "Membres illimités",
  "Événements illimités",
  "Plannings & affectations",
  "Factures & devis",
  "Gestion des dépenses",
  "QR Codes personnalisés",
  "Export des données",
  "Support prioritaire",
] as const;

export const TEAM_PLAN_EXTRA_FEATURES = [
  "Invitations multi-utilisateurs",
  "Rôles & permissions par module",
  "Comptes séparés pour le comité",
  "Traçabilité des actions",
] as const;
