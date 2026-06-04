"use client";

import { useMemo } from "react";
import { useI18n } from "@/components/I18nProvider";
import {
  LANDING_HUB_MODULE_IDS,
  landingHubModuleIcons,
  type HubModuleBase,
} from "@/lib/landing/landing-hub-modules";

export function useLandingHubModules(): HubModuleBase[] {
  const { t } = useI18n();

  return useMemo(
    () =>
      LANDING_HUB_MODULE_IDS.map((id) => ({
        id,
        icon: landingHubModuleIcons[id],
        label: t(`marketing.modules.items.${id}.title`),
        hint: t(`marketing.hero.hubModules.${id}`),
      })),
    [t]
  );
}
