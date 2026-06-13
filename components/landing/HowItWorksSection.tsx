"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, Compass, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import {
  easePremium,
  scrollReveal,
  viewportOnce,
} from "@/components/landing/landing-motion";
import { landingIconBadgeClass, landingSectionGlowClass } from "@/components/ui/styles";

type Step = { title: string; description: string };

const stepIcons: LucideIcon[] = [UserPlus, Building2, Compass];
const stepNumbers = ["01", "02", "03"];

/** Décalage vertical alterné — rythme éditorial desktop */
const desktopStagger = ["pt-0", "pt-14 md:pt-20", "pt-4 md:pt-6"];

const markerBaseClass =
  "group/marker relative z-10 flex h-10 w-[3.25rem] items-center justify-center rounded-lg border border-blue-300/25 bg-white/[0.04] text-sm font-bold tracking-wider text-white shadow-[0_0_0_1px_rgba(147,197,253,0.08),0_0_24px_rgba(26,35,255,0.18)] backdrop-blur-md transition-[border-color,box-shadow,transform] duration-300 hover:border-blue-200/45 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.2),0_0_36px_rgba(26,35,255,0.38)]";

const connectorClass =
  "w-px shrink-0 bg-gradient-to-b from-blue-200/55 via-blue-300/35 to-blue-400/20 shadow-[0_0_10px_rgba(96,165,250,0.35)]";

function TimelineMarker({
  number,
  delay,
  reduceMotion,
}: {
  number: string;
  delay: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.5, delay, ease: easePremium }}
      whileHover={reduceMotion ? undefined : { scale: 1.06, y: -2 }}
      className={markerBaseClass}
      aria-hidden
    >
      <span className="relative z-10">{number}</span>
      <span
        className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-[#1A23FF]/10 via-transparent to-[#6366f1]/10 opacity-0 transition-opacity duration-300 group-hover/marker:opacity-100"
        aria-hidden
      />
    </motion.div>
  );
}

function DesktopTimeline({
  steps,
  reduceMotion,
}: {
  steps: Step[];
  reduceMotion: boolean;
}) {
  return (
    <div className="relative mt-16 hidden lg:block">
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] h-[min(380px,42vw)] w-[min(860px,88%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.28),rgba(99,102,241,0.1)_50%,transparent_72%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-2">
        <div className="grid grid-cols-3 gap-6 xl:gap-10">
          {steps.map((step, index) => {
            const Icon = stepIcons[index] ?? UserPlus;
            const number = stepNumbers[index] ?? String(index + 1).padStart(2, "0");
            const stepDelay = 0.18 + index * 0.14;

            return (
              <div
                key={step.title}
                className={`flex flex-col items-center text-center ${desktopStagger[index] ?? ""}`}
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.65, delay: stepDelay, ease: easePremium }}
                  className="flex max-w-[17rem] flex-col items-center"
                >
                  <span className={`${landingIconBadgeClass} mb-4 h-9 w-9 opacity-80`}>
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <h3 className="text-lg font-bold text-white xl:text-xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-blue-100/68">{step.description}</p>
                </motion.div>

                <motion.div
                  initial={reduceMotion ? false : { scaleY: 0, opacity: 0 }}
                  whileInView={{ scaleY: 1, opacity: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.55, delay: stepDelay + 0.12, ease: easePremium }}
                  style={{ transformOrigin: "top" }}
                  className={`${connectorClass} my-5 min-h-[3.5rem] flex-1 xl:min-h-[4.5rem] xl:my-6`}
                  aria-hidden
                />

                <TimelineMarker number={number} delay={stepDelay + 0.22} reduceMotion={reduceMotion} />
              </div>
            );
          })}
        </div>

        <motion.div
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 1.1, delay: 0.1, ease: easePremium }}
          style={{ transformOrigin: "left center" }}
          className="pointer-events-none absolute inset-x-4 bottom-5 z-0 h-px xl:inset-x-0"
          aria-hidden
        >
          <div className="h-full w-full bg-[repeating-linear-gradient(to_right,rgba(147,197,253,0.55)_0px,rgba(147,197,253,0.55)_1px,transparent_1px,transparent_10px)] opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/25 to-transparent blur-[1px]" />
        </motion.div>
      </div>
    </div>
  );
}

function MobileTimeline({
  steps,
  reduceMotion,
}: {
  steps: Step[];
  reduceMotion: boolean;
}) {
  return (
    <div className="relative mt-12 lg:hidden">
      <motion.div
        initial={reduceMotion ? false : { scaleY: 0, opacity: 0 }}
        whileInView={{ scaleY: 1, opacity: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.9, delay: 0.08, ease: easePremium }}
        style={{ transformOrigin: "top center" }}
        className="pointer-events-none absolute bottom-4 left-[1.625rem] top-4 w-px"
        aria-hidden
      >
        <div className="h-full w-full bg-[repeating-linear-gradient(to_bottom,rgba(147,197,253,0.5)_0px,rgba(147,197,253,0.5)_1px,transparent_1px,transparent_10px)] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-300/20 to-transparent blur-[1px]" />
      </motion.div>

      <ol className="relative space-y-10 sm:space-y-12">
        {steps.map((step, index) => {
          const Icon = stepIcons[index] ?? UserPlus;
          const number = stepNumbers[index] ?? String(index + 1).padStart(2, "0");
          const stepDelay = 0.12 + index * 0.12;

          return (
            <motion.li
              key={step.title}
              initial={reduceMotion ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: stepDelay, ease: easePremium }}
              className="relative flex gap-5 sm:gap-6"
            >
              <div className="relative z-10 shrink-0 pt-0.5">
                <TimelineMarker number={number} delay={stepDelay + 0.06} reduceMotion={reduceMotion} />
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <span className={`${landingIconBadgeClass} mb-3 inline-flex h-8 w-8 opacity-75`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </span>
                <h3 className="text-base font-bold text-white sm:text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/68">{step.description}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export default function HowItWorksSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.howItWorks.steps");
  const steps = (Array.isArray(raw) ? raw : []) as Step[];

  return (
    <section id="comment-ca-marche" className="relative scroll-mt-24 overflow-x-hidden py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[1100px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            {t("marketing.howItWorks.label")}
          </p>
          <h2 className="mt-4 text-balance text-3xl font-black leading-tight text-white md:text-4xl lg:text-[2.75rem]">
            {t("marketing.howItWorks.titleLead")}{" "}
            <span className="bg-gradient-to-r from-blue-200 via-white to-indigo-200 bg-clip-text text-transparent">
              {t("marketing.howItWorks.titleAccent")}
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-blue-100/70 md:text-base">
            {t("marketing.howItWorks.subtitle")}
          </p>
        </motion.div>

        <DesktopTimeline steps={steps} reduceMotion={!!reduceMotion} />
        <MobileTimeline steps={steps} reduceMotion={!!reduceMotion} />
      </div>
    </section>
  );
}
