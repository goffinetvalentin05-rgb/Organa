"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
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
import { landingSectionGlowClass } from "@/components/ui/styles";

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

const showcaseCardClass =
  "group/card relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-blue-400/14 bg-[#070d1f]/60 shadow-[0_0_0_1px_rgba(147,197,253,0.05),0_20px_64px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl transition-[border-color,box-shadow,transform] duration-[550ms] ease-out hover:-translate-y-1.5 hover:border-blue-300/22 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.12),0_28px_80px_rgba(0,0,0,0.52),0_0_80px_rgba(26,35,255,0.18),0_0_36px_rgba(34,211,238,0.07),inset_0_1px_0_rgba(255,255,255,0.09)]";

export default function FeaturesSection() {
  const { t, locale } = useI18n();
  const raw = getTranslationValue(locale, "marketing.modules.gridCards");
  const cards = (Array.isArray(raw) ? raw : []) as FeatureCard[];

  return (
    <section id="modules" className="relative scroll-mt-24 pb-16 pt-4 md:pb-28 md:pt-8">
      <div className={landingSectionGlowClass} aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-[4%] top-[6%] h-[min(560px,60vh)] rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.22),rgba(34,211,238,0.05)_42%,transparent_74%)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[10%] top-[42%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.11),transparent_68%)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-[18%] h-[55%] opacity-[0.028] [background-image:radial-gradient(rgba(147,197,253,0.9)_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1240px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12"
        >
          <div className="max-w-2xl lg:max-w-[44rem]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300/80">
              {t("marketing.modules.label")}
            </p>
            <h2 className="mt-3 text-balance text-[1.75rem] font-black leading-[1.08] tracking-[-0.03em] text-white sm:text-3xl md:text-4xl lg:text-[2.65rem]">
              <span className="block">{t("marketing.modules.titleLine1")}</span>
              <span className="block">{t("marketing.modules.titleLine2")}</span>
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-blue-100/72 md:mt-5 md:text-base md:leading-[1.7]">
              {t("marketing.modules.subtitle")}
            </p>
          </div>

          <div className="shrink-0 lg:pb-1">
            <LandingPrimaryButton href="/inscription">{t("marketing.modules.cta")}</LandingPrimaryButton>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 grid grid-cols-1 gap-4 sm:gap-5 md:mt-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-5"
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

  return (
    <motion.article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.4, ease: easePremium } }}
      className={showcaseCardClass}
    >
      {/* Base gradient — profondeur */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#121d42]/55 via-[#0a1028]/75 to-[#050914]/90"
        aria-hidden
      />
      {/* Halo interne haut */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(26,35,255,0.18),transparent_65%)]"
        aria-hidden
      />
      {/* Reflet cyan bas */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_80%_110%,rgba(34,211,238,0.07),transparent_60%)] opacity-80 transition-opacity duration-500 group-hover/card:opacity-100"
        aria-hidden
      />
      {/* Lueur diagonale subtile */}
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-white/[0.03] to-transparent opacity-40"
        aria-hidden
      />
      {/* Glow externe hover */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.32),transparent_65%)] opacity-30 blur-3xl transition-opacity duration-[550ms] group-hover/card:opacity-55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-[550ms] group-hover/card:opacity-80"
        aria-hidden
      />
      {/* Rim light haut */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/20 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
        aria-hidden
      />

      <span
        className="pointer-events-none absolute right-5 top-3 select-none text-[4.25rem] font-black leading-none tracking-[-0.05em] mix-blend-soft-light sm:right-6 sm:top-4 sm:text-[5rem] lg:text-[5.5rem]"
        style={{
          WebkitTextStroke: "0.75px rgba(96,165,250,0.08)",
          color: "rgba(147,197,253,0.07)",
          backgroundImage:
            "linear-gradient(160deg, rgba(147,197,253,0.14) 0%, rgba(34,211,238,0.05) 40%, transparent 75%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
        aria-hidden
      >
        {number}
      </span>

      <div
        className={`relative flex flex-1 flex-col p-5 sm:p-6 ${wide ? "lg:flex-row lg:items-stretch lg:gap-8 lg:p-7" : ""}`}
      >
        <div className={wide ? "lg:flex lg:max-w-[340px] lg:flex-col lg:justify-center" : ""}>
          <h3 className="relative pr-14 text-base font-bold tracking-tight text-white sm:text-lg lg:pr-[4.5rem]">
            {card.title}
          </h3>
          <p className="relative mt-2 max-w-sm text-[13px] leading-relaxed text-blue-100/55 sm:text-sm">
            {card.description}
          </p>
        </div>

        <div className={`relative mt-5 flex-1 ${wide ? "lg:mt-0 lg:min-h-[220px]" : "min-h-[210px] sm:min-h-[230px]"}`}>
          {Mock ? <Mock active={hovered} wide={wide} /> : null}
        </div>
      </div>
    </motion.article>
  );
}
