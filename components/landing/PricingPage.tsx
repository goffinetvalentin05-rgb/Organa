"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Shield, Sparkles, Users } from "lucide-react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import LandingBackground from "@/components/landing/LandingBackground";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingLocaleEffects from "@/components/landing/LandingLocaleEffects";
import LandingNav from "@/components/landing/LandingNav";
import { useI18n } from "@/components/I18nProvider";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import {
  landingFeaturedCardClass,
  landingSectionGlowClass,
  obillzLandingGridOverlayClass,
  obillzLandingRootClass,
} from "@/components/ui/styles";
import { TEAM_PRICING, TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";

type BillingCycle = "monthly" | "yearly";

const INCLUDED_FEATURES_FALLBACK = [
  "Membres",
  "Cotisations",
  "Factures",
  "Événements",
  "Sponsors",
  "Documents",
  "Procès-verbaux",
  "Buvette",
  "Utilisateurs & accès",
  "Page publique",
  "QR codes",
  "Support",
] as const;

const REASSURANCE_ICONS = [Sparkles, Shield, Users] as const;

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

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
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/20 ring-1 ring-[#1A23FF]/30">
        <Check className="h-3 w-3 text-blue-200" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="text-sm font-medium text-blue-100/85">{label}</span>
    </li>
  );
}

