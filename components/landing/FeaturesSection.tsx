"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import {
  landingPremiumCardDescClass,
  landingPremiumCardTitleClass,
  landingShowcaseCardClass,
} from "@/components/ui/styles";
import { showcaseMockById } from "@/components/landing/features/FeatureShowcaseMocks";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";

type FeatureCard = { id: string; title: string; description: string };

const cardMeta: Record<
  string,
  { grid: string; minHeight: string; number: string; wide?: boolean }
> = {
  membres: { grid: "lg:col-span-4", minHeight: "lg:min-h-[460px]", number: "01" },
  cotisations: { grid: "lg:col-span-4", minHeight: "lg:min-h-[460px]", number: "02" },
  evenements: { grid: "lg:col-span-4", minHeight: "lg:min-h-[460px]", number: "03" },
  sponsors: { grid: "lg:col-span-5", minHeight: "lg:min-h-[420px]", number: "04" },
  documents: { grid: "lg:col-span-7", minHeight: "lg:min-h-[420px]", number: "05" },
  acces: { grid: "lg:col-span-12", minHeight: "lg:min-h-[360px]", number: "06", wide: true },
};

export default function FeaturesSection() {
  const { t, locale } = useI18n();
  const raw = getTranslationValue(locale, "marketing.modules.gridCards");
  const cards = (Array.isArray(raw) ? raw : []) as FeatureCard[];

  return (
    <section id="modules" className={landingSectionShellClass(true)}>
      <div className="relative mx-auto w-[94%] max-w-[1240px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <LandingSectionIntro
            layout="split"
            label={t("marketing.modules.label")}
            title={
              <>
                <span className="block">{t("marketing.modules.titleLine1")}</span>
                <span className="block">{t("marketing.modules.titleLine2")}</span>
              </>
            }
            description={t("marketing.modules.subtitle")}
            action={
              <LandingPrimaryButton href="/inscription">{t("marketing.modules.cta")}</LandingPrimaryButton>
            }
          />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="landing-section-content grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-5"
        >
          {cards.map((card) => {
            const meta = cardMeta[card.id] ?? {
              grid: "lg:col-span-4",
              minHeight: "lg:min-h-[420px]",
              number: "00",
            };
            return (
              <motion.div
                key={card.id}
                variants={staggerItem}
                className={`${meta.grid} ${meta.minHeight}`}
              >
                <ShowcaseCard card={card} number={meta.number} wide={meta.wide} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  card,
  number,
  wide,
}: {
  card: FeatureCard;
  number: string;
  wide?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const Mock = showcaseMockById[card.id];

  if (card.id === "documents") {
    return (
      <motion.article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.4, ease: easePremium } }}
        className={`${landingShowcaseCardClass} feature-card-documents`}
      >
        <span
          className="pointer-events-none absolute right-5 top-3 z-0 select-none text-[4.25rem] font-black leading-none tracking-[-0.05em] text-white/[0.04] sm:right-6 sm:top-4 sm:text-[5rem] lg:text-[5.5rem]"
          aria-hidden
        >
          {number}
        </span>

        <div className="feature-card-documents__text relative z-[2] shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
          <h3 className={`relative pr-14 text-base sm:text-lg lg:pr-[4.5rem] ${landingPremiumCardTitleClass}`}>
            {card.title}
          </h3>
          <p className={`relative mt-2 max-w-sm ${landingPremiumCardDescClass}`}>
            {card.description}
          </p>
        </div>

        <div className="feature-card-documents__visual relative z-[1] mt-4 flex min-h-0 flex-1 items-end justify-center overflow-hidden px-5 sm:px-6">
          {Mock ? <Mock active={hovered} /> : null}
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.4, ease: easePremium } }}
      className={landingShowcaseCardClass}
    >
      <span
        className="pointer-events-none absolute right-5 top-3 select-none text-[4.25rem] font-black leading-none tracking-[-0.05em] text-white/[0.04] sm:right-6 sm:top-4 sm:text-[5rem] lg:text-[5.5rem]"
        aria-hidden
      >
        {number}
      </span>

      <div
        className={`relative flex flex-1 flex-col p-5 sm:p-6 ${wide ? "lg:flex-row lg:items-stretch lg:gap-8 lg:p-7" : ""}`}
      >
        <div className={wide ? "lg:flex lg:max-w-[340px] lg:flex-col lg:justify-center" : ""}>
          <h3 className={`relative pr-14 text-base sm:text-lg lg:pr-[4.5rem] ${landingPremiumCardTitleClass}`}>
            {card.title}
          </h3>
          <p className={`relative mt-2 max-w-sm ${landingPremiumCardDescClass}`}>
            {card.description}
          </p>
        </div>

        <div
          className={`relative mt-5 flex-1 ${
            wide ? "lg:mt-0 lg:min-h-[220px]" : "min-h-[210px] sm:min-h-[240px]"
          }`}
        >
          {Mock ? <Mock active={hovered} wide={wide} /> : null}
        </div>
      </div>
    </motion.article>
  );
}
