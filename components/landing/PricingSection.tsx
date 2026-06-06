"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import {
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import {
  landingFeaturedCardClass,
  landingSectionGlowClass,
} from "@/components/ui/styles";
import { type PlanPricing, TEAM_PRICING, TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

type BillingCycle = "monthly" | "yearly";

function PlanCard({
  name,
  description,
  pricing,
  billingCycle,
  features,
  perMonthSuffix,
  perYearSuffix,
  monthlyEquivalentLabel,
}: {
  name: string;
  description: string;
  pricing: PlanPricing;
  billingCycle: BillingCycle;
  features: string[];
  perMonthSuffix: string;
  perYearSuffix: string;
  monthlyEquivalentLabel: (amount: number) => string;
}) {
  const amount =
    billingCycle === "yearly" ? pricing.yearly.amount : pricing.monthly.amount;
  const suffix = billingCycle === "yearly" ? perYearSuffix : perMonthSuffix;
  const monthlyEquivalent =
    billingCycle === "yearly" ? Math.round(pricing.yearly.amount / 12) : null;

  return (
    <article
      className={`relative flex w-full flex-col p-6 md:p-8 ${landingFeaturedCardClass}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-400/30 via-transparent to-indigo-500/20 opacity-60"
        aria-hidden
      />

      <div className="relative mb-5 text-center">
        <h3 className="text-lg font-black text-white">{name}</h3>
        <p className="mt-1 text-sm text-blue-100/65">{description}</p>
      </div>

      <div className="relative mb-6 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-black text-white md:text-5xl">{amount}</span>
          <span className="text-base text-blue-100/70">{suffix}</span>
        </div>
        {monthlyEquivalent !== null ? (
          <p className="mt-1.5 text-sm text-blue-100/60">{monthlyEquivalentLabel(monthlyEquivalent)}</p>
        ) : null}
        {billingCycle === "yearly" && "savings" in pricing.yearly ? (
          <span className="mt-3 inline-block rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {pricing.yearly.savings}
          </span>
        ) : null}
      </div>

      <ul className="relative flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-blue-100/85">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/35 text-blue-200 ring-1 ring-blue-400/35">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}

function BillingToggle({
  billingCycle,
  onToggle,
  monthlyLabel,
  yearlyLabel,
  ariaLabel,
}: {
  billingCycle: BillingCycle;
  onToggle: () => void;
  monthlyLabel: string;
  yearlyLabel: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 lg:justify-end">
      <span
        className={`text-sm font-semibold transition-colors ${
          billingCycle === "monthly" ? "text-white" : "text-blue-100/50"
        }`}
      >
        {monthlyLabel}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-8 w-14 rounded-full transition-colors ${
          billingCycle === "yearly"
            ? "bg-gradient-to-r from-[#1A23FF] to-[#6366f1] shadow-[0_0_28px_rgba(26,35,255,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]"
            : "border border-white/15 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        }`}
        aria-label={ariaLabel}
      >
        <span
          className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
            billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-semibold transition-colors ${
          billingCycle === "yearly" ? "text-white" : "text-blue-100/50"
        }`}
      >
        {yearlyLabel}
      </span>
    </div>
  );
}

export default function PricingSection() {
  const { t, tList } = useI18n();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const allFeatures = [
    ...tList("marketing.pricing.standardFeatures"),
    ...tList("marketing.pricing.teamFeatures"),
  ];
  const highlights = tList("marketing.pricing.highlights");

  return (
    <section id="tarifs" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">
          {/* Colonne gauche — argumentaire */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative z-10 text-left"
          >
            <motion.p
              variants={staggerItem}
              className="inline-flex rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200/90"
            >
              {t("marketing.pricing.label")}
            </motion.p>

            <motion.h2
              variants={staggerItem}
              className="mt-5 text-balance text-3xl font-black leading-[1.1] tracking-tight text-white md:text-4xl lg:text-[2.65rem]"
            >
              {t("marketing.pricing.title")}
            </motion.h2>

            <motion.p
              variants={staggerItem}
              className="mt-4 max-w-xl text-base font-medium leading-relaxed text-blue-50/90 md:text-lg"
            >
              {t("marketing.pricing.headline")}
            </motion.p>

            <motion.p
              variants={staggerItem}
              className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/70 md:text-base"
            >
              {t("marketing.pricing.body")}
            </motion.p>

            <motion.ul variants={staggerItem} className="mt-7 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-blue-50/90 md:text-[0.95rem]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </motion.ul>

            <motion.p
              variants={staggerItem}
              className="mt-7 max-w-xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-blue-100/75 md:text-[0.95rem]"
            >
              {t("marketing.pricing.reassurance")}
            </motion.p>

            <motion.div variants={staggerItem} className="mt-8 flex flex-col items-start gap-3">
              <LandingPrimaryButton href="/inscription">
                {t("marketing.pricing.cta", { days: TRIAL_DURATION_DAYS })}
              </LandingPrimaryButton>
              <p className="text-xs text-blue-100/45">{t("marketing.pricing.footnote")}</p>
            </motion.div>
          </motion.div>

          {/* Colonne droite — carte tarifaire */}
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative z-10 flex flex-col gap-5 lg:translate-x-2 xl:translate-x-4"
          >
            <BillingToggle
              billingCycle={billingCycle}
              onToggle={() =>
                setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
              }
              monthlyLabel={t("marketing.pricing.monthly")}
              yearlyLabel={t("marketing.pricing.yearly")}
              ariaLabel={t("marketing.pricing.billingToggleAria")}
            />

            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-6 rounded-3xl bg-[#1A23FF]/20 blur-3xl"
                aria-hidden
              />
              <PlanCard
                name={t("marketing.pricing.planName")}
                description={t("marketing.pricing.planDescription")}
                pricing={TEAM_PRICING}
                billingCycle={billingCycle}
                features={allFeatures}
                perMonthSuffix={t("marketing.pricing.perMonthSuffix")}
                perYearSuffix={t("marketing.pricing.perYearSuffix")}
                monthlyEquivalentLabel={(amount) =>
                  t("marketing.pricing.monthlyEquivalent", { amount })
                }
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
