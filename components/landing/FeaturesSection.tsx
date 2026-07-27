"use client";

import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";

export default function FeaturesSection() {
  const { t } = useI18n();

  return (
    <section id="modules" className={landingSectionShellClass(true)}>
      <div className="relative mx-auto w-[94%] max-w-[1240px]">
        <LandingSectionIntro
          layout="centered"
          label={t("marketing.modules.label")}
          title={t("marketing.modules.title")}
          description={t("marketing.modules.subtitle")}
        />
      </div>
    </section>
  );
}
