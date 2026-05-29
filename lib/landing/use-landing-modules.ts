"use client";

import { useMemo } from "react";
import { useI18n } from "@/components/I18nProvider";
import {
  LANDING_MODULE_IDS,
  landingModuleIcons,
  type LandingModuleId,
} from "@/lib/landing/landing-modules";

export type LandingModuleView = {
  id: LandingModuleId;
  icon: (typeof landingModuleIcons)[LandingModuleId];
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  preview: { headline: string; sub: string; chips: string[] };
};

export function useLandingModules(): LandingModuleView[] {
  const { t, tList } = useI18n();

  return useMemo(
    () =>
      LANDING_MODULE_IDS.map((id) => ({
        id,
        icon: landingModuleIcons[id],
        title: t(`marketing.modules.items.${id}.title`),
        tagline: t(`marketing.modules.items.${id}.tagline`),
        description: t(`marketing.modules.items.${id}.description`),
        bullets: tList(`marketing.modules.items.${id}.bullets`),
        preview: {
          headline: t(`marketing.modules.items.${id}.preview.headline`),
          sub: t(`marketing.modules.items.${id}.preview.sub`),
          chips: tList(`marketing.modules.items.${id}.preview.chips`),
        },
      })),
    [t, tList]
  );
}
