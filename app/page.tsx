"use client";

import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";
import FaqAccordion from "@/components/FaqAccordion";
import { useI18n } from "@/components/I18nProvider";

export default function Home() {
  const { t, tList } = useI18n();
  const heroTitleLines = t("hero.title").split("\n");

  const heroStats = [
    { label: t("hero.stats.clients.label"), value: t("hero.stats.clients.value") },
    { label: t("hero.stats.quotes.label"), value: t("hero.stats.quotes.value") },
    { label: t("hero.stats.invoices.label"), value: t("hero.stats.invoices.value") },
    { label: t("hero.stats.payments.label"), value: t("hero.stats.payments.value") },
  ];

  const paymentStatuses = [
    t("hero.paymentsCard.statuses.paid"),
    t("hero.paymentsCard.statuses.followUp"),
    t("hero.paymentsCard.statuses.pending"),
  ];

  const clientFollowUpItems = [
    t("hero.clientFollowUp.items.emailSent"),
    t("hero.clientFollowUp.items.followUpPlanned"),
    t("hero.clientFollowUp.items.paymentReceived"),
  ];

  const problemCards = [
    {
      title: t("problem.cards.docs.title"),
      text: t("problem.cards.docs.text"),
      icon: (
        <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
        </svg>
      ),
    },
    {
      title: t("problem.cards.tools.title"),
      text: t("problem.cards.tools.text"),
      icon: (
        <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h4M7 14h6" />
        </svg>
      ),
    },
    {
      title: t("problem.cards.mentalLoad.title"),
      text: t("problem.cards.mentalLoad.text"),
      icon: (
        <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
        </svg>
      ),
    },
  ];

  const solutionCards = [
    {
      title: t("solution.cards.organization.title"),
      text: t("solution.cards.organization.text"),
    },
    {
      title: t("solution.cards.visibility.title"),
      text: t("solution.cards.visibility.text"),
    },
  ];

  const howItWorksSteps = [
    { label: "1", value: t("howItWorks.steps.one") },
    { label: "2", value: t("howItWorks.steps.two") },
    { label: "3", value: t("howItWorks.steps.three") },
    { label: "4", value: t("howItWorks.steps.four") },
    { label: "5", value: t("howItWorks.steps.five") },
    { label: "6", value: t("howItWorks.steps.six") },
  ];

  const howItWorksCards = [
    {
      title: t("howItWorks.cards.quotes.title"),
      text: t("howItWorks.cards.quotes.text"),
      icon: (
        <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
        </svg>
      ),
    },
    {
      title: t("howItWorks.cards.tasks.title"),
      text: t("howItWorks.cards.tasks.text"),
      icon: (
        <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
        </svg>
      ),
    },
  ];

  const whyOrganaCards = [
    {
      title: t("whyOrgana.cards.security.title"),
      text: t("whyOrgana.cards.security.text"),
    },
    {
      title: t("whyOrgana.cards.time.title"),
      text: t("whyOrgana.cards.time.text"),
    },
    {
      title: t("whyOrgana.cards.organization.title"),
      text: t("whyOrgana.cards.organization.text"),
    },
  ];

  const testimonials = [
    { text: t("testimonials.items.one.text"), author: t("testimonials.items.one.author") },
    { text: t("testimonials.items.two.text"), author: t("testimonials.items.two.author") },
    { text: t("testimonials.items.three.text"), author: t("testimonials.items.three.author") },
    { text: t("testimonials.items.four.text"), author: t("testimonials.items.four.author") },
  ];

  const faqItems = [
    { question: t("faq.items.target.question"), answer: t("faq.items.target.answer") },
    { question: t("faq.items.free.question"), answer: t("faq.items.free.answer") },
    { question: t("faq.items.security.question"), answer: t("faq.items.security.answer") },
    { question: t("faq.items.easy.question"), answer: t("faq.items.easy.answer") },
  ];

  const freePlanFeatures = tList("pricing.free.features");
  const proPlanFeatures = tList("pricing.pro.features");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LandingNav />
      <main className="pt-32">
        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[64px] bg-premium-gradient shadow-[0_36px_110px_rgba(2,6,23,0.45)]">
            <div className="grid gap-14 px-8 py-14 md:px-14 md:py-18 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                  {t("hero.badge")}
                </div>
                <h1 className="mt-7 text-4xl font-semibold leading-tight md:text-6xl lg:text-7xl">
                  {heroTitleLines.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {line}
                      {index < heroTitleLines.length - 1 && <br />}
                    </span>
                  ))}
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/80 md:text-xl">{t("hero.subtitle")}</p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.25)] hover:bg-slate-100 transition-colors"
                  >
                    {t("hero.ctaPrimary")}
                  </Link>
                  <Link
                    href="#comment-ca-marche"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                  >
                    {t("hero.ctaSecondary")}
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-8 top-10 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute -right-10 bottom-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="relative grid gap-6">
                  <div className="rounded-[28px] border border-white/15 bg-white/5 p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("hero.overview")}</p>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white/85">
                        {t("hero.period")}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {heroStats.map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-white/10 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">{stat.label}</p>
                          <p className="text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/15 bg-white/5 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("hero.quoteCard.title")}</p>
                      <p className="mt-2 text-lg font-semibold">{t("hero.quoteCard.number")}</p>
                      <p className="mt-1 text-xs text-white/80">{t("hero.quoteCard.status")}</p>
                      <div className="mt-4 h-2 w-full rounded-full bg-white/15">
                        <div className="h-2 w-3/4 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-white/15 bg-white/5 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("hero.paymentsCard.title")}</p>
                      <p className="mt-2 text-lg font-semibold">{t("hero.paymentsCard.count")}</p>
                      <p className="mt-1 text-xs text-white/80">{t("hero.paymentsCard.period")}</p>
                      <div className="mt-4 grid gap-2">
                        {paymentStatuses.map((item) => (
                          <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-white/15 bg-white/5 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">{t("hero.clientFollowUp.title")}</p>
                    <div className="mt-3 grid gap-2 text-xs text-white/85 md:grid-cols-3">
                      {clientFollowUpItems.map((item) => (
                        <div key={item} className="rounded-lg bg-white/10 px-3 py-2">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-6">
              {problemCards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                    {card.icon}
                  </div>
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[36px] border border-slate-200 bg-white p-11 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("problem.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{t("problem.title")}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{t("problem.paragraphs.first")}</p>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{t("problem.paragraphs.second")}</p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  {t("problem.cta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[56px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 py-14 text-white shadow-[0_32px_90px_rgba(2,6,23,0.45)] md:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{t("solution.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">{t("solution.title")}</h2>
              <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">{t("solution.paragraph")}</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {solutionCards.map((card) => (
                <div key={card.title} className="rounded-[30px] border border-white/15 bg-white/5 p-7 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                  <p className="text-base font-semibold text-white">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {t("solution.cta")}
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("howItWorks.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{t("howItWorks.title")}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{t("howItWorks.paragraph")}</p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                >
                  {t("howItWorks.cta")}
                </Link>
              </div>
              <div className="mt-10 rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{t("howItWorks.stepsTitle")}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {t("howItWorks.stepsBadge")}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {howItWorksSteps.slice(0, 3).map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {howItWorksSteps.slice(3).map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              {howItWorksCards.map((card) => (
                <div key={card.title} className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                    {card.icon}
                  </div>
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("tasksCalendar.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{t("tasksCalendar.title")}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{t("tasksCalendar.paragraph")}</p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("whyOrgana.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{t("whyOrgana.title")}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {whyOrganaCards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("testimonials.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{t("testimonials.title")}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <div key={item.author} className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                  <p className="text-base leading-relaxed text-slate-800">“{item.text}”</p>
                  <p className="mt-5 text-sm font-semibold text-slate-600">{item.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("faq.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{t("faq.title")}</h2>
            </div>
            <div className="mt-10">
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("pricing.label")}</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{t("pricing.title")}</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                <p className="text-base font-semibold text-slate-900">{t("pricing.free.title")}</p>
                <p className="mt-2 text-sm text-slate-600">{t("pricing.free.subtitle")}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {freePlanFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                  >
                    {t("pricing.free.cta")}
                  </Link>
                </div>
              </div>
              <div className="relative rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <span className="absolute -top-3 right-6 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {t("pricing.pro.badge")}
                </span>
                <p className="text-base font-semibold text-slate-900">{t("pricing.pro.title")}</p>
                <p className="mt-2 text-sm text-slate-600">{t("pricing.pro.subtitle")}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {proPlanFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    {t("pricing.pro.cta")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-7xl rounded-[56px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 py-14 text-center text-white shadow-[0_32px_90px_rgba(2,6,23,0.45)] md:px-12">
            <h2 className="text-3xl font-semibold md:text-4xl">{t("finalCta.title")}</h2>
            <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">{t("finalCta.paragraph")}</p>
            <div className="mt-8">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-colors"
              >
                {t("finalCta.cta")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
