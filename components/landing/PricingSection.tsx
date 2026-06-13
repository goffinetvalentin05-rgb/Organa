"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import { landingSectionGlowClass } from "@/components/ui/styles";
import { TEAM_PRICING, TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

type BillingCycle = "monthly" | "yearly";

const INCLUDED_FEATURES_FALLBACK = [
  "Membres",
  "Cotisations",
  "Factures",
  "Plannings",
  "Événements",
  "Buvette",
  "Sponsors",
  "Paiements",
  "Utilisateurs & accès",
  "Page publique",
  "QR codes",
  "Support",
] as const;

function BillingToggle({
  billingCycle,
  onSelect,
  monthlyLabel,
  yearlyLabel,
  savingsBadge,
  ariaLabel,
}: {
  billingCycle: BillingCycle;
  onSelect: (cycle: BillingCycle) => void;
  monthlyLabel: string;
  yearlyLabel: string;
  savingsBadge: string;
  ariaLabel: string;
}) {
  const isYearly = billingCycle === "yearly";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => onSelect("monthly")}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-3.5 sm:text-sm ${
          billingCycle === "monthly"
            ? "bg-white/[0.12] text-white shadow-[0_1px_8px_rgba(0,0,0,0.25)]"
            : "text-blue-100/45 hover:text-blue-100/70"
        }`}
      >
        {monthlyLabel}
      </button>
      <button
        type="button"
        onClick={() => onSelect("yearly")}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-3.5 sm:text-sm ${
          isYearly
            ? "bg-gradient-to-r from-[#1A23FF]/90 to-[#6366f1]/80 text-white shadow-[0_0_16px_rgba(26,35,255,0.35)]"
            : "text-blue-100/45 hover:text-blue-100/70"
        }`}
      >
        {yearlyLabel}
        {isYearly ? (
          <span className="rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:text-[10px]">
            {savingsBadge}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function IncludedFeature({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check
        className="h-3.5 w-3.5 shrink-0 text-blue-300/70"
        strokeWidth={2.5}
        aria-hidden
      />
      <span className="text-[0.8125rem] font-medium text-blue-100/80">{label}</span>
    </li>
  );
}

export default function PricingSection() {
  const { t, tList } = useI18n();
  const reduceMotion = useReducedMotion();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  const includedFeatures = tList("marketing.pricing.includedFeatures");
  const features =
    includedFeatures.length > 0 ? includedFeatures : [...INCLUDED_FEATURES_FALLBACK];

  const isYearly = billingCycle === "yearly";
  const amount = isYearly ? TEAM_PRICING.yearly.amount : TEAM_PRICING.monthly.amount;
  const priceSuffix = isYearly
    ? t("marketing.pricing.perYearSuffix")
    : t("marketing.pricing.perMonthSuffix");
  const monthlyEquivalent = isYearly ? Math.round(TEAM_PRICING.yearly.amount / 12) : null;

  const priceMotion = {
    initial: reduceMotion ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? undefined : { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: easePremium },
  };

  return (
    <section
      id="tarifs"
      className="relative isolate scroll-mt-24 overflow-hidden py-16 md:py-28"
    >
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[1100px]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p
            variants={staggerItem}
            className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80"
          >
            {t("marketing.pricing.label")}
          </motion.p>

          <motion.h2
            variants={staggerItem}
            className="mt-3 text-balance text-2xl font-black leading-[1.1] tracking-tight text-white md:text-4xl lg:text-[2.65rem]"
          >
            {t("marketing.pricing.title")}
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-blue-100/70 md:text-base"
          >
            {t("marketing.pricing.subtitle")}
          </motion.p>
        </motion.div>

        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mt-12 md:mt-16"
        >
          <div className="relative mx-auto w-full max-w-[680px] overflow-hidden px-1 sm:px-0">
            <div
              className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-[min(520px,90%)] -translate-y-1/2 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.28),rgba(99,102,241,0.1)_50%,transparent_75%)] blur-2xl"
              aria-hidden
            />

            <div className="relative z-10 pt-1 pb-2">
              <div
                className="pointer-events-none absolute inset-x-8 top-5 bottom-1 z-0 hidden rounded-2xl border border-blue-400/10 bg-gradient-to-br from-[#070b1f]/70 via-[#0d1438]/50 to-[#121a42]/60 opacity-35 md:block"
                style={{ transform: "rotate(-1.25deg) scale(0.965)" }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-4 top-3 bottom-0.5 z-[1] hidden rounded-2xl border border-blue-400/14 bg-gradient-to-br from-[#080c22]/75 via-[#0e1535]/55 to-[#131b44]/65 opacity-50 md:block"
                style={{ transform: "rotate(0.75deg) scale(0.98)" }}
                aria-hidden
              />

              <article className="landing-glass-card relative z-10 overflow-hidden rounded-2xl border border-blue-300/40 bg-gradient-to-br from-[#070b1f]/95 via-[#0d1438]/92 to-[#121a42]/95 shadow-[0_0_0_1px_rgba(147,197,253,0.16),0_24px_60px_rgba(0,0,0,0.55),0_0_80px_rgba(26,35,255,0.22)] backdrop-blur-xl">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/35 to-transparent"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-[#1A23FF]/18 via-transparent to-[#6366f1]/14"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/4 rounded-full bg-[#1A23FF]/15 blur-3xl"
                  aria-hidden
                />

                <div className="relative flex items-center justify-end px-5 py-4 sm:px-7 sm:py-5">
                  <BillingToggle
                    billingCycle={billingCycle}
                    onSelect={setBillingCycle}
                    monthlyLabel={t("marketing.pricing.monthly")}
                    yearlyLabel={t("marketing.pricing.yearly")}
                    savingsBadge={t("marketing.pricing.yearlySavingsBadge")}
                    ariaLabel={t("marketing.pricing.billingToggleAria")}
                  />
                </div>

                <div className="relative px-5 pb-7 sm:px-7 sm:pb-8">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white sm:text-xl">
                      {t("marketing.pricing.planName")}
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-blue-100/60">
                      {t("marketing.pricing.planDescription")}
                    </p>
                  </div>

                  <div className="mt-7 text-center sm:mt-8">
                    <AnimatePresence mode="wait">
                      <motion.div key={billingCycle} {...priceMotion}>
                        <div className="flex flex-wrap items-baseline justify-center gap-x-2">
                          <span className="bg-gradient-to-br from-white via-blue-50 to-blue-200/90 bg-clip-text text-4xl font-black leading-none tracking-tight text-transparent sm:text-[2.75rem]">
                            {amount}
                          </span>
                          <span className="text-lg font-semibold text-blue-200/65 sm:text-xl">
                            {priceSuffix}
                          </span>
                        </div>

                        {isYearly && monthlyEquivalent !== null ? (
                          <p className="mt-2.5 text-sm text-blue-100/55">
                            {t("marketing.pricing.monthlyEquivalent", {
                              amount: monthlyEquivalent,
                            })}
                          </p>
                        ) : (
                          <p className="mt-2.5 text-sm text-blue-100/55">
                            {t("marketing.pricing.monthlyBillingNote")}
                          </p>
                        )}

                        {isYearly ? (
                          <span className="mt-3 inline-flex rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/25">
                            {t("marketing.pricing.yearlySavingsBadge")}
                          </span>
                        ) : null}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="relative mt-7 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 sm:mt-8 sm:p-6">
                    <p className="text-center text-sm font-semibold text-white/90">
                      {t("marketing.pricing.includedLabel")}
                    </p>
                    <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:gap-x-6 sm:gap-y-3">
                      {features.map((feature) => (
                        <IncludedFeature key={feature} label={feature} />
                      ))}
                    </ul>
                  </div>

                  <div className="relative mt-7 flex flex-col items-center gap-2 sm:mt-8">
                    <LandingPrimaryButton href="/inscription" showArrow={false}>
                      {t("marketing.pricing.cta", { days: TRIAL_DURATION_DAYS })}
                    </LandingPrimaryButton>
                    <p className="text-xs text-blue-100/45">{t("marketing.pricing.footnote")}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
