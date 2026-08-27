"use client";

import HowItWorksShowcase from "@/components/landing/HowItWorksShowcase";
import LandingSectionIntro from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";
import { PRACTICE_HASHES } from "@/lib/landing/practice-anchors";

const SHOWCASE_KEYS = ["cotisations", "plannings", "communication", "sponsoring"] as const;

export default function HowItWorksSection() {
  const { t } = useI18n();
  const titleLine2 = t("marketing.showcases.titleLine2");

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
      {PRACTICE_HASHES.map((hash) => (
        <span key={hash} id={hash} className="sr-only" />
      ))}
      <div className="how-it-works-home__atmosphere" aria-hidden>
        <svg
          className="how-it-works-home__line"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M-80 210C180 140 420 320 620 390C880 480 1080 220 1520 280"
            stroke="#1A23FF"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            d="M-40 720C260 640 520 780 780 700C980 640 1180 760 1480 690"
            stroke="#1A23FF"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
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
                  {titleLine2 ? <span>{titleLine2}</span> : null}
                </span>
              }
              description={t("marketing.showcases.subtitle")}
              className="max-w-xl lg:max-w-[34rem]"
            />
          }
          steps={steps}
        />
      </div>
    </section>
  );
}
