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
  landingGlassCardClass,
  landingSectionGlowClass,
} from "@/components/ui/styles";
import { type PlanPricing, STANDARD_PRICING, TEAM_PRICING, TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

type BillingCycle = "monthly" | "yearly";

function PlanCard({
  name,
  description,
  pricing,
  billingCycle,
  features,
  extraLabel,
  highlighted,
  teamBadge,
  perMonthSuffix,
  perYearSuffix,
  monthlyEquivalentLabel,
}: {
  name: string;
  description: string;
  pricing: PlanPricing;
  billingCycle: BillingCycle;
  features: string[];
  extraLabel?: string;
  highlighted?: boolean;
  teamBadge: string;
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
      className={`relative flex w-full flex-col p-6 md:p-7 ${
        highlighted
          ? `${landingFeaturedCardClass} md:scale-[1.03] md:shadow-[0_0_0_1px_rgba(147,197,253,0.3),0_16px_64px_rgba(0,0,0,0.55),0_0_120px_rgba(26,35,255,0.45)]`
          : landingGlassCardClass
      }`}
    >
      {highlighted ? (
        <>
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-400/30 via-transparent to-indigo-500/20 opacity-60"
            aria-hidden
          />
          <span className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#1A23FF] via-[#6366f1] to-[#1A23FF] px-4 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_0_32px_rgba(26,35,255,0.75)]">
            {teamBadge}
          </span>
        </>
      ) : null}

      <div className="relative mb-5">
        <h3 className="text-lg font-black text-white">{name}</h3>
        <p className="mt-1 text-sm text-blue-100/65">{description}</p>
      </div>

      <div className="relative mb-6">
        <div className="flex items-baseline gap-2">
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

      {extraLabel ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-300/80">
          {extraLabel}
        </p>
      ) : null}

      <ul className="relative flex flex-1 flex-col gap-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-blue-100/85">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${
                highlighted
                  ? "bg-[#1A23FF]/35 text-blue-200 ring-blue-400/35"
                  : "bg-white/10 text-blue-200 ring-white/15"
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function PricingSection() {
  const { t, tList } = useI18n();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const standardFeatures = tList("marketing.pricing.standardFeatures");
  const teamFeatures = tList("marketing.pricing.teamFeatures");

  return (
    <section id="tarifs" className="relative scroll-mt-24 py-16 md:py-24">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[1000px]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative z-10 text-center"
        >
          <motion.p
            variants={staggerItem}
            className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80"
          >
            {t("marketing.pricing.label")}
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="mt-3 text-balance text-2xl font-black text-white md:text-4xl"
          >
            {t("marketing.pricing.title")}
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-4 max-w-lg text-sm text-blue-100/75 md:text-base"
          >
            {t("marketing.pricing.subtitle", { days: TRIAL_DURATION_DAYS })}
          </motion.p>
        </motion.div>

        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <span
            className={`text-sm font-semibold transition-colors ${
              billingCycle === "monthly" ? "text-white" : "text-blue-100/50"
            }`}
          >
            {t("marketing.pricing.monthly")}
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-[#1A23FF] to-[#6366f1] shadow-[0_0_28px_rgba(26,35,255,0.55),inset_0_1px_0_rgba(255,255,255,0.15)]"
                : "border border-white/15 bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            }`}
            aria-label={t("marketing.pricing.billingToggleAria")}
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
            {t("marketing.pricing.yearly")}
          </span>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mt-8 grid gap-5 md:grid-cols-2 md:items-stretch md:gap-6"
        >
          <motion.div variants={staggerItem} className="flex">
            <PlanCard
              name={t("marketing.pricing.standardName")}
              description={t("marketing.pricing.standardDescription")}
              pricing={STANDARD_PRICING}
              billingCycle={billingCycle}
              features={standardFeatures}
              teamBadge={t("marketing.pricing.teamBadge")}
              perMonthSuffix={t("marketing.pricing.perMonthSuffix")}
              perYearSuffix={t("marketing.pricing.perYearSuffix")}
              monthlyEquivalentLabel={(amount) =>
                t("marketing.pricing.monthlyEquivalent", { amount })
              }
            />
          </motion.div>
          <motion.div variants={staggerItem} className="flex md:-mt-2">
            <PlanCard
              name={t("marketing.pricing.teamName")}
              description={t("marketing.pricing.teamDescription")}
              pricing={TEAM_PRICING}
              billingCycle={billingCycle}
              features={teamFeatures}
              extraLabel={t("marketing.pricing.teamExtraLabel")}
              highlighted
              teamBadge={t("marketing.pricing.teamBadge")}
              perMonthSuffix={t("marketing.pricing.perMonthSuffix")}
              perYearSuffix={t("marketing.pricing.perYearSuffix")}
              monthlyEquivalentLabel={(amount) =>
                t("marketing.pricing.monthlyEquivalent", { amount })
              }
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="relative mt-10 flex flex-col items-center gap-3"
        >
          <LandingPrimaryButton href="/inscription">
            {t("marketing.pricing.cta", { days: TRIAL_DURATION_DAYS })}
          </LandingPrimaryButton>
          <p className="text-xs text-blue-100/50">{t("marketing.pricing.footnote")}</p>
        </motion.div>
      </div>
    </section>
  );
}
