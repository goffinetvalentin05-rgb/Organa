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
      className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-md md:p-7 ${
        highlighted
          ? "border-blue-400/40 bg-gradient-to-b from-[#1A23FF]/20 via-white/[0.06] to-transparent shadow-[0_0_60px_rgba(26,35,255,0.25)]"
          : "border-white/[0.1] bg-white/[0.04]"
      }`}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1A23FF] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(26,35,255,0.6)]">
          {teamBadge}
        </span>
      ) : null}

      <div className="mb-5">
        <h3 className="text-lg font-black text-white">{name}</h3>
        <p className="mt-1 text-sm text-blue-100/65">{description}</p>
      </div>

      <div className="mb-6">
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

      <ul className="flex flex-1 flex-col gap-2.5">
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
      <div
        className="pointer-events-none absolute inset-x-[10%] top-1/2 h-72 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.2),transparent_70%)] blur-3xl"
        aria-hidden
      />

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
                ? "bg-gradient-to-r from-[#1A23FF] to-blue-500 shadow-[0_0_24px_rgba(26,35,255,0.5)]"
                : "bg-white/20"
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
          className="relative mt-8 grid gap-5 md:grid-cols-2 md:gap-6"
        >
          <motion.div variants={staggerItem}>
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
          <motion.div variants={staggerItem}>
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
