"use client";

import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";
import FaqAccordion from "@/components/FaqAccordion";
import { useI18n } from "@/components/I18nProvider";

type SectionTitleProps = {
  label: string;
  title: string;
  description?: string;
};

function SectionTitle({ label, title, description }: SectionTitleProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500/80">{label}</p>
      <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{description}</p> : null}
    </div>
  );
}

export default function LandingPage() {
  const { t, tList } = useI18n();
  const heroTitleLines = t("landing.hero.title").split("\n");

  const featureCards = [
    {
      title: t("landing.features.cards.quotes.title"),
      text: t("landing.features.cards.quotes.text"),
      icon: (
        <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
        </svg>
      ),
    },
    {
      title: t("landing.features.cards.payments.title"),
      text: t("landing.features.cards.payments.text"),
      icon: (
        <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10H4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h4" />
        </svg>
      ),
    },
    {
      title: t("landing.features.cards.expenses.title"),
      text: t("landing.features.cards.expenses.text"),
      icon: (
        <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
        </svg>
      ),
    },
    {
      title: t("landing.features.cards.notifications.title"),
      text: t("landing.features.cards.notifications.text"),
      icon: (
        <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a3 3 0 0 0 6 0" />
        </svg>
      ),
    },
    {
      title: t("landing.features.cards.assistant.title"),
      text: t("landing.features.cards.assistant.text"),
      icon: (
        <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.2 4.5L19 9l-4 3.9.9 5.6-5-2.7-5 2.7.9-5.6L5 9l4.8-1.5L12 3z" />
        </svg>
      ),
    },
    {
      title: t("landing.features.cards.dashboard.title"),
      text: t("landing.features.cards.dashboard.text"),
      icon: (
        <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h4M7 13h6" />
        </svg>
      ),
    },
  ];

  const howItWorksSteps = tList("landing.howItWorks.steps").map((text, index) => ({
    label: String(index + 1).padStart(2, "0"),
    text,
  }));


  const problemCards = [
    {
      title: t("landing.problem.cards.tools.title"),
      text: t("landing.problem.cards.tools.text"),
    },
    {
      title: t("landing.problem.cards.tracking.title"),
      text: t("landing.problem.cards.tracking.text"),
    },
    {
      title: t("landing.problem.cards.load.title"),
      text: t("landing.problem.cards.load.text"),
    },
  ];

  const solutionCards = [
    {
      title: t("landing.solution.cards.centralized.title"),
      text: t("landing.solution.cards.centralized.text"),
    },
    {
      title: t("landing.solution.cards.control.title"),
      text: t("landing.solution.cards.control.text"),
    },
  ];

  const faqItems = [
    {
      question: t("landing.faq.items.fit.question"),
      answer: t("landing.faq.items.fit.answer"),
    },
    {
      question: t("landing.faq.items.free.question"),
      answer: t("landing.faq.items.free.answer"),
    },
    {
      question: t("landing.faq.items.export.question"),
      answer: t("landing.faq.items.export.answer"),
    },
    {
      question: t("landing.faq.items.noCommitment.question"),
      answer: t("landing.faq.items.noCommitment.answer"),
    },
    {
      question: t("landing.faq.items.assistant.question"),
      answer: t("landing.faq.items.assistant.answer"),
    },
  ];

  const comparisonAfterItems = [
    {
      title: t("landing.comparison.after.items.fast.title"),
      text: t("landing.comparison.after.items.fast.text"),
    },
    {
      title: t("landing.comparison.after.items.tracking.title"),
      text: t("landing.comparison.after.items.tracking.text"),
    },
    {
      title: t("landing.comparison.after.items.alerts.title"),
      text: t("landing.comparison.after.items.alerts.text"),
    },
    {
      title: t("landing.comparison.after.items.realtime.title"),
      text: t("landing.comparison.after.items.realtime.text"),
    },
    {
      title: t("landing.comparison.after.items.organization.title"),
      text: t("landing.comparison.after.items.organization.text"),
    },
  ];

  const pricing = {
    free: tList("landing.pricing.free.features"),
    pro: tList("landing.pricing.pro.features"),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main className="pt-28">
        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[56px] border border-indigo-100 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.15)]">
            <div className="grid gap-14 px-8 py-14 md:px-12 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  {t("landing.hero.badge")}
                </div>
                <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
                  {heroTitleLines.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {line}
                      {index < heroTitleLines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-slate-600 md:text-xl">
                  {t("landing.hero.subtitle")}
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {tList("landing.hero.bullets").map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.35)] hover:bg-indigo-500 transition-colors"
                  >
                    {t("landing.hero.ctaPrimary")}
                  </Link>
                  <Link
                    href="#dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-white px-8 py-3 text-sm font-semibold text-indigo-700 hover:border-indigo-300 transition-colors"
                  >
                    {t("landing.hero.ctaSecondary")}
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{t("landing.hero.paymentsLabel")}</span>
                  {tList("landing.hero.payments").map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl" />
                <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />
                <div className="relative rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.15)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                      {t("landing.hero.preview.label")}
                    </p>
                    <span className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white">
                      {t("landing.brand")}
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {t("landing.hero.preview.invoices.label")}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {t("landing.hero.preview.invoices.value")}
                      </p>
                      <div className="mt-4 h-2 w-full rounded-full bg-indigo-100">
                        <div className="h-2 w-3/4 rounded-full bg-indigo-600" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {t("landing.hero.preview.quotes.label")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {t("landing.hero.preview.quotes.sent")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("landing.hero.preview.quotes.pending")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {t("landing.hero.preview.expenses.label")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {t("landing.hero.preview.expenses.value")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("landing.hero.preview.expenses.due")}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {t("landing.hero.preview.followUp.label")}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                        {tList("landing.hero.preview.followUp.items").map((item) => (
                          <div key={item} className="rounded-lg bg-indigo-50 px-3 py-2">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {t("landing.hero.preview.abstract.label")}
                  </p>
                  <div className="mt-4 h-28 rounded-2xl bg-gradient-to-r from-indigo-100 via-violet-100 to-blue-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-6">
              {problemCards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[36px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-11 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500/80">
                {t("landing.problem.label")}
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                {t("landing.problem.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                {t("landing.problem.paragraphs.first")}
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                {t("landing.problem.paragraphs.second")}
              </p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  {t("landing.problem.cta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[56px] bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 px-8 py-14 text-white shadow-[0_32px_90px_rgba(15,23,42,0.35)] md:px-12">
            <SectionTitle
              label={t("landing.solution.label")}
              title={t("landing.solution.title")}
              description={t("landing.solution.description")}
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {solutionCards.map((card) => (
                <div key={card.title} className="rounded-[30px] border border-white/15 bg-white/10 p-7 shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
                  <p className="text-base font-semibold text-white">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              label={t("landing.features.label")}
              title={t("landing.features.title")}
              description={t("landing.features.description")}
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-100">
                    {card.icon}
                  </div>
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="dashboard" className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <SectionTitle
                label={t("landing.dashboard.label")}
                title={t("landing.dashboard.title")}
                description={t("landing.dashboard.description")}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                {tList("landing.dashboard.tags").map((item) => (
                  <span key={item} className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-8 top-10 h-48 w-48 rounded-full bg-indigo-200/50 blur-3xl" />
              <div className="rounded-[32px] border border-indigo-100 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                    {t("landing.dashboard.preview.label")}
                  </p>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                    {t("landing.brand")}
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {tList("landing.dashboard.preview.stats.labels").map((label) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {t("landing.dashboard.preview.stats.value")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t("landing.dashboard.preview.stats.period")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {t("landing.dashboard.preview.deadlines.label")}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-600">
                      {tList("landing.dashboard.preview.deadlines.items").map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                          <span>{item}</span>
                          <span className="text-indigo-600">{t("landing.dashboard.preview.deadlines.today")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">{t("landing.dashboard.mockupNote")}</p>
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              label={t("landing.howItWorks.label")}
              title={t("landing.howItWorks.title")}
              description={t("landing.howItWorks.description")}
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {howItWorksSteps.map((step) => (
                <div key={step.label} className="rounded-[26px] border border-slate-200 bg-white p-7 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">{step.label}</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[44px] border border-indigo-100 bg-white px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <SectionTitle label={t("landing.pricing.label")} title={t("landing.pricing.title")} />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                <p className="text-base font-semibold text-slate-900">{t("landing.pricing.free.title")}</p>
                <p className="mt-2 text-sm text-slate-600">{t("landing.pricing.free.subtitle")}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {pricing.free.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                  >
                    {t("landing.pricing.free.cta")}
                  </Link>
                </div>
              </div>
              <div className="relative rounded-[28px] border border-indigo-200 bg-white p-7 shadow-[0_18px_40px_rgba(79,70,229,0.2)]">
                <span className="absolute -top-3 right-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  {t("landing.pricing.pro.badge")}
                </span>
                <p className="text-base font-semibold text-slate-900">{t("landing.pricing.pro.title")}</p>
                <p className="mt-2 text-sm text-slate-600">{t("landing.pricing.pro.subtitle")}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {pricing.pro.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    {t("landing.pricing.pro.cta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[48px] border border-slate-200 bg-slate-50 px-8 py-12 shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500/80">
                {t("landing.comparison.label")}
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                {t("landing.comparison.title")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                {t("landing.comparison.description")}
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t("landing.comparison.before.label")}
                  </p>
                  <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-500">
                    {t("landing.comparison.before.badge")}
                  </span>
                </div>
                <ul className="mt-6 space-y-4 text-sm text-slate-600">
                  {tList("landing.comparison.before.items").map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                        ✕
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden items-center justify-center lg:flex">
                <div className="flex h-full w-16 flex-col items-center justify-center gap-3">
                  <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    {t("landing.comparison.middle.before")}
                  </span>
                  <div className="h-40 w-px bg-gradient-to-b from-transparent via-indigo-200 to-transparent" />
                  <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    {t("landing.comparison.middle.after")}
                  </span>
                </div>
              </div>
              <div className="rounded-[28px] border border-indigo-100 bg-white p-7 shadow-[0_20px_50px_rgba(79,70,229,0.12)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
                    {t("landing.comparison.after.label")}
                  </p>
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    {t("landing.comparison.after.badge")}
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  {comparisonAfterItems.map((item) => (
                    <div key={item.title} className="rounded-[22px] border border-indigo-100 bg-indigo-50/40 p-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                          ✓
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[44px] border border-slate-200 bg-white px-8 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <SectionTitle label={t("landing.faq.label")} title={t("landing.faq.title")} />
            <div className="mt-10">
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

