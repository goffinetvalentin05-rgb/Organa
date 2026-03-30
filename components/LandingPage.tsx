"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Coffee,
  FileText,
  LineChart,
  Mail,
  QrCode,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

const featureIconById: Record<FeatureTabId, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  manifestations: CalendarDays,
  buvette: Coffee,
  finances: LineChart,
  factures: FileText,
  inscriptions: QrCode,
  communication: Mail,
};

const featureTabs: Array<{
  id: FeatureTabId;
  title: string;
  description: string;
  details: string;
  highlights: [string, string, string];
}> = [
  {
    id: "membres",
    title: "Membres",
    description:
      "Centralisez les fiches membres, les équipes et toutes les informations utiles dans une seule base claire et organisée.",
    details:
      "Retrouvez rapidement les bonnes informations sans devoir jongler entre plusieurs fichiers.",
    highlights: [
      "Fiches et équipes au même endroit",
      "Coordonnées toujours à jour",
      "Recherche rapide dans la base",
    ],
  },
  {
    id: "cotisations",
    title: "Cotisations",
    description:
      "Générez les cotisations en quelques clics et envoyez-les automatiquement aux membres par email.",
    details:
      "Suivez facilement les paiements en attente pour garder une vue claire sur les encaissements du club.",
    highlights: [
      "Génération en un clic",
      "Envoi automatique par email",
      "Suivi des paiements en temps réel",
    ],
  },
  {
    id: "manifestations",
    title: "Manifestations",
    description:
      "Créez les événements du club et organisez les bénévoles simplement depuis une seule interface.",
    details:
      "Partagez un lien d'inscription pour permettre aux personnes de se positionner rapidement.",
    highlights: [
      "Calendrier et événements unifiés",
      "Inscription des bénévoles simplifiée",
      "Lien partageable en quelques secondes",
    ],
  },
  {
    id: "buvette",
    title: "Buvette",
    description:
      "Gérez les réservations de la buvette avec un calendrier simple et lisible.",
    details: "Créez automatiquement une facture lorsque la location est validée.",
    highlights: [
      "Calendrier clair des créneaux",
      "Facturation automatique à la validation",
      "Moins de gestion manuelle",
    ],
  },
  {
    id: "finances",
    title: "Finances",
    description:
      "Suivez les entrées et sorties d'argent du club dans une vue claire et structurée.",
    details: "Gardez en permanence une vision précise de la situation financière.",
    highlights: [
      "Entrées et sorties structurées",
      "Vue d'ensemble du club",
      "Situation lisible en un coup d’œil",
    ],
  },
  {
    id: "factures",
    title: "Factures",
    description:
      "Créez des factures propres et professionnelles en quelques secondes.",
    details: "Envoyez-les immédiatement par email sans devoir passer par un autre outil.",
    highlights: [
      "Modèles propres et professionnels",
      "Envoi par email intégré",
      "Création en quelques secondes",
    ],
  },
  {
    id: "inscriptions",
    title: "Inscriptions",
    description:
      "Créez un lien ou un QR code pour permettre aux participants de s'inscrire facilement à un repas, un événement ou une activité.",
    details: "Les réponses sont centralisées et plus simples à gérer pour le comité.",
    highlights: [
      "Lien ou QR code pour s'inscrire",
      "Réponses centralisées automatiquement",
      "Moins de relances pour le comité",
    ],
  },
  {
    id: "communication",
    title: "Communication",
    description:
      "Envoyez facilement des informations importantes aux membres ou aux participants d'un événement.",
    details: "Le club communique plus clairement sans dépendre uniquement de groupes WhatsApp.",
    highlights: [
      "Messages ciblés aux bons groupes",
      "Moins de dispersion sur WhatsApp",
      "Informations structurées pour le club",
    ],
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

const heroFloatingCardsData = [
  {
    title: "Inscriptions ouvertes",
    line1: "Repas après match",
    line2: "42 participants",
    secondary: "Lien ou QR code partagé au club",
    floatClass:
      "left-[6%] top-[74%] -rotate-6 md:left-[8%] md:top-[72%] lg:left-[14%] lg:top-[64%] animate-float [animation-delay:120ms]",
  },
  {
    title: "Planning manifestation",
    line1: "Soirée du club",
    line2: "8 bénévoles inscrits",
    secondary: "Organisation simple des bénévoles",
    floatClass:
      "right-[6%] top-[72%] rotate-6 md:right-[8%] md:top-[70%] lg:right-[14%] lg:top-[62%] animate-float [animation-delay:260ms]",
  },
  {
    title: "Cotisation annuelle",
    line1: "Envoyée aux membres",
    line2: "Équipe 1",
    secondary: "Envoi en 2 clics",
    floatClass:
      "left-1/2 top-[92%] -translate-x-1/2 rotate-[-2deg] md:top-[88%] lg:top-[96%] animate-float [animation-delay:400ms]",
  },
] as const;

function HeroCardInner({
  title,
  line1,
  line2,
  secondary,
  compact,
}: {
  title: string;
  line1: string;
  line2: string;
  secondary: string;
  compact?: boolean;
}) {
  return (
    <>
      <p
        className={`font-semibold uppercase tracking-[0.08em] text-slate-500 ${compact ? "text-[0.65rem]" : "text-xs"}`}
      >
        {title}
      </p>
      <p
        className={`font-black leading-tight text-[#1A23FF] ${compact ? "mt-1.5 text-xs" : "mt-2 text-sm"}`}
      >
        {line1}
      </p>
      <p className={`font-bold leading-tight text-slate-800 ${compact ? "mt-1 text-xs" : "mt-1 text-sm"}`}>
        {line2}
      </p>
      <p className={`mt-2 text-slate-500 ${compact ? "text-[0.65rem] leading-snug" : "text-xs"}`}>
        {secondary}
      </p>
    </>
  );
}

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
      className={`pointer-events-none absolute z-[1] hidden max-w-[min(220px,42vw)] rounded-2xl border border-slate-200/90 bg-white p-3 text-slate-900 shadow-[0_16px_32px_rgba(15,23,42,0.16)] backdrop-blur-sm md:block md:scale-[0.94] md:p-3.5 lg:max-w-[260px] lg:scale-100 lg:p-4 lg:shadow-[0_20px_40px_rgba(15,23,42,0.18)] ${className}`}
    >
      <HeroCardInner title={title} line1={line1} line2={line2} secondary={secondary} />
    </div>
  );
}