export default function PricingPage() {
  const { t, tList } = useI18n();
  const reduceMotion = useReducedMotion();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  const includedFeatures = tList("marketing.pricing.includedFeatures");
  const features =
    includedFeatures.length > 0 ? includedFeatures : [...INCLUDED_FEATURES_FALLBACK];

  const reassuranceBlocks = tList("marketing.pricingPage.reassuranceBlocks");

  const isYearly = billingCycle === "yearly";
  const amount = isYearly ? TEAM_PRICING.yearly.amount : TEAM_PRICING.monthly.amount;
  const priceSuffix = isYearly
    ? t("marketing.pricing.perYearSuffix")
    : t("marketing.pricing.perMonthSuffix");
  const monthlyEquivalent = isYearly ? Math.round(TEAM_PRICING.yearly.amount / 12) : null;

  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.askChatGpt.message")
  );

  const priceMotion = {
    initial: reduceMotion ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: reduceMotion ? undefined : { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: easePremium },
  };

  return (
    <main className={obillzLandingRootClass}>
      <LandingBackground />
      <div className={obillzLandingGridOverlayClass} aria-hidden />

      <div className="relative z-10">
        <LandingLocaleEffects />
        <LandingNav />

        <div className="pt-24 sm:pt-28 md:pt-32">
          {/* Hero */}
          <section className="relative isolate overflow-hidden pb-10 md:pb-14">
            <div className={landingSectionGlowClass} aria-hidden />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="relative mx-auto w-[94%] max-w-[820px] text-center"
            >
              <motion.p
                variants={staggerItem}
                className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80"
              >
                {t("marketing.pricing.label")}
              </motion.p>
              <motion.h1
                variants={staggerItem}
                className="mt-3 text-balance text-3xl font-black leading-[1.08] tracking-tight text-white md:text-5xl lg:text-[3.25rem]"
              >
                {t("marketing.pricing.title")}
              </motion.h1>
              <motion.p
                variants={staggerItem}
                className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-blue-100/70 md:text-lg"
              >
                {t("marketing.pricing.subtitle")}
              </motion.p>
            </motion.div>
          </section>

          {/* Carte tarifaire */}
          <section className="relative isolate overflow-hidden pb-12 md:pb-16">
            <div className="relative mx-auto w-[94%] max-w-[760px]">
              <motion.div
                variants={scrollReveal}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="relative"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-[min(560px,95%)] -translate-y-1/2 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.32),rgba(99,102,241,0.12)_50%,transparent_75%)] blur-2xl"
                  aria-hidden
                />

                <article className="landing-glass-card relative z-10 overflow-hidden rounded-[1.35rem] border border-blue-300/40 bg-gradient-to-br from-[#070b1f]/95 via-[#0d1438]/92 to-[#121a42]/95 shadow-[0_0_0_1px_rgba(147,197,253,0.16),0_24px_60px_rgba(0,0,0,0.55),0_0_80px_rgba(26,35,255,0.22)] backdrop-blur-xl sm:rounded-2xl">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/35 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-[#1A23FF]/18 via-transparent to-[#6366f1]/14 sm:rounded-2xl"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-1/4 -translate-y-1/4 rounded-full bg-[#1A23FF]/15 blur-3xl"
                    aria-hidden
                  />

                  <div className="relative flex items-center justify-center px-5 py-5 sm:px-8 sm:py-6">
                    <BillingToggle
                      billingCycle={billingCycle}
                      onSelect={setBillingCycle}
                      monthlyLabel={t("marketing.pricing.monthly")}
                      yearlyLabel={t("marketing.pricing.yearly")}
                      savingsBadge={t("marketing.pricing.yearlySavingsBadge")}
                      ariaLabel={t("marketing.pricing.billingToggleAria")}
                    />
                  </div>

                  <div className="relative px-5 pb-8 sm:px-8 sm:pb-10">
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-white sm:text-2xl">
                        {t("marketing.pricing.planName")}
                      </h2>
                      <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-blue-100/60 sm:text-base">
                        {t("marketing.pricing.planDescription")}
                      </p>
                    </div>

                    <div className="mt-8 text-center sm:mt-10">
                      <AnimatePresence mode="wait">
                        <motion.div key={billingCycle} {...priceMotion}>
                          <div className="flex flex-wrap items-baseline justify-center gap-x-2">
                            <span className="bg-gradient-to-br from-white via-blue-50 to-blue-200/90 bg-clip-text text-5xl font-black leading-none tracking-tight text-transparent sm:text-[3.25rem]">
                              {amount}
                            </span>
                            <span className="text-xl font-semibold text-blue-200/65 sm:text-2xl">
                              {priceSuffix}
                            </span>
                          </div>

                          {isYearly && monthlyEquivalent !== null ? (
                            <p className="mt-3 text-sm text-blue-100/55 sm:text-base">
                              {t("marketing.pricing.monthlyEquivalent", {
                                amount: monthlyEquivalent,
                              })}
                            </p>
                          ) : (
                            <p className="mt-3 text-sm text-blue-100/55 sm:text-base">
                              {t("marketing.pricing.monthlyBillingNote")}
                            </p>
                          )}

                          {isYearly ? (
                            <span className="mt-4 inline-flex rounded-md bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/25">
                              {t("marketing.pricing.yearlySavingsBadge")}
                            </span>
                          ) : null}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="relative mt-8 flex flex-col items-center gap-2.5 sm:mt-10">
                      <LandingPrimaryButton href="/inscription" showArrow={false}>
                        {t("marketing.pricing.cta", { days: TRIAL_DURATION_DAYS })}
                      </LandingPrimaryButton>
                      <p className="text-xs text-blue-100/45 sm:text-sm">
                        {t("marketing.pricing.footnote")}
                      </p>
                    </div>

                    <div className="relative mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:mt-12 sm:p-8">
                      <p className="text-center text-base font-semibold text-white sm:text-lg">
                        {t("marketing.pricing.includedLabel")}
                      </p>
                      <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2 sm:gap-y-4">
                        {features.map((feature) => (
                          <IncludedFeature key={feature} label={feature} />
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </motion.div>
            </div>
          </section>

          {/* Rassurance */}
          <section className="relative pb-14 md:pb-20">
            <div className="mx-auto w-[94%] max-w-[960px]">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="grid gap-4 sm:grid-cols-3 sm:gap-5"
              >
                {reassuranceBlocks.map((block, index) => {
                  const Icon = REASSURANCE_ICONS[index] ?? Sparkles;
                  const [title, text] = block.split("|");

                  return (
                    <motion.div
                      key={title}
                      variants={staggerItem}
                      className="landing-glass-card rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
                    >
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A23FF]/20 ring-1 ring-[#1A23FF]/30">
                        <Icon className="h-5 w-5 text-blue-200" strokeWidth={2} aria-hidden />
                      </div>
                      <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{text}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>

          {/* CTA final */}
          <section className="relative pb-20 md:pb-28">
            <div
              className="pointer-events-none absolute inset-x-[10%] top-1/2 h-64 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.35),transparent_70%)] blur-3xl"
              aria-hidden
            />
            <motion.div
              variants={scrollReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className={`${landingFeaturedCardClass} landing-glass-card-featured relative mx-auto flex w-[94%] max-w-[820px] flex-col items-center justify-center overflow-hidden px-6 py-10 text-center sm:px-8 sm:py-12 md:px-12 md:py-14`}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(96,165,250,0.8)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.8)_1px,transparent_1px)] [background-size:32px_32px]"
                aria-hidden
              />
              <div className="relative z-10 w-full">
                <h2 className="text-2xl font-black text-white md:text-4xl">
                  {t("marketing.pricingPage.finalCta.title")}
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-sm text-blue-100/80 md:text-base">
                  {t("marketing.pricingPage.finalCta.subtitle")}
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                  <LandingPrimaryButton href="/inscription" showArrow={false}>
                    {t("marketing.pricingPage.finalCta.ctaTrial")}
                  </LandingPrimaryButton>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-full border border-blue-300/40 bg-gradient-to-b from-[#1A23FF]/[0.16] to-[#1A23FF]/[0.08] px-7 py-3.5 text-base font-bold text-white shadow-[0_0_32px_rgba(26,35,255,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-md transition-[border-color,box-shadow,background,transform] duration-300 hover:-translate-y-0.5 hover:border-blue-200/55 hover:from-[#1A23FF]/25 hover:to-[#1A23FF]/12 hover:shadow-[0_0_48px_rgba(26,35,255,0.38),inset_0_1px_0_rgba(255,255,255,0.2)] sm:w-auto md:px-8 md:py-4"
                  >
                    {t("marketing.pricingPage.finalCta.ctaFounder")}
                  </a>
                </div>
              </div>
            </motion.div>
          </section>
        </div>

        <LandingFooter />
      </div>
    </main>
  );
}
