"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LayoutDashboard, ToggleRight, UserPlus, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import {
  easePremium,
  scrollReveal,
  viewportOnce,
} from "@/components/landing/landing-motion";
import { landingSectionGlowClass, landingSectionShellClass } from "@/components/ui/styles";

type Step = { title: string; description: string };

const stepIcons: LucideIcon[] = [Building2, UserPlus, ToggleRight, LayoutDashboard];

export default function HowItWorksSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.howItWorks.steps");
  const steps = (Array.isArray(raw) ? raw : []) as Step[];

  return (
    <section id="comment-ca-marche" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[1100px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            {t("marketing.howItWorks.label")}
          </p>
          <h2 className="mt-3 text-2xl font-black text-white md:text-4xl">
            {t("marketing.howItWorks.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-blue-100/70 md:text-base">
            {t("marketing.howItWorks.subtitle")}
          </p>
        </motion.div>

        {/* Parcours onboarding — progression horizontale */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className={`${landingSectionShellClass} relative mt-12 overflow-visible p-6 md:mt-14 md:p-8 lg:p-10`}
        >
          {/* Ligne de progression — du centre étape 1 au centre étape 4 */}
          <div
            className="pointer-events-none absolute left-[12.5%] top-[3.25rem] hidden h-0.5 w-[75%] lg:block"
            aria-hidden
          >
            <div className="h-full w-full rounded-full bg-white/10" />
            {!reduceMotion ? (
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#1A23FF] via-[#93c5fd] to-[#6366f1]"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 1.6, ease: easePremium, delay: 0.2 }}
              />
            ) : (
              <div className="absolute left-0 top-0 h-full w-full rounded-full bg-gradient-to-r from-[#1A23FF] via-[#93c5fd] to-[#6366f1] opacity-60" />
            )}
          </div>

          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {steps.map((step, i) => {
              const Icon = stepIcons[i] ?? Building2;
              const isLast = i === steps.length - 1;

              return (
                <SetupStep
                  key={step.title}
                  step={step}
                  index={i}
                  Icon={Icon}
                  isLast={isLast}
                  reduceMotion={!!reduceMotion}
                />
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: easePremium }}
          className="mt-10 flex justify-center md:mt-12"
        >
          <LandingPrimaryButton href="/inscription">{t("marketing.howItWorks.cta")}</LandingPrimaryButton>
        </motion.div>
      </div>
    </section>
  );
}

function SetupStep({
  step,
  index,
  Icon,
  isLast,
  reduceMotion,
}: {
  step: Step;
  index: number;
  Icon: LucideIcon;
  isLast: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: easePremium }}
      className="relative flex flex-col items-center text-center"
    >
      {/* Connecteur mobile / tablette — vertical entre les étapes */}
      {!isLast ? (
        <div
          className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-px -translate-x-1/2 bg-gradient-to-b from-blue-400/40 to-transparent sm:hidden"
          aria-hidden
        />
      ) : null}
      {!isLast ? (
        <div
          className="pointer-events-none absolute -right-4 top-8 hidden h-px w-8 bg-gradient-to-r from-blue-400/40 to-transparent sm:block lg:hidden"
          aria-hidden
        />
      ) : null}

      {/* Numéro + icône */}
      <div className="relative mb-4 flex flex-col items-center">
        <motion.span
          initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: index * 0.1, ease: easePremium }}
          className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-blue-300/40 bg-gradient-to-br from-[#1A23FF] to-[#6366f1] text-sm font-black text-white shadow-[0_0_28px_rgba(26,35,255,0.5)]"
        >
          {index + 1}
        </motion.span>
        <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A23FF]/20 text-blue-300 ring-1 ring-[#1A23FF]/30">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
      </div>

      {/* Contenu */}
      <h3 className="text-base font-bold text-white md:text-[0.9375rem] lg:text-base">
        {step.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{step.description}</p>

      {/* Flèche suivante — desktop entre les colonnes */}
      {!isLast ? (
        <ArrowRight
          className="pointer-events-none absolute -right-3 top-8 hidden h-4 w-4 text-blue-400/35 lg:block"
          aria-hidden
        />
      ) : null}
    </motion.div>
  );
}
