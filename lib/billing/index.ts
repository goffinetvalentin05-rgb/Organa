/**
 * Module de facturation / abonnement
 *
 * Export centralisé de toutes les fonctions liées aux abonnements.
 */

// Fonctions principales d'abonnement
export {
  getSubscriptionStatus,
  canPerformWriteAction,
  activateSubscription,
  deactivateSubscription,
  TRIAL_DURATION_DAYS,
  PRICING,
  SUBSCRIPTION_ERROR_MESSAGES,
  type SubscriptionStatus,
  type BillingCycle,
  type SubscriptionInfo,
} from "./subscription";

// Vérification d'accès
export {
  checkWriteAccess,
  createAccessDeniedResponse,
  requireWriteAccess,
  checkClientAccess,
  type AccessCheckResult,
  type AccessDeniedResponse,
} from "./checkAccess";

// Fonctions legacy (rétrocompatibilité)
export { getPlan, type Plan, type PlanResult } from "./getPlan";

// Formule Standard / Équipe
export {
  canManageTeamAccess,
  getClubSubscriptionTier,
  requireTeamPlan,
  TEAM_PLAN_ERROR_MESSAGE,
  TEAM_PRICING,
  STANDARD_PRICING,
  type SubscriptionTier,
  type TeamPlanDeniedResponse,
} from "./teamPlan";

// Limites et utilitaires
export {
  canPerformAction,
  getSubscriptionExpiredMessage,
  getActionBlockedMessage,
  // Legacy (dépréciées)
  MAX_CLIENTS_FREE,
  MAX_DOCS_PER_MONTH_FREE,
  MAX_EVENTS_FREE,
  MAX_PLANNINGS_FREE,
  isLimitReached,
  getLimitErrorMessage,
  type LimitInfo,
} from "./limits";
