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
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/30 bg-[#2563EB]/20 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
        <Check className="h-3 w-3 text-[#67E8F9]" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-[0.9375rem] font-medium leading-snug text-[rgba(226,232,240,0.9)]">
        {label}
      </span>
    </li>
  );
}

export default function PricingSection() {
  const { t, tList } = useI18n();
  const planFeatures = tList("marketing.pricingPage.planFeatures");
  const monthlyEquivalent = Math.round((PRICING.yearly.amount / 12) * 100) / 100;

  return (
    <section id="tarifs" className={`${landingSectionShellClass()} scroll-mt-28`}>
      <div className="landing-container relative">
        <div className="pricing-split">
          <div className="pricing-split__intro">
            <LandingSectionIntro
              layout="stack"
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
          </div>

          <motion.article
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className={`${landingPremiumCardClass} landing-obillz-gradient pricing-split__card relative w-full rounded-[1.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_28px_80px_rgba(15,23,42,0.22),0_0_60px_rgba(37,99,235,0.12)] hover:translate-y-0 sm:rounded-[2rem]`}
          >
            <div className="relative z-10 flex flex-col">
              <div className="flex flex-col px-5 py-8 sm:px-7 sm:py-9 md:px-8 md:py-10">
                <span className="inline-flex w-fit items-center rounded-full border border-white/14 bg-white/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[rgba(226,232,240,0.75)] sm:text-[11px]">
                  {t("marketing.pricingPage.planBadge")}
                </span>
                <h3 className={`mt-4 text-2xl sm:text-[1.75rem] ${landingPremiumCardTitleClass}`}>
                  {t("marketing.pricing.planName")}
                </h3>
                <p className={`mt-2 ${landingPremiumCardDescClass}`}>
                  {t("marketing.pricing.planDescription")}
                </p>

                <div className="mt-7 sm:mt-8">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[2.75rem] font-black leading-none tracking-tight text-[#F8FAFC] sm:text-[3.15rem]">
                      {PRICING.yearly.amount}
                    </span>
                    <span className="text-lg font-semibold text-[rgba(226,232,240,0.62)] sm:text-xl">
                      {t("marketing.pricing.perYearSuffix")}
                    </span>
                  </div>
                  <p className={`mt-2.5 ${landingPremiumCardDescClass}`}>
                    {t("marketing.pricing.monthlyEquivalent", { amount: monthlyEquivalent })}
                  </p>
                  <span className="mt-4 inline-flex items-center rounded-full border border-[#38BDF8]/28 bg-[#2563EB]/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#67E8F9] sm:text-sm">
                    {t("marketing.pricing.yearlySavingsBadge")}
                  </span>
                </div>

                <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:mt-9">
                  <LandingPrimaryButton href="/inscription" showArrow={false} variant="dark">
                    {t("marketing.pricing.cta", { days: TRIAL_DURATION_DAYS })}
                  </LandingPrimaryButton>
                  <p className={`text-center text-xs sm:text-left sm:text-sm ${landingPremiumCardDescClass}`}>
                    {t("marketing.pricing.footnote")}
                  </p>
                </div>
              </div>

              <div className="relative border-t border-white/[0.1] px-5 py-7 sm:px-7 sm:py-8 md:px-8 md:py-9">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_0%,rgba(56,189,248,0.08),transparent_55%)]"
                  aria-hidden
                />
                <div className="relative z-10">
                  <h4 className="text-lg font-bold tracking-tight text-[#F8FAFC] sm:text-xl">
                    {t("marketing.pricing.includedLabel")}
                  </h4>
                  <ul className="mt-5 grid gap-y-3.5 sm:mt-6">
                    {planFeatures.map((feature) => (
                      <PlanFeature key={feature} label={feature} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
