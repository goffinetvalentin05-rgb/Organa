import type { AccountType } from "./types";

export type ChartAccountSeed = {
  number: string;
  name: string;
  accountType: AccountType;
  accountClass: number;
  systemCode: string | null;
  isSystem: boolean;
};

/**
 * Plan comptable suisse PME, allégé pour un club.
 * Les codes stables (systemCode) portent les mappings automatiques.
 * Les numéros restent modifiables tant qu’aucune ligne n’est passée.
 */
export const RECOMMENDED_CHART: ChartAccountSeed[] = [
  { number: "1000", name: "Caisse", accountType: "asset", accountClass: 1, systemCode: "cash", isSystem: true },
  { number: "1020", name: "Banque", accountType: "asset", accountClass: 1, systemCode: "bank", isSystem: true },
  { number: "1025", name: "Compte Stripe", accountType: "asset", accountClass: 1, systemCode: "stripe", isSystem: true },
  { number: "1100", name: "Débiteurs", accountType: "asset", accountClass: 1, systemCode: "debtors", isSystem: false },
  { number: "1170", name: "Impôt préalable TVA", accountType: "asset", accountClass: 1, systemCode: "vat_input", isSystem: false },
  { number: "1200", name: "Stocks", accountType: "asset", accountClass: 1, systemCode: "inventory", isSystem: false },
  { number: "1300", name: "Actifs de régularisation / actifs transitoires", accountType: "asset", accountClass: 1, systemCode: "prepaid", isSystem: false },
  { number: "1500", name: "Immobilisations corporelles", accountType: "asset", accountClass: 1, systemCode: "fixed_assets", isSystem: false },

  { number: "2000", name: "Créanciers", accountType: "liability", accountClass: 2, systemCode: "creditors", isSystem: false },
  { number: "2200", name: "TVA due", accountType: "liability", accountClass: 2, systemCode: "vat_output", isSystem: false },
  { number: "2300", name: "Passifs de régularisation / passifs transitoires", accountType: "liability", accountClass: 2, systemCode: "accrued", isSystem: false },
  { number: "2800", name: "Fortune de l’association", accountType: "equity", accountClass: 2, systemCode: "equity", isSystem: true },
  { number: "2900", name: "Résultats reportés", accountType: "equity", accountClass: 2, systemCode: "retained", isSystem: true },
  { number: "2979", name: "Résultat de l’exercice", accountType: "equity", accountClass: 2, systemCode: "result", isSystem: true },

  { number: "3000", name: "Cotisations membres", accountType: "revenue", accountClass: 3, systemCode: "membership", isSystem: false },
  { number: "3100", name: "Sponsoring", accountType: "revenue", accountClass: 3, systemCode: "sponsoring", isSystem: false },
  { number: "3200", name: "Dons et soutiens", accountType: "revenue", accountClass: 3, systemCode: "donation", isSystem: false },
  { number: "3300", name: "Manifestations", accountType: "revenue", accountClass: 3, systemCode: "event_income", isSystem: false },
  { number: "3400", name: "Boutique", accountType: "revenue", accountClass: 3, systemCode: "shop", isSystem: false },
  { number: "3500", name: "Cartes supporters", accountType: "revenue", accountClass: 3, systemCode: "supporters", isSystem: false },
  { number: "3600", name: "Ventes de soutien", accountType: "revenue", accountClass: 3, systemCode: "support_sale", isSystem: false },
  { number: "3700", name: "Subventions", accountType: "revenue", accountClass: 3, systemCode: "grant", isSystem: false },
  { number: "3800", name: "Buvette", accountType: "revenue", accountClass: 3, systemCode: "buvette", isSystem: false },
  { number: "3900", name: "Autres produits", accountType: "revenue", accountClass: 3, systemCode: "other_income", isSystem: false },

  { number: "4000", name: "Matériel sportif", accountType: "expense", accountClass: 4, systemCode: "sports_equipment", isSystem: false },
  { number: "4100", name: "Équipements", accountType: "expense", accountClass: 4, systemCode: "equipment", isSystem: false },
  { number: "4200", name: "Frais d’arbitrage", accountType: "expense", accountClass: 4, systemCode: "referees", isSystem: false },

  { number: "5000", name: "Indemnités et salaires", accountType: "expense", accountClass: 5, systemCode: "personnel", isSystem: false },
  { number: "5100", name: "Charges sociales", accountType: "expense", accountClass: 5, systemCode: "social_charges", isSystem: false },

  { number: "6000", name: "Locations", accountType: "expense", accountClass: 6, systemCode: "rent", isSystem: false },
  { number: "6200", name: "Déplacements", accountType: "expense", accountClass: 6, systemCode: "travel", isSystem: false },
  { number: "6500", name: "Frais administratifs", accountType: "expense", accountClass: 6, systemCode: "admin", isSystem: false },
  { number: "6600", name: "Communication et publicité", accountType: "expense", accountClass: 6, systemCode: "communication", isSystem: false },
  { number: "6700", name: "Manifestations", accountType: "expense", accountClass: 6, systemCode: "events_expense", isSystem: false },
  { number: "6800", name: "Frais bancaires et Stripe", accountType: "expense", accountClass: 6, systemCode: "bank_fees", isSystem: false },
  { number: "6900", name: "Autres charges", accountType: "expense", accountClass: 6, systemCode: "other_expense", isSystem: false },
];

export const ACCOUNT_CLASS_LABELS: Record<number, string> = {
  1: "Actifs",
  2: "Passifs",
  3: "Produits",
  4: "Charges de matériel",
  5: "Charges de personnel",
  6: "Autres charges",
};

/** Mappings automatiques : source_kind → systemCode du compte. */
export const DEFAULT_MAPPINGS: Record<string, string> = {
  membership: "membership",
  sponsoring: "sponsoring",
  donation: "donation",
  event_income: "event_income",
  shop: "shop",
  supporters: "supporters",
  support_sale: "support_sale",
  grant: "grant",
  buvette: "buvette",
  other_income: "other_income",
  sports_equipment: "sports_equipment",
  equipment: "equipment",
  referees: "referees",
  personnel: "personnel",
  social_charges: "social_charges",
  rent: "rent",
  travel: "travel",
  admin: "admin",
  communication: "communication",
  events_expense: "events_expense",
  bank_fees: "bank_fees",
  other_expense: "other_expense",
  bank: "bank",
  cash: "cash",
  stripe: "stripe",
  equity: "equity",
};

export const INCOME_CATEGORY_CODES = [
  "membership",
  "sponsoring",
  "donation",
  "event_income",
  "shop",
  "supporters",
  "support_sale",
  "grant",
  "buvette",
  "other_income",
] as const;

export const EXPENSE_CATEGORY_CODES = [
  "sports_equipment",
  "equipment",
  "referees",
  "personnel",
  "social_charges",
  "rent",
  "travel",
  "admin",
  "communication",
  "events_expense",
  "bank_fees",
  "other_expense",
] as const;