function FeatureTabIcon({ id, className }: { id: FeatureTabId; className?: string }) {
  const Icon = featureIconById[id];
  return <Icon className={className ?? "h-[1.125rem] w-[1.125rem] shrink-0"} strokeWidth={1.75} aria-hidden />;
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

            <div className="relative mt-8 min-h-0 overflow-x-hidden overflow-y-visible p-5 pb-8 md:min-h-[500px] md:pb-12 lg:min-h-[460px] lg:pb-10">
              <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:36px_36px]" />
              <div className="pointer-events-none absolute inset-0 rounded-t-[26px] border border-b-0 border-white/25" />

              <div className="relative z-20">
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
                      className="inline-flex w-full max-w-md items-center justify-center rounded-full bg-white px-7 py-3 text-base font-bold text-[#1A23FF] shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 sm:w-auto"
                    >
                      Créer mon club gratuitement
                    </Link>
                    <a
                      href="#comparaison"
                      className="inline-flex w-full max-w-md items-center justify-center rounded-full border border-white/45 px-7 py-3 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
                    >
                      Voir comment ça fonctionne
                    </a>
                  </div>
                </div>

                {/* Mobile : cartes en flux sous le texte (aucun chevauchement) */}
                <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-4 sm:max-w-2xl sm:grid-cols-2 md:hidden">
                  {heroFloatingCardsData.map((card, i) => (
                    <div
                      key={card.title}
                      className={`rounded-2xl border border-slate-200/90 bg-white p-4 text-left text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.14)] ${i === 2 ? "sm:col-span-2 sm:mx-auto sm:max-w-md" : ""}`}
                    >
                      <HeroCardInner
                        title={card.title}
                        line1={card.line1}
                        line2={card.line2}
                        secondary={card.secondary}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Tablette + desktop : cartes flottantes (md+ uniquement, positions md vs lg) */}
              {heroFloatingCardsData.map((card) => (
                <HeroFloatingCard
                  key={`float-${card.title}`}
                  className={card.floatClass}
                  title={card.title}
                  line1={card.line1}
                  line2={card.line2}
                  secondary={card.secondary}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="probleme" className="mx-auto mt-28 w-[94%] max-w-[1160px]">
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
              Passez d&apos;une gestion compliquée à une organisation claire
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base text-blue-100 md:text-lg">
              Découvrez comment Obillz simplifie l&apos;organisation de votre club.
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

        <section
          id="fonctionnalites"
          className="relative mx-auto mt-20 w-[94%] max-w-[1180px] scroll-mt-24 pb-4 pt-6 md:pb-10 md:pt-10"
        >
          <div
            className="pointer-events-none absolute inset-x-0 -top-8 bottom-0 -z-0 rounded-[2rem] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.1),transparent_55%)]"
            aria-hidden
          />
          <div className="relative z-10">
            <h2 className="text-center text-3xl font-black md:text-5xl">
              Tous les outils pour gérer votre club
            </h2>
            <p className="mx-auto mt-5 max-w-4xl text-center text-base leading-relaxed text-blue-100 md:mt-6 md:text-lg">
              Tout est centralisé dans une seule plateforme : membres, cotisations, manifestations,
              finances et communication.
            </p>

            {/* Navigation : une grille responsive (2 → 4 → 8 colonnes), un seul jeu de boutons */}
            <div className="mx-auto mt-12 max-w-[1040px] md:mt-14 lg:mt-16" role="tablist" aria-label="Fonctionnalités">
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-4 xl:grid-cols-8">
                {featureTabs.map((feature) => {
                  const isActive = activeFeatureTab === feature.id;
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFeatureTab(feature.id)}
                      className={`group flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center text-[0.65rem] font-semibold uppercase leading-tight tracking-wide transition duration-200 sm:text-xs md:flex-row md:gap-2 md:px-3 md:text-sm md:normal-case md:tracking-normal ${
                        isActive
                          ? "border-white/40 bg-[#1A23FF] text-white shadow-[0_10px_28px_rgba(26,35,255,0.45)] ring-2 ring-white/25"
                          : "border-white/20 bg-white/10 text-blue-50 backdrop-blur-md hover:border-white/35 hover:bg-white/18 hover:shadow-[0_6px_20px_rgba(2,6,23,0.15)]"
                      }`}
                    >
                      <FeatureTabIcon
                        id={feature.id}
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105 md:h-[1.125rem] md:w-[1.125rem] ${isActive ? "text-white" : "text-blue-100"}`}
                      />
                      <span className="line-clamp-2 md:truncate">{feature.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Carte contenu */}
            <div className="mx-auto mt-8 max-w-[980px] md:mt-10">
              <AnimatePresence mode="wait">
                <motion.article
                  key={activeFeatureTab}
                  role="tabpanel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-white/20 bg-white/95 p-6 text-slate-900 shadow-[0_16px_48px_rgba(2,6,23,0.2)] backdrop-blur-sm md:p-8"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1A23FF]/10 text-[#1A23FF] ring-1 ring-[#1A23FF]/15">
                      <FeatureTabIcon id={currentFeature.id} className="h-6 w-6 text-[#1A23FF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">
                        {currentFeature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
                        {currentFeature.description}
                      </p>
                      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                        {currentFeature.highlights.map((line) => (
                          <li key={line} className="flex gap-3 text-sm text-slate-600 md:text-[0.9375rem]">
                            <span
                              className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A23FF]"
                              aria-hidden
                            />
                            <span className="leading-relaxed">{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="p-2 text-center text-white md:p-4">
            <h2 className="text-3xl font-black md:text-5xl">
              Moins d&apos;administratif. Plus de temps pour votre club.
            </h2>
            <p className="mx-auto mt-5 max-w-4xl text-base leading-relaxed text-blue-100 md:text-lg">
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
