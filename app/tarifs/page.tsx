"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { useI18n } from "@/components/I18nProvider";
import { PRICING, TRIAL_DURATION_DAYS } from "@/lib/billing/pricing";
import { obillzLandingHomeClass } from "@/components/ui/styles";

export default function TarifsPage() {
  const { t, tList } = useI18n();
  const planFeatures = tList("marketing.pricingPage.planFeatures");
  const monthlyEquivalent = Math.round((PRICING.yearly.amount / 12) * 100) / 100;

  return (
    <main className={obillzLandingHomeClass}>
      <LandingNav />
      <section className="lp-section pt-36 md:pt-40">
        <div className="lp-wrap">
          <div className="mx-auto max-w-2xl text-center">
            <p className="lp-eyebrow">{t("marketing.pricing.label")}</p>
            <h1 className="lp-title">
              {t("marketing.pricingPage.headerTitleLine1")}{" "}
              {t("marketing.pricingPage.headerTitleLine2")}
            </h1>
            <p className="lp-lead mx-auto">{t("marketing.pricing.subtitle")}</p>
          </div>

          <article className="mx-auto mt-14 max-w-xl rounded-[1.75rem] border border-slate-200/80 bg-white p-7 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {t("marketing.pricing.planName")}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {t("marketing.pricing.planDescription")}
            </p>
            <div className="mt-8 flex flex-wrap items-baseline gap-x-2">
              <span className="text-5xl font-black tracking-tight text-slate-900">
                {PRICING.yearly.amount}
              </span>
              <span className="text-lg font-semibold text-slate-500">
                {t("marketing.pricing.perYearSuffix")}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {t("marketing.pricing.monthlyEquivalent", { amount: monthlyEquivalent })}
            </p>
            <p className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#1a23ff]">
              {t("marketing.pricing.yearlySavingsBadge")}
            </p>

            <Link
              href="/inscription"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-[#1a23ff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(26,35,255,0.25)] transition hover:bg-[#151cd6]"
            >
              {t("marketing.pricing.cta", { days: TRIAL_DURATION_DAYS })}
            </Link>
            <p className="mt-3 text-center text-xs text-slate-500">
              {t("marketing.pricing.footnote")}
            </p>

            <div className="mt-8 border-t border-slate-100 pt-7">
              <h3 className="text-base font-bold text-slate-900">
                {t("marketing.pricingPage.includedHeading")}
              </h3>
              <ul className="mt-4 grid gap-2.5">
                {planFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm font-medium text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[#1a23ff]">
                      <Check className="h-3 w-3" strokeWidth={2.6} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:mt-7 sm:px-5 sm:py-5">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <h4 className="min-w-0 text-[0.95rem] font-bold tracking-tight text-slate-900 sm:text-base">
                    {t("marketing.pricingPage.accountingOption.title")}
                  </h4>
                  <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {t("marketing.pricingPage.accountingOption.badge")}
                  </span>
                </div>
                <p className="mt-2.5 text-base font-semibold tracking-tight text-slate-800">
                  {t("marketing.pricingPage.accountingOption.price")}
                </p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                  {t("marketing.pricingPage.accountingOption.description")}
                </p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">
                  {t("marketing.pricingPage.accountingOption.note")}
                </p>
                <p className="mt-4 border-t border-slate-200 pt-3.5 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
                  {t("marketing.pricingPage.accountingOption.total")}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
      <LandingFooter />
    </main>
  );
}
