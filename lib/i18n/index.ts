import frBase from "./fr.json";
import enBase from "./en.json";
import deBase from "./de.json";
import marketingFr from "./marketing/fr.json";
import marketingEn from "./marketing/en.json";
import marketingDe from "./marketing/de.json";

export type Locale = "fr" | "en" | "de";

export const defaultLocale: Locale = "fr";

export const localeToIntl = {
  fr: "fr-CH",
  en: "en-GB",
  de: "de-CH",
} as const;

const fr = { ...frBase, marketing: marketingFr };
const en = { ...enBase, marketing: marketingEn };
const de = { ...deBase, marketing: marketingDe };

export const translations = {
  fr,
  en,
  de,
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getNestedValue = (source: Record<string, unknown>, key: string): unknown =>
  key.split(".").reduce<unknown>((acc, part) => {
    if (!isRecord(acc)) return undefined;
    return acc[part];
  }, source);

export const getTranslationValue = (locale: Locale, key: string): unknown => {
  const primary = getNestedValue(translations[locale], key);
  if (primary !== undefined) {
    return primary;
  }

  return getNestedValue(translations[defaultLocale], key);
};

export const getTranslation = (locale: Locale, key: string): string => {
  const value = getTranslationValue(locale, key);
  return typeof value === "string" ? value : key;
};
