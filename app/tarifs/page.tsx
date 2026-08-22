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
                {t("marketing.pricing.includedLabel")}
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
            </div>
          </article>
        </div>
      </section>
      <LandingFooter />
    </main>
  );
}
