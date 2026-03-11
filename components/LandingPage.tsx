"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ComparisonView = "without" | "with";
type FeatureTabId =
  | "membres"
  | "cotisations"
  | "manifestations"
  | "buvette"
  | "finances"
  | "factures"
  | "inscriptions"
  | "communication";

const featureTabs: Array<{
  id: FeatureTabId;
  title: string;
  description: string;
  details: string;
}> = [
  {
    id: "membres",
    title: "Membres",
    description:
      "Centralisez les fiches membres, les équipes et toutes les informations importantes dans une seule base claire et organisée.",
    details:
      "Créez des équipes et accédez rapidement aux informations importantes.",
  },
  {
    id: "cotisations",
    title: "Cotisations",
    description:
      "Générez les cotisations et envoyez-les automatiquement aux membres par email en quelques secondes.",
    details: "Générez les cotisations en un clic et envoyez-les automatiquement aux membres par email.",
  },
  {
    id: "manifestations",
    title: "Manifestations",
    description:
      "Créez des événements et gérez les bénévoles avec un système d'inscription simple à partager.",
    details:
      "Organisez les événements du club et gérez les bénévoles avec un système d'inscription simple.",
  },
  {
    id: "buvette",
    title: "Buvette",
    description:
      "Gérez les réservations de la buvette et générez automatiquement les factures pour les locations.",
    details: "Gérez les réservations de la buvette et générez automatiquement les factures.",
  },
  {
    id: "finances",
    title: "Finances",
    description:
      "Suivez facilement les cotisations, les paiements et les dépenses du club.",
    details: "Suivez les paiements et les finances du club avec une vue claire.",
  },
  {
    id: "factures",
    title: "Factures",
    description:
      "Créez et envoyez des factures professionnelles en quelques secondes.",
    details: "Créez et envoyez des factures professionnelles en quelques secondes.",
  },
  {
    id: "inscriptions",
    title: "Inscriptions",
    description:
      "Partagez un lien ou un QR code pour permettre aux gens de s'inscrire facilement.",
    details: "Partagez un lien ou un QR code pour permettre aux gens de s'inscrire facilement.",
  },
  {
    id: "communication",
    title: "Communication",
    description:
      "Envoyez facilement des informations importantes aux membres du club.",
    details: "Envoyez facilement des informations importantes aux membres du club.",
  },
];

const faqItems = [
  {
    question: "Est-ce facile à utiliser ?",
    answer:
      "Oui. Obillz est conçu pour être simple et rapide à prendre en main par les comités de clubs.",
  },
  {
    question: "Est-ce accessible sur téléphone ?",
    answer:
      "Oui. La plateforme fonctionne sur ordinateur, tablette et téléphone.",
  },
  {
    question: "Est-ce que plusieurs personnes peuvent gérer le club ?",
    answer:
      "Oui. Plusieurs membres du comité peuvent accéder à la plateforme et collaborer.",
  },
  {
    question: "Combien de temps faut-il pour commencer ?",
    answer: "La mise en place du club prend seulement quelques minutes.",
  },
];

