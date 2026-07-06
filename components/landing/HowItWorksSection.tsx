"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Building2, ChevronDown, Layers3, LayoutDashboard, UserPlus } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import {
  landingIconBadgeClass,
  landingPremiumCardCompactClass,
  landingPremiumCardDescClass,
  landingPremiumCardTitleClass,
} from "@/components/ui/styles";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";
import { useId } from "react";

type Step = { title: string; description: string };

type StepMeta = {
  icon: LucideIcon;
  number: string;
  layout: string;
  connector: "right" | "left";
};

const stepMeta: StepMeta[] = [
  {
    icon: Building2,
    number: "01",
    layout: "w-full sm:max-w-[96%] sm:self-start sm:-rotate-[0.45deg]",
    connector: "right",
  },
  {
    icon: UserPlus,
    number: "02",
    layout: "w-full sm:max-w-[93%] sm:self-end sm:rotate-[0.55deg]",
    connector: "left",
  },
  {
    icon: Layers3,
    number: "03",
    layout: "w-full sm:max-w-[95%] sm:ml-[2%] sm:self-start sm:-rotate-[0.25deg]",
    connector: "right",
  },
  {
    icon: LayoutDashboard,
    number: "04",
    layout: "w-full sm:max-w-[91%] sm:self-end sm:rotate-[0.65deg]",
    connector: "left",
  },
];

function FlowBar({
  step,
  meta,
  index,
  reduceMotion,
}: {
  step: Step;
  meta: StepMeta;
  index: number;
  reduceMotion: boolean;
}) {
  const Icon = meta.icon;
  const delay = 0.12 + index * 0.11;

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, x: index % 2 === 0 ? -28 : 28, y: 16 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.65, delay, ease: easePremium }}
      className={`group/bar relative list-none ${meta.layout}`}
    >
      <motion.div
        whileHover={reduceMotion ? undefined : { y: -3, scale: 1.008, transition: { duration: 0.3, ease: easePremium } }}
        className={`${landingPremiumCardCompactClass} flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5 md:py-[1.35rem]`}
      >
        <div className="relative shrink-0">
          <span className={`${landingIconBadgeClass} h-11 w-11 sm:h-12 sm:w-12 sm:rounded-2xl`}>
            <Icon className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" strokeWidth={2} aria-hidden />
          </span>
        </div>

        <div className="relative min-w-0 flex-1">
          <h3 className={`text-[15px] sm:text-base md:text-[1.05rem] ${landingPremiumCardTitleClass}`}>
            {step.title}
          </h3>
          <p className={`mt-1 sm:mt-1.5 md:leading-[1.6] ${landingPremiumCardDescClass}`}>
            {step.description}
          </p>
        </div>

        <span
          className="pointer-events-none shrink-0 select-none pr-1 text-3xl font-black tracking-[-0.05em] text-white/[0.05] sm:text-4xl lg:text-[2.75rem]"
          aria-hidden
        >
          {meta.number}
        </span>
      </motion.div>
    </motion.li>
  );
}

function FlowConnector({
  direction,
  reduceMotion,
  delay,
}: {
  direction: "right" | "left";
  reduceMotion: boolean;
  delay: number;
}) {
  const gradientId = useId().replace(/:/g, "");
  const path =
    direction === "right"
      ? "M 18 4 C 42 4, 52 18, 72 28"
      : "M 72 4 C 48 4, 38 18, 18 28";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.5, delay, ease: easePremium }}
      className={`relative h-8 w-full max-w-[88%] sm:h-9 ${direction === "right" ? "self-start ml-[8%]" : "self-end mr-[8%]"}`}
      aria-hidden
    >
      <svg viewBox="0 0 90 32" className="h-full w-full" fill="none" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(147,197,253,0.3)" />
            <stop offset="50%" stopColor="rgba(37,99,235,0.5)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.6)" />
          </linearGradient>
        </defs>
        <motion.path
          d={path}
          stroke={`url(#${gradientId})`}
          strokeWidth="1.75"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.75, delay: delay + 0.08, ease: easePremium }}
        />
        <motion.path
          d={direction === "right" ? "M 66 22 L 74 28 L 66 34" : "M 24 22 L 16 28 L 24 34"}
          stroke={`url(#${gradientId})`}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.45, delay: delay + 0.28, ease: easePremium }}
        />
      </svg>
    </motion.div>
  );
}

function MobileConnector({ reduceMotion, delay }: { reduceMotion: boolean; delay: number }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scaleY: 0.5 }}
      whileInView={{ opacity: 1, scaleY: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.45, delay, ease: easePremium }}
      className="flex flex-col items-center py-1 sm:hidden"
      aria-hidden
    >
      <div className="h-4 w-px bg-gradient-to-b from-blue-300/35 to-sky-300/50" />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <ChevronDown className="h-4 w-4 text-sky-400/75" strokeWidth={2.5} />
      </motion.div>
      <div className="h-3 w-px bg-gradient-to-b from-sky-300/50 to-blue-300/15" />
    </motion.div>
  );
}

function ProcessFlow({ steps, reduceMotion }: { steps: Step[]; reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.75, delay: 0.08, ease: easePremium }}
      className="relative mt-12 md:mt-14"
    >
      <ol className="relative flex flex-col gap-0">
        {steps.map((step, index) => {
          const meta = stepMeta[index] ?? stepMeta[0]!;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.title}>
              <FlowBar step={step} meta={meta} index={index} reduceMotion={reduceMotion} />
              {!isLast ? (
                <>
                  <div className="hidden sm:block">
                    <FlowConnector
                      direction={meta.connector}
                      reduceMotion={reduceMotion}
                      delay={0.2 + index * 0.12}
                    />
                  </div>
                  <MobileConnector reduceMotion={reduceMotion} delay={0.18 + index * 0.1} />
                </>
              ) : null}
            </div>
          );
        })}
      </ol>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.howItWorks.steps");
  const steps = (Array.isArray(raw) ? raw : []) as Step[];

  return (
    <section id="comment-ca-marche" className={`${landingSectionShellClass()} overflow-x-hidden`}>
      <div className="relative mx-auto w-[94%] max-w-[920px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <LandingSectionIntro
            layout="centered"
            label={t("marketing.howItWorks.label")}
            title={t("marketing.howItWorks.title")}
            description={t("marketing.howItWorks.subtitle")}
          />
        </motion.div>

        <div className="landing-section-content">
          <ProcessFlow steps={steps} reduceMotion={!!reduceMotion} />
        </div>
      </div>
    </section>
  );
}
