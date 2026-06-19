"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  Handshake,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import {
  landingGlassCardClass,
  landingInnerPanelClass,
  landingSectionGlowClass,
} from "@/components/ui/styles";

type FeatureCard = { id: string; title: string; description: string };

const featureIcons: Record<string, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  evenements: CalendarDays,
  sponsors: Handshake,
  documents: FolderOpen,
  acces: UserCog,
};

export default function FeaturesSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.modules.gridCards");
  const cards = (Array.isArray(raw) ? raw : []) as FeatureCard[];

  return (
    <section id="modules" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-[8%] top-[12%] h-[min(420px,50vh)] rounded-full bg-[radial-gradient(ellipse,rgba(99,102,241,0.18),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1200px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12"
        >
          <div className="max-w-2xl lg:max-w-[42rem]">
            <h2 className="text-balance text-[1.75rem] font-black leading-[1.12] tracking-[-0.03em] text-white sm:text-3xl md:text-4xl lg:text-[2.65rem]">
              <span className="block">{t("marketing.modules.titleLine1")}</span>
              <span className="block">{t("marketing.modules.titleLine2")}</span>
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-blue-100/75 md:mt-5 md:text-base md:leading-[1.7]">
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
          className="mt-12 grid grid-cols-1 gap-4 sm:gap-5 md:mt-16 md:grid-cols-2 md:gap-5 lg:gap-6"
        >
          {cards.map((card, index) => {
            const Icon = featureIcons[card.id] ?? FileText;

            return (
              <motion.div key={card.id} variants={staggerItem}>
                <FeatureCardItem
                  card={card}
                  Icon={Icon}
                  index={index}
                  reduceMotion={!!reduceMotion}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCardItem({
  card,
  Icon,
  index,
  reduceMotion,
}: {
  card: FeatureCard;
  Icon: LucideIcon;
  index: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.28, ease: easePremium } }}
      className={`${landingGlassCardClass} group flex h-full min-h-[280px] flex-col overflow-hidden p-5 sm:min-h-[300px] sm:p-6 md:p-7`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.28),transparent_68%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(26,35,255,0.12),transparent_55%)] opacity-80"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A23FF]/55 to-[#6366f1]/35 text-blue-100 shadow-[0_0_24px_rgba(26,35,255,0.35)] ring-1 ring-blue-300/35 transition duration-300 group-hover:shadow-[0_0_32px_rgba(26,35,255,0.5)]">
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300/70">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-tight text-white sm:text-xl md:text-[1.35rem]">
          {card.title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100/68 md:text-[0.9375rem]">
          {card.description}
        </p>
      </div>

      <div className={`${landingInnerPanelClass} relative mt-6 h-[72px] overflow-hidden sm:mt-7 sm:h-[80px]`}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(96,165,250,0.9)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.9)_1px,transparent_1px)] [background-size:18px_18px]"
          aria-hidden
        />
        <Icon
          className="pointer-events-none absolute bottom-3 right-3 h-10 w-10 text-[#1A23FF]/20 transition-colors duration-300 group-hover:text-[#1A23FF]/30 sm:h-11 sm:w-11"
          strokeWidth={1.25}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-center gap-2 px-1">
          {[0.72, 0.48, 0.58].map((w, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-gradient-to-r from-[#1A23FF]/25 to-[#93c5fd]/15"
              style={{ width: `${w * 100}%` }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </motion.article>
  );
}