function HeroFloatingCard({
  className,
  title,
  line1,
  line2,
  secondary,
}: {
  className: string;
  title: string;
  line1: string;
  line2: string;
  secondary: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm md:block ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm font-black leading-tight text-[#1A23FF]">{line1}</p>
      <p className="mt-1 text-sm font-bold leading-tight text-slate-800">{line2}</p>
      <p className="mt-2 text-xs text-slate-500">{secondary}</p>
    </div>
  );
}

function FeatureTabIcon({ id }: { id: FeatureTabId }) {
  if (id === "membres") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path d="M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "cotisations") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path d="M4 7h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeWidth="1.8" />
      </svg>
    );
  }
  if (id === "manifestations") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path d="M8 3v3M16 3v3M4 9h16M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "buvette") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path d="M7 4h10v3a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V4Z" strokeWidth="1.8" />
        <path d="M9 11v8h6v-8" strokeWidth="1.8" />
      </svg>
    );
  }
  if (id === "finances") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path d="M4 12h4l2-3 3 6 2-3h5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "factures") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path d="M7 3h8l3 3v15H7z" strokeWidth="1.8" />
        <path d="M10 11h5M10 15h5" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "inscriptions") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path d="M4 12l8-8 8 8-8 8-8-8Z" strokeWidth="1.8" />
        <path d="M12 8v8M8 12h8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path d="M4 6h16v12H4z" strokeWidth="1.8" />
      <path d="m5 7 7 6 7-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  const [comparisonView, setComparisonView] = useState<ComparisonView>("with");
  const [activeFeatureTab, setActiveFeatureTab] = useState<FeatureTabId>("membres");
  const [openFaq, setOpenFaq] = useState(0);
  const currentFeature = featureTabs.find((item) => item.id === activeFeatureTab) ?? featureTabs[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--obillz-hero-blue)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 pb-20">
        <section className="mt-0 w-full">
          <div className="w-full px-3 pb-6 pt-4 md:px-8 md:pb-8 md:pt-6 lg:px-12">
            <header className="mx-auto flex max-w-[1140px] items-center justify-between gap-4">
              <Link href="/" className="transition hover:opacity-95">
                <Image src="/logo-obillz.png" alt="Obillz" width={124} height={30} priority />
              </Link>
              <nav className="hidden items-center gap-2 md:flex">
                {["À propos", "Fonctions", "Tarifs", "Aide"].map((item) => (
                  <a
                    key={item}
                    href="#fonctionnalites"
                    className="rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/20"
                  >
                    {item}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  href="/connexion"
                  className="rounded-full border border-white/45 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-full border border-white/60 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Créer mon club gratuitement
                </Link>
              </div>
            </header>

            <div className="relative mt-8 min-h-[390px] overflow-visible p-5 md:min-h-[460px] md:p-10">
              <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:36px_36px]" />
              <div className="pointer-events-none absolute inset-0 rounded-t-[26px] border border-b-0 border-white/25" />

              <div className="relative z-10">
                <div className="mt-12 text-center md:mt-20">
                  <h1 className="text-balance text-3xl font-black uppercase leading-tight md:text-6xl">
                    GÉRER UN CLUB SPORTIF
                    <br />
                    NE DEVRAIT PAS ÊTRE COMPLIQUÉ.
                  </h1>
                  <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-blue-100 md:text-lg">
                    Simplifiez l&apos;administration de votre club, gagnez du temps et offrez une
                    organisation claire et professionnelle à votre comité.
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/inscription"
                      className="inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3 text-base font-bold text-[#1A23FF] shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 sm:w-auto"
                    >
                      Créer mon club gratuitement
                    </Link>
                    <a
                      href="#comparaison"
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/45 px-7 py-3 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
                    >
                      Voir comment ça fonctionne
                    </a>
                  </div>
                </div>
              </div>

              <HeroFloatingCard
                className="left-6 top-[58%] -rotate-6 animate-float [animation-delay:120ms]"
                title="Inscriptions ouvertes"
                line1="Repas après match"
                line2="42 participants"
                secondary="Lien ou QR code partagé au club"
              />
              <HeroFloatingCard
                className="right-6 top-[56%] rotate-6 animate-float [animation-delay:260ms]"
                title="Planning manifestation"
                line1="Soirée du club"
                line2="8 bénévoles inscrits"
                secondary="Organisation simple des bénévoles"
              />
              <HeroFloatingCard
                className="left-1/2 top-[84%] -translate-x-1/2 rotate-[-2deg] animate-float [animation-delay:400ms]"
                title="Cotisation annuelle"
                line1="Envoyée aux membres"
                line2="Équipe 1"
                secondary="Envoi en 2 clics"
              />
            </div>
          </div>
        </section>

        <section id="probleme" className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-12">
            <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-5xl">
              Aujourd&apos;hui, gérer un club peut vite devenir un casse-tête.
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-600 md:text-lg">
              Dans beaucoup de clubs, les tâches sont dispersées entre Excel, messages WhatsApp,
              emails et gestion manuelle. Le comité perd du temps, les informations se dispersent
              et le suivi des membres devient difficile.
            </p>
          </div>
        </section>

        <section id="comparaison" className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="text-center">
            <h2 className="text-3xl font-black leading-tight text-white md:text-5xl">
              Une seule plateforme pour tout centraliser
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-blue-100 md:text-lg">
              Toute l&apos;organisation du club au même endroit.
            </p>
            <div className="mt-6 inline-flex rounded-full border border-white/25 bg-white/15 p-1 shadow-[0_12px_30px_rgba(2,6,23,0.28)] backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setComparisonView("without")}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                  comparisonView === "without"
                    ? "bg-white text-[#1A23FF] shadow-sm"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                Sans Obillz
              </button>
              <button
                type="button"
                onClick={() => setComparisonView("with")}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                  comparisonView === "with"
                    ? "bg-white text-[#1A23FF] shadow-sm"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                Avec Obillz
              </button>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-[1080px]">
            {comparisonView === "without" ? (
              <div className="animate-fade-in">
                <h3 className="mb-5 text-left text-2xl font-black text-white">Sans Obillz</h3>
                <div className="grid gap-4">
                  {[
                    {
                      title: "Excel partout",
                      description:
                        "Les listes de membres et les cotisations sont dispersées dans plusieurs fichiers Excel différents.",
                    },
                    {
                      title: "Cotisations compliquées",
                      description:
                        "Les cotisations doivent être calculées et envoyées manuellement une par une.",
                    },
                    {
                      title: "Factures bricolées",
                      description:
                        "Créer une facture propre prend du temps et se fait souvent dans Word ou Excel.",
                    },
                    {
                      title: "Organisation des événements compliquée",
                      description:
                        "Les bénévoles et les inscriptions aux manifestations sont gérés dans des messages WhatsApp ou sur papier.",
                    },
                    {
                      title: "Communication dispersée",
                      description:
                        "Les informations importantes se perdent entre WhatsApp, emails et papiers.",
                    },
                    {
                      title: "Manque de visibilité",
                      description:
                        "Le comité n&apos;a aucune vue claire sur les finances et l&apos;organisation du club.",
                    },
                  ].map((item) => (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-[#EEF2FF] p-5 text-left shadow-[0_14px_30px_rgba(2,6,23,0.16)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                            <path d="M5 5h14v14H5z" strokeWidth="2" />
                          </svg>
                        </span>
                        <div>
                          <h4 className="text-lg font-black text-slate-900">{item.title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <h3 className="mb-5 text-left text-2xl font-black text-white">Avec Obillz</h3>
                <div className="grid gap-5 lg:grid-cols-[1.12fr_1fr]">
                  <div className="overflow-hidden rounded-2xl border border-white/25 bg-white shadow-[0_18px_45px_rgba(2,6,23,0.2)]">
                    <div className="grid grid-cols-[190px_1fr]">
                      <aside className="border-r border-slate-200 bg-[#F7FAFF] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2563EB]">Obillz</p>
                        <div className="mt-4 space-y-2">
                          {["Dashboard du club", "Membres", "Cotisations", "Factures", "Produits", "Evenements", "Plannings", "QR Codes"].map(
                            (label, idx) => (
                              <div
                                key={label}
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  idx === 0
                                    ? "bg-[#2563EB] text-white shadow-[0_8px_18px_rgba(37,99,235,0.35)]"
                                    : "text-slate-600"
                                }`}
                              >
                                {label}
                              </div>
                            )
                          )}
                        </div>
                      </aside>
                      <div className="bg-white p-4">
                        <h4 className="text-3xl font-black text-slate-900">Dashboard du club</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Vue d&apos;ensemble du club : membres, cotisations, finances.
                        </p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <p className="text-[11px] text-slate-500">Membres</p>
                            <p className="text-lg font-black text-slate-800">284</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <p className="text-[11px] text-slate-500">Cotisations</p>
                            <p className="text-lg font-black text-slate-800">92%</p>
                          </div>
                          <div className="rounded-lg border border-blue-200 bg-[#2563EB] p-2.5 text-white">
                            <p className="text-[11px] text-white/80">Solde du club</p>
                            <p className="text-lg font-black">0.00 CHF</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                          Rien d&apos;urgence pour le moment. Le club est à jour.
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="h-9 rounded-md bg-slate-100" />
                          <div className="h-9 rounded-md bg-slate-100" />
                          <div className="h-9 rounded-md bg-slate-100" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <ul className="grid content-start gap-3 rounded-2xl border border-white/20 bg-white/90 p-5 text-left text-sm text-slate-700 shadow-[0_16px_36px_rgba(2,6,23,0.16)]">
                    {[
                      {
                        title: "Membres et équipes centralisés",
                        description: "Toutes les informations du club sont regroupées dans une seule plateforme.",
                      },
                      {
                        title: "Cotisations envoyées en un clic",
                        description:
                          "Générez les cotisations et envoyez-les automatiquement à tous les membres par email.",
                      },
                      {
                        title: "Factures professionnelles",
                        description: "Créez et envoyez des factures propres en quelques secondes.",
                      },
                      {
                        title: "Organisation des manifestations simplifiée",
                        description: "Créez un planning d&apos;événement et partagez simplement le lien d&apos;inscription.",
                      },
                      {
                        title: "Inscriptions en ligne",
                        description:
                          "Les bénévoles et participants peuvent s&apos;inscrire directement via un lien partagé dans WhatsApp.",
                      },
                      {
                        title: "Suivi clair des finances",
                        description: "Toutes les cotisations et paiements sont visibles en temps réel.",
                      },
                      {
                        title: "Communication facilitée",
                        description: "Envoyez facilement des informations à vos membres.",
                      },
                      {
                        title: "Gain de temps énorme pour le comité",
                        description: "Moins d&apos;administration, plus de temps pour le club.",
                      },
                    ].map((item) => (
                      <li key={item.title} className="flex gap-2.5">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                            <path d="M5 13l4 4L19 7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto mt-20 w-[94%] max-w-[1180px]">
          <h2 className="text-center text-3xl font-black md:text-5xl">
            Tous les outils pour gérer votre club
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-center text-base text-blue-100 md:text-lg">
            Tout est centralisé dans une seule plateforme :
            membres, cotisations, manifestations, finances et communication.
          </p>
          <div className="mx-auto mt-10 max-w-[980px]">
            <div className="overflow-x-auto pb-2">
              <div className="mx-auto flex w-max min-w-full items-center justify-start gap-2 rounded-2xl border border-white/25 bg-white/10 p-2 backdrop-blur-sm md:justify-center">
                {featureTabs.map((feature) => {
                  const isActive = activeFeatureTab === feature.id;
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => setActiveFeatureTab(feature.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#1A23FF] text-white shadow-[0_12px_22px_rgba(26,35,255,0.35)]"
                          : "bg-white/90 text-slate-500 hover:bg-white hover:text-slate-700"
                      }`}
                    >
                      <FeatureTabIcon id={feature.id} />
                      <span>{feature.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_16px_35px_rgba(15,23,42,0.14)] animate-fade-in">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/10 text-[#1A23FF]">
                  <FeatureTabIcon id={currentFeature.id} />
                </span>
                <div>
                  <h3 className="text-xl font-black">{currentFeature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{currentFeature.description}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{currentFeature.details}</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-center text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-12">
            <h2 className="text-3xl font-black md:text-5xl">
              Moins d&apos;administratif. Plus de temps pour votre club.
            </h2>
            <p className="mx-auto mt-5 max-w-4xl text-base leading-relaxed text-slate-600 md:text-lg">
              Automatisez l&apos;essentiel, structurez vos données et concentrez l&apos;énergie du
              comité sur la vie sportive et les projets du club.
            </p>
          </div>
        </section>

        <section id="faq" className="mx-auto mt-20 w-[94%] max-w-[1040px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-12">
            <h2 className="text-center text-3xl font-black md:text-5xl">FAQ</h2>
            <div className="mt-8 space-y-3">
              {faqItems.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <article key={faq.question} className="overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFF]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="font-bold">{faq.question}</span>
                      <span className="text-2xl font-light text-[#1A23FF]">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen ? <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">{faq.answer}</p> : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="tarifs" className="mx-auto mt-20 w-[94%] max-w-[1040px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-center text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.22)] md:p-12">
            <h2 className="text-3xl font-black md:text-5xl">
              Simplifiez la gestion de votre club dès aujourd&apos;hui.
            </h2>
            <div className="mt-8">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-[#1A23FF] px-8 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(26,35,255,0.32)] transition hover:-translate-y-0.5"
              >
                Créer mon club gratuitement
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
