"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  FileSpreadsheet,
  Layers,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import {
  easePremium,
  scrollReveal,
  viewportOnce,
} from "@/components/landing/landing-motion";
import {
  landingGlassCardClass,
  landingIconBadgeClass,
  landingSectionGlowClass,
} from "@/components/ui/styles";

const cardIcons: LucideIcon[] = [
  AlertCircle,
  FileSpreadsheet,
  Users,
  CalendarDays,
  Layers,
  MonitorSmartphone,
];

type ProblemCard = { title: string; description: string };

const cardRevealLeft = {
  hidden: { opacity: 0, x: -40, y: 20 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: easePremium },
  },
};

const cardRevealRight = {
  hidden: { opacity: 0, x: 40, y: 20 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.6, ease: easePremium },
  },
};

export default function ProblemSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.problem.cards");
  const cards = (Array.isArray(raw) ? raw : []) as ProblemCard[];

  return (
    <section id="probleme" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[920px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-2xl font-black text-white md:text-4xl lg:text-[2.75rem]">
            {t("marketing.problem.title")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/75 md:text-base">
            {t("marketing.problem.subtitle")}
          </p>
        </motion.div>

        {/* Flux zigzag — timeline centrale + cartes alternées */}
        <div className="relative mt-14 md:mt-20">
          {/* Ligne centrale animée */}
          <div
            className="absolute bottom-8 left-6 top-8 w-px md:left-1/2 md:-translate-x-px"
            aria-hidden
          >
            <div className="h-full w-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
            {!reduceMotion ? (
              <motion.div
                className="absolute left-0 top-0 w-full bg-gradient-to-b from-[#1A23FF] via-[#93c5fd] to-[#6366f1] opacity-50"
                initial={{ height: "0%" }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 2, ease: easePremium }}
              />
            ) : null}
          </div>

          <div className="relative space-y-6 md:space-y-8">
            {cards.map((card, index) => {
              const Icon = cardIcons[index] ?? AlertCircle;
              const isLeft = index % 2 === 0;

              return (
                <ProblemCardRow
                  key={card.title}
                  card={card}
                  Icon={Icon}
                  index={index}
                  isLeft={isLeft}
                  reduceMotion={!!reduceMotion}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemCardRow({
  card,
  Icon,
  index,
  isLeft,
  reduceMotion,
}: {
  card: ProblemCard;
  Icon: LucideIcon;
  index: number;
  isLeft: boolean;
  reduceMotion: boolean;
}) {
  const variants = isLeft ? cardRevealLeft : cardRevealRight;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-12%" }}
      variants={reduceMotion ? scrollReveal : variants}
      className={`relative flex items-stretch gap-5 md:gap-0 ${
        isLeft ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {/* Point sur la timeline */}
      <div className="flex w-12 shrink-0 flex-col items-center md:absolute md:left-1/2 md:w-auto md:-translate-x-1/2">
        <motion.span
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.45, delay: index * 0.1 + 0.15, ease: easePremium }}
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/35 bg-gradient-to-br from-[#1A23FF]/40 to-[#6366f1]/25 shadow-[0_0_24px_rgba(26,35,255,0.35)] backdrop-blur-sm"
        >
          <span className="text-[11px] font-black tabular-nums text-white/90">
            {String(index + 1).padStart(2, "0")}
          </span>
        </motion.span>
      </div>

      {/* Carte */}
      <motion.article
        whileHover={reduceMotion ? undefined : { y: -5, transition: { duration: 0.25 } }}
        className={`${landingGlassCardClass} min-w-0 flex-1 p-5 md:max-w-[calc(50%-2.75rem)] md:p-6 ${
          isLeft ? "md:mr-auto md:pr-10" : "md:ml-auto md:pl-10"
        }`}
      >
        <div className="flex items-start gap-4">
          <span className={landingIconBadgeClass}>
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white md:text-lg">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{card.description}</p>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}
