"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

type Step = { title: string; description: string };

export default function HowItWorksSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.howItWorks.steps");
  const steps = (Array.isArray(raw) ? raw : []) as Step[];

  return (
    <section id="comment-ca-marche" className="relative scroll-mt-24 py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-x-[15%] top-1/2 h-64 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.14),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[920px]">
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

        <div className="relative mt-12 md:mt-16">
          <div
            className="absolute left-6 top-6 bottom-6 w-px md:left-1/2 md:-translate-x-px"
            aria-hidden
          >
            <div className="h-full w-full bg-gradient-to-b from-transparent via-blue-500/25 to-transparent" />
            {!reduceMotion ? (
              <motion.div
                className="absolute left-0 top-0 w-full bg-gradient-to-b from-[#1A23FF] via-[#93c5fd] to-[#1A23FF] opacity-60"
                initial={{ height: "0%" }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1.8, ease: easePremium }}
              />
            ) : null}
          </div>

          <div className="space-y-10 md:space-y-12">
            {steps.map((step, i) => (
              <StepRow
                key={step.title}
                step={step}
                num={String(i + 1).padStart(2, "0")}
                index={i}
                reduceMotion={!!reduceMotion}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: easePremium }}
          className="mt-12 flex justify-center md:mt-14"
        >
          <LandingPrimaryButton href="/inscription">{t("marketing.howItWorks.cta")}</LandingPrimaryButton>
        </motion.div>
      </div>
    </section>
  );
}

function StepRow({
  step,
  num,
  index,
  reduceMotion,
}: {
  step: Step;
  num: string;
  index: number;
  reduceMotion: boolean;
}) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: easePremium }}
      className={`relative flex gap-6 md:gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
    >
      <div className="flex w-12 shrink-0 flex-col items-center md:absolute md:left-1/2 md:w-auto md:-translate-x-1/2">
        <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/35 bg-[#1A23FF]/25 text-sm font-black text-white shadow-[0_0_24px_rgba(26,35,255,0.4)]">
          {num}
        </span>
      </div>
      <div
        className={`min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-md md:max-w-[calc(50%-3rem)] ${
          isLeft ? "md:mr-auto md:pr-12" : "md:ml-auto md:pl-12"
        }`}
      >
        <h3 className="text-lg font-bold text-white">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{step.description}</p>
      </div>
    </motion.div>
  );
}
