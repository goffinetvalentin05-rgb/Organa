"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import {
  landingPremiumCardClass,
  landingPremiumCardDescClass,
  landingPremiumCardTitleClass,
} from "@/components/ui/styles";
import { PRICING, TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

function PlanFeature({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/25 bg-[#2563EB]/15">
        <Check className="h-3 w-3 text-[#67E8F9]" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-sm font-medium text-[rgba(226,232,240,0.88)]">{label}</span>
    </li>
  );
}

export default function PricingSection() {
  const { t, tList } = useI18n();
  const planFeatures = tList("marketing.pricingPage.planFeatures");
  const monthlyEquivalent = Math.round((PRICING.yearly.amount / 12) * 100) / 100;

  return (
    <section id="tarifs" className={`${landingSectionShellClass()} scroll-mt-28`}>
      <div className="landing-container landing-container--md relative">
        <LandingSectionIntro
          layout="centered"
          label={t("marketing.pricing.label")}
          title={
            <>
              {t("marketing.pricingPage.headerTitleLine1")}
              <br />
              {t("marketing.pricingPage.headerTitleLine2")}
            </>
          }
          description={t("marketing.pricing.subtitle")}
        />

        <motion.article
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className={`${landingPremiumCardClass} landing-obillz-gradient landing-section-content mx-auto mt-10 w-full max-w-[600px] rounded-[1.5rem] px-4 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_90px_rgba(15,23,42,0.18)] hover:translate-y-0 sm:mt-14 sm:rounded-[2rem] sm:px-10 sm:py-10`}
        >
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-white/14 bg-white/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[rgba(226,232,240,0.75)] sm:text-[11px]">
              {t("marketing.pricingPage.planBadge")}
            </span>
            <h3 className={`mt-4 text-xl sm:text-2xl ${landingPremiumCardTitleClass}`}>
              {t("marketing.pricing.planName")}
            </h3>
            <p className={`mx-auto mt-2 max-w-md ${landingPremiumCardDescClass}`}>
              {t("marketing.pricing.planDescription")}
            </p>
          </div>

          <div className="mt-8 text-center sm:mt-10">
            <div className="flex flex-wrap items-baseline justify-center gap-x-2">
              <span className="text-[2.75rem] font-black leading-none tracking-tight text-[#F8FAFC] sm:text-[3.5rem]">
                {PRICING.yearly.amount}
              </span>
              <span className="text-lg font-semibold text-[rgba(226,232,240,0.62)] sm:text-xl">
                {t("marketing.pricing.perYearSuffix")}
              </span>
            </div>
            <p className={`mt-3 ${landingPremiumCardDescClass}`}>
              {t("marketing.pricing.monthlyEquivalent", { amount: monthlyEquivalent })}
            </p>
            <span className="mt-4 inline-flex items-center rounded-full border border-[#38BDF8]/28 bg-[#2563EB]/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#67E8F9] sm:text-sm">
              {t("marketing.pricing.yearlySavingsBadge")}
            </span>
          </div>

          <ul className="mt-8 space-y-3 sm:mt-10">
            {planFeatures.map((feature) => (
              <PlanFeature key={feature} label={feature} />
            ))}
          </ul>

          <div className="mt-10 flex w-full flex-col items-stretch gap-4 sm:mt-12 sm:items-center">
            <LandingPrimaryButton href="/inscription" showArrow={false} variant="dark">
              {t("marketing.pricing.cta", { days: TRIAL_DURATION_DAYS })}
            </LandingPrimaryButton>
            <p className={`text-center text-xs sm:text-sm ${landingPremiumCardDescClass}`}>
              {t("marketing.pricing.footnote")}
            </p>
          </div>
        </motion.article>
      </div>
    </section>
  );
}
