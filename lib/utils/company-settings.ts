/**
 * Helper pour gérer les paramètres entreprise de manière robuste
 * Fournit des valeurs par défaut sécurisées en cas d'absence de paramètres
 */

import { getCurrencySymbol } from './currency';

/**
 * Valeurs par défaut des paramètres entreprise
 */
export const DEFAULT_COMPANY_SETTINGS = {
  primary_color: '#6D5EF8',
  currency: 'CHF',
  currency_symbol: 'CHF',
} as const;

/**
 * Type pour les paramètres entreprise
 */
export interface CompanySettings {
  primary_color: string;
  currency: string;
  currency_symbol: string;
}

/**
 * Récupère les paramètres entreprise avec fallbacks robustes
 * Ne retourne jamais de valeurs null/undefined - toujours des valeurs par défaut
 * 
 * @param settings Paramètres bruts depuis l'API (peuvent être null/undefined)
 * @returns Paramètres entreprise garantis avec valeurs par défaut
 */
export function getCompanySettings(settings: any): CompanySettings {
  // Valeurs par défaut
  let primary_color = DEFAULT_COMPANY_SETTINGS.primary_color;
  let currency = DEFAULT_COMPANY_SETTINGS.currency;
  let currency_symbol = DEFAULT_COMPANY_SETTINGS.currency_symbol;

  // Si settings existe et contient primary_color, l'utiliser
  if (settings?.primary_color && typeof settings.primary_color === 'string') {
    const color = settings.primary_color.trim();
    // Valider le format hex (simple validation)
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      primary_color = color;
    }
  }

  // Si settings existe et contient currency, l'utiliser
  if (settings?.currency && typeof settings.currency === 'string') {
    const currencyValue = settings.currency.trim().toUpperCase();
    if (currencyValue.length === 3) {
      currency = currencyValue;
      // Calculer automatiquement le symbole si currency_symbol n'est pas défini
      if (settings.currency_symbol && typeof settings.currency_symbol === 'string') {
        currency_symbol = settings.currency_symbol.trim();
      } else {
        currency_symbol = getCurrencySymbol(currencyValue);
      }
    }
  } else if (settings?.currency_symbol && typeof settings.currency_symbol === 'string') {
    // Si currency_symbol est défini mais pas currency, l'utiliser quand même
    currency_symbol = settings.currency_symbol.trim();
  }

  return {
    primary_color,
    currency,
    currency_symbol,
  };
}

/**
 * Valide et nettoie une couleur hex
 * @param color Couleur à valider
 * @returns Couleur valide ou valeur par défaut
 */
export function validateHexColor(color: string | null | undefined): string {
  if (!color || typeof color !== 'string') {
    return DEFAULT_COMPANY_SETTINGS.primary_color;
  }
  
  const trimmed = color.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed;
  }
  
  return DEFAULT_COMPANY_SETTINGS.primary_color;
}

/**
 * Valide et nettoie un code devise
 * @param currency Code devise à valider
 * @returns Code devise valide ou valeur par défaut
 */
export function validateCurrency(currency: string | null | undefined): string {
  if (!currency || typeof currency !== 'string') {
    return DEFAULT_COMPANY_SETTINGS.currency;
  }
  
  const trimmed = currency.trim().toUpperCase();
  if (trimmed.length === 3) {
    return trimmed;
  }
  
  return DEFAULT_COMPANY_SETTINGS.currency;
}

