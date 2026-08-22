"use client";

import HowItWorksShowcase from "@/components/landing/HowItWorksShowcase";
import LandingSectionIntro from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";

const SHOWCASE_KEYS = ["cotisations", "plannings", "communication", "sponsoring"] as const;

export default function HowItWorksSection() {
  const { t } = useI18n();

  const steps = SHOWCASE_KEYS.map((key) => ({
    label: t(`marketing.showcases.${key}.label`),
    title: t(`marketing.showcases.${key}.title`),
    description: t(`marketing.showcases.${key}.description`),
  }));

  return (
    <section
      id="en-pratique"
      className="lp-section how-it-works-home scroll-mt-32 md:scroll-mt-36"
    >
      <div className="how-it-works-home__atmosphere" aria-hidden>
        <div className="how-it-works-home__dots" />
        <div className="how-it-works-home__halo how-it-works-home__halo--a" />
        <div className="how-it-works-home__halo how-it-works-home__halo--b" />
        <div className="how-it-works-home__halo how-it-works-home__halo--c" />
      </div>
      <div className="lp-wrap">
        <HowItWorksShowcase
          intro={
            <LandingSectionIntro
              layout="stack"
              label={t("marketing.showcases.label")}
              title={
                <span className="lp-practice__title">
                  <span>{t("marketing.showcases.titleLine1")}</span>
                  <span>{t("marketing.showcases.titleLine2")}</span>
                </span>
              }
              description={t("marketing.showcases.subtitle")}
              className="max-w-2xl lg:max-w-none"
            />
          }
          steps={steps}
        />
      </div>
    </section>
  );
}
