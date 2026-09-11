export const MARKETING_CONSENT_TEXT_VERSION = "marketing_optin_v1" as const;

export const MARKETING_OPT_IN_LABEL =
  "J’accepte de recevoir les communications du club par e-mail.";

export const STAFF_DECLARED_CONFIRMATION_LABEL =
  "Je confirme que le club dispose d’une base valable pour contacter cette personne par e-mail (consentement ou autre base licite).";

export type MarketingConsentSource =
  | "event_form"
  | "buvette_form"
  | "staff_declared";

export function isTruthyMarketingOptIn(value: unknown): boolean {
  return value === true;
}

export function isStaffLawfulBasisDeclared(value: unknown): boolean {
  return value === true;
}

/** Filtre audience campagnes : opt-in explicite + pas désinscrit. */
export function withCampaignAudienceConsentFilter<
  T extends {
    eq: (column: string, value: unknown) => T;
    not: (column: string, operator: string, value: unknown) => T;
  },
>(query: T): T {
  return query.eq("unsubscribed", false).not("consented_at", "is", null);
}
