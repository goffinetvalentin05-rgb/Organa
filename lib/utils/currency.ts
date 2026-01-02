/**
 * Helper pour formater les montants selon la devise
 */

/**
 * Liste des devises supportées
 */
export const SUPPORTED_CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP', 'CAD', 'AUD', 'JPY'] as const;

export type Currency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Devise par défaut si non spécifiée
 */
export const DEFAULT_CURRENCY: Currency = 'CHF';

/**
 * Formatage d'un montant selon la devise
 * @param amount Montant à formater
 * @param currency Code devise (ex: 'CHF', 'EUR', 'USD')
 * @param locale Locale pour le formatage (par défaut 'fr-FR')
 * @returns Montant formaté (ex: "1 234,56 CHF")
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = 'fr-FR'
): string {
  // S'assurer que la devise est valide, sinon utiliser la valeur par défaut
  const validCurrency = SUPPORTED_CURRENCIES.includes(currency as Currency)
    ? (currency as Currency)
    : DEFAULT_CURRENCY;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: validCurrency,
  }).format(amount);
}

/**
 * Récupère le symbole de devise (sans le montant)
 * @param currency Code devise
 * @returns Symbole de la devise
 */
export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  const validCurrency = SUPPORTED_CURRENCIES.includes(currency as Currency)
    ? (currency as Currency)
    : DEFAULT_CURRENCY;

  // Utiliser Intl pour obtenir le symbole de devise
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: validCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Extraire le symbole en formatant 0
  const parts = formatter.formatToParts(0);
  const symbolPart = parts.find((part) => part.type === 'currency');
  return symbolPart?.value || validCurrency;
}









