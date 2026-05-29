"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";

/** Met à jour titre et meta description de la landing selon la locale. */
export default function LandingLocaleEffects() {
  const { locale, t } = useI18n();

  useEffect(() => {
    document.title = t("marketing.metadata.title");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("marketing.metadata.description"));
    }
  }, [locale, t]);

  return null;
}
