"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Building2, ChevronDown, Layers3, LayoutDashboard, UserPlus } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";
import { useId } from "react";

type Step = { title: string; description: string };

type StepMeta = {
  icon: LucideIcon;
  number: string;
  barGradient: string;
  glowColor: string;
  layout: string;
  connector: "right" | "left";
};

const stepMeta: StepMeta[] = [
  {
    icon: Building2,
    number: "01",
    barGradient: "from-[#0c1230]/95 via-[#141f48]/90 to-[#1A23FF]/40",
    glowColor: "rgba(26,35,255,0.28)",
    layout: "w-full sm:max-w-[96%] sm:self-start sm:-rotate-[0.45deg]",
    connector: "right",
  },
  {
    icon: UserPlus,
    number: "02",
    barGradient: "from-[#0a1028]/95 via-[#161e4a]/90 to-[#4338ca]/35",
    glowColor: "rgba(99,102,241,0.26)",
    layout: "w-full sm:max-w-[93%] sm:self-end sm:rotate-[0.55deg]",
    connector: "left",
  },
  {
    icon: Layers3,
    number: "03",
    barGradient: "from-[#080e24]/95 via-[#121a42]/90 to-[#1A23FF]/45",
    glowColor: "rgba(26,35,255,0.32)",
    layout: "w-full sm:max-w-[95%] sm:ml-[2%] sm:self-start sm:-rotate-[0.25deg]",
    connector: "right",
  },
  {
    icon: LayoutDashboard,
    number: "04",
    barGradient: "from-[#060b1c]/95 via-[#0f1640]/90 to-[#1A23FF]/55",
    glowColor: "rgba(34,211,238,0.22)",
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
      style={{ ["--bar-glow" as string]: meta.glowColor }}
    >
      <motion.div
        whileHover={reduceMotion ? undefined : { y: -3, scale: 1.008, transition: { duration: 0.3, ease: easePremium } }}
        className={`relative flex items-center gap-4 overflow-hidden rounded-[1.35rem] border border-white/[0.09] bg-gradient-to-r ${meta.barGradient} px-4 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.38),0_0_48px_var(--bar-glow),inset_0_1px_0_rgba(255,255,255,0.11)] backdrop-blur-xl transition-[border-color,box-shadow] duration-400 sm:gap-5 sm:px-6 sm:py-5 md:py-[1.35rem] group-hover/bar:border-blue-200/22 group-hover/bar:shadow-[0_14px_48px_rgba(0,0,0,0.42),0_0_72px_var(--bar-glow),inset_0_1px_0_rgba(255,255,255,0.14)]`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_120%_at_0%_50%,rgba(255,255,255,0.06),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#1A23FF]/15 to-transparent opacity-70 transition-opacity duration-400 group-hover/bar:opacity-100"
          aria-hidden
        />

        <div className="relative shrink-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200/20 bg-gradient-to-br from-[#1A23FF]/55 to-[#6366f1]/35 text-white shadow-[0_0_28px_rgba(26,35,255,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] sm:h-12 sm:w-12 sm:rounded-2xl">
            <Icon className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" strokeWidth={2} aria-hidden />
          </span>
        </div>

        <div className="relative min-w-0 flex-1">
          <h3 className="text-[15px] font-bold tracking-tight text-white sm:text-base md:text-[1.05rem]">
            {step.title}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-blue-100/58 sm:mt-1.5 sm:text-sm md:leading-[1.6]">
            {step.description}
          </p>
        </div>

        <span
          className="pointer-events-none shrink-0 select-none pr-1 text-3xl font-black tracking-[-0.05em] text-blue-200/[0.07] sm:text-4xl lg:text-[2.75rem]"
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
            <stop offset="0%" stopColor="rgba(96,165,250,0.25)" />
            <stop offset="50%" stopColor="rgba(129,140,248,0.55)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.65)" />
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
      <div className="h-4 w-px bg-gradient-to-b from-blue-300/35 to-cyan-300/50" />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, 3, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay }}
      >
        <ChevronDown className="h-4 w-4 text-cyan-300/75" strokeWidth={2.5} />
      </motion.div>
      <div className="h-3 w-px bg-gradient-to-b from-cyan-300/50 to-blue-300/15" />
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
    <section id="comment-ca-marche" className="relative scroll-mt-24 overflow-x-hidden py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-x-[5%] top-[10%] h-[min(480px,52vh)] rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.18),rgba(34,211,238,0.05)_45%,transparent_72%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[920px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300/80">
            {t("marketing.howItWorks.label")}
          </p>
          <h2 className="mt-3 text-balance text-[1.75rem] font-black leading-[1.1] tracking-[-0.03em] text-white sm:text-3xl md:text-4xl">
            {t("marketing.howItWorks.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-blue-100/68 md:mt-5 md:text-base md:leading-[1.7]">
            {t("marketing.howItWorks.subtitle")}
          </p>
        </motion.div>

        <ProcessFlow steps={steps} reduceMotion={!!reduceMotion} />
      </div>
    </section>
  );
}
