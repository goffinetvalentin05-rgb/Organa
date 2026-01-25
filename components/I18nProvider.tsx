"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultLocale, getTranslation, getTranslationValue, Locale } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tList: (key: string) => string[];
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "organa_locale";

const isLocale = (value: string | null | undefined): value is Locale =>
  value === "fr" || value === "en" || value === "de";

const getLocaleFromNavigator = (): Locale | null => {
  if (typeof navigator === "undefined") return null;
  const candidates = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (lower.startsWith("fr")) return "fr";
    if (lower.startsWith("en")) return "en";
    if (lower.startsWith("de")) return "de";
  }
  return null;
};

const getLocaleFromCookie = (): Locale | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${STORAGE_KEY}=`));
  if (!match) return null;
  const value = match.split("=")[1];
  return isLocale(value) ? value : null;
};

const resolveInitialLocale = (): Locale => {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  }
  const cookieLocale = getLocaleFromCookie();
  if (cookieLocale) return cookieLocale;
  const navigatorLocale = getLocaleFromNavigator();
  return navigatorLocale ?? defaultLocale;
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(resolveInitialLocale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.cookie = `${STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let value = getTranslation(locale, key);
      if (vars) {
        Object.entries(vars).forEach(([varKey, varValue]) => {
          value = value.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(varValue));
        });
      }
      return value;
    },
    [locale]
  );
  const tList = useCallback((key: string) => {
    const value = getTranslationValue(locale, key);
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      tList,
    }),
    [locale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

