"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Coffee,
  FileText,
  LineChart,
  Mail,
  MessageCircle,
  QrCode,
  TrendingUp,
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
    <main className="relative min-h-screen bg-[var(--obillz-hero-blue)] text-white">
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

            <div className="relative mt-8 p-5 pb-32 md:pb-44 lg:pb-40">
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

        <section
          id="comparaison"
          className="mx-auto mt-20 w-[94%] max-w-[1160px] scroll-mt-24 overflow-x-hidden"
        >
          <div className="text-center">
            <h2 className="text-3xl font-black leading-tight text-white md:text-5xl">
              Passez d&apos;une gestion compliquée à une organisation claire
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-blue-100/95 md:text-lg">
              Trop d&apos;outils, trop de tâches manuelles, trop de flou — puis une seule plateforme pour
              piloter votre club avec une vue nette et une vraie tranquillité d&apos;esprit.
            </p>
            <div
              className="mt-8 inline-flex rounded-full border border-white/30 bg-white/[0.12] p-1.5 shadow-[0_16px_40px_rgba(2,6,23,0.35)] backdrop-blur-md"
              role="group"
              aria-label="Comparer sans et avec Obillz"
            >
              <button
                type="button"
                onClick={() => setComparisonView("without")}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 md:px-8 md:py-3 md:text-[0.9375rem] ${
                  comparisonView === "without"
                    ? "bg-white text-[#1A23FF] shadow-[0_4px_20px_rgba(26,35,255,0.35)] ring-2 ring-white/25"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                Sans Obillz
              </button>
              <button
                type="button"
                onClick={() => setComparisonView("with")}
                className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 md:px-8 md:py-3 md:text-[0.9375rem] ${
                  comparisonView === "with"
                    ? "bg-white text-[#1A23FF] shadow-[0_4px_20px_rgba(26,35,255,0.35)] ring-2 ring-white/25"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                Avec Obillz
              </button>
            </div>
          </div>

          <div className="relative mx-auto mt-10 max-w-[1080px] md:mt-12">
            <AnimatePresence mode="wait">
              {comparisonView === "without" ? (
                <motion.div
                  key="without"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-8"
                >
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90 md:text-sm">
                    Le quotidien sans outil centralisé
                  </p>
                  <div className="relative mx-auto min-h-[380px] max-w-4xl md:min-h-[340px]">
                    <div className="absolute left-0 top-0 z-[3] w-[92%] max-w-[340px] rotate-[-2deg] rounded-xl border border-slate-300/90 bg-white p-3 shadow-[0_12px_30px_rgba(2,6,23,0.18)] md:left-1 md:top-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="truncate text-[10px] font-semibold text-slate-500 md:text-xs">
                          membres_2024_FINAL_v2.xlsx
                        </span>
                        <span className="text-[9px] text-amber-600">Non enregistré</span>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2 font-mono text-[9px] text-slate-600 md:text-[10px]">
                        <span className="text-slate-400">Nom</span>
                        <span className="text-slate-400">Cotis.</span>
                        <span className="text-slate-400">Tel.</span>
                        <span className="text-slate-400">?</span>
                        <span className="col-span-4 border-t border-dashed border-slate-200 pt-1 text-red-500">
                          #REF!
                        </span>
                      </div>
                    </div>
                    <div className="absolute right-0 top-24 z-[2] w-[88%] max-w-[300px] rotate-[3deg] rounded-2xl border border-emerald-600/20 bg-[#E7FCE3] p-3 shadow-[0_12px_28px_rgba(2,6,23,0.2)] md:right-2 md:top-20">
                      <div className="flex items-center gap-2 border-b border-emerald-100/80 pb-2">
                        <MessageCircle className="h-4 w-4 text-emerald-700" strokeWidth={1.75} />
                        <span className="text-[10px] font-bold text-emerald-900">Groupe WhatsApp</span>
                      </div>
                      <p className="mt-2 text-[10px] leading-snug text-emerald-900/90">
                        &quot;Qui peut tenir le bar samedi ???&quot;
                      </p>
                      <p className="mt-1 text-[9px] text-emerald-700/80">+12 messages non lus</p>
                    </div>
                    <div className="absolute left-4 top-[200px] z-[4] w-[75%] max-w-[260px] rotate-[1deg] rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-md md:left-8 md:top-[180px]">
                      <p className="text-[10px] font-bold text-amber-900">Post-it</p>
                      <p className="mt-1 text-[10px] leading-snug text-amber-800">
                        Relancer M. Dupont — cotisation pas reçue
                      </p>
                    </div>
                    <div className="absolute right-6 top-[8px] z-[1] w-[70%] max-w-[220px] rotate-[-4deg] rounded-lg border border-slate-200 bg-slate-50 p-2.5 opacity-90 md:right-10">
                      <p className="text-[9px] font-semibold text-slate-500">Facture buvette</p>
                      <p className="text-[10px] text-slate-500">brouillon.pdf — à envoyer</p>
                    </div>
                    <div className="absolute bottom-0 left-1/2 z-[2] w-[90%] max-w-[320px] -translate-x-1/2 rotate-[-1deg] rounded-xl border border-slate-200 bg-white p-3 shadow-lg md:bottom-2">
                      <p className="text-[10px] font-bold text-slate-800">Match samedi 18h</p>
                      <p className="mt-1 text-[9px] text-slate-500">Bénévoles : 3 non confirmés</p>
                      <p className="mt-1 text-[9px] text-amber-700">Sponsor : paiement non suivi</p>
                    </div>
                  </div>
                  <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-2 text-center text-xs text-blue-100/95 md:text-sm">
                    {[
                      "Temps perdu à chercher l’information",
                      "Cotisations suivies à la main",
                      "Événements compliqués à organiser",
                      "Communication éparpillée",
                      "Risque d’oubli et d’erreurs",
                    ].map((line) => (
                      <li key={line} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-amber-300/90" aria-hidden />
                        {line}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="with"
                  role="tabpanel"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90 md:text-sm">
                    Une seule plateforme — tout est visible
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-white/25 bg-white shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3 md:px-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A23FF] text-[10px] font-black text-white">
                          O
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tableau de bord</p>
                          <p className="text-sm font-bold text-slate-900">FC Les Bleus</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 md:text-xs">
                        <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 sm:inline">
                          À jour
                        </span>
                        <span className="text-slate-400">Vue du jour</span>
                      </div>
                    </div>
                    <div className="p-4 md:p-6">
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 md:p-4">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Users className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                            <span className="text-[11px] font-medium md:text-xs">Membres actifs</span>
                          </div>
                          <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 md:text-3xl">284</p>
                          <p className="mt-0.5 text-[10px] text-emerald-600">+12 cette saison</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 md:p-4">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Wallet className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                            <span className="text-[11px] font-medium md:text-xs">Cotisations</span>
                          </div>
                          <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 md:text-3xl">94%</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">6 en attente</p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-[#1A23FF]/[0.06] p-3 md:p-4">
                          <div className="flex items-center gap-2 text-[#1A23FF]">
                            <TrendingUp className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                            <span className="text-[11px] font-medium md:text-xs">Trésorerie</span>
                          </div>
                          <p className="mt-2 text-xl font-black tabular-nums text-slate-900 md:text-2xl">12 480 €</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">Solde du mois</p>
                        </div>
                        <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 md:col-span-1 md:p-4">
                          <div className="flex items-center gap-2 text-slate-500">
                            <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                            <span className="text-[11px] font-medium md:text-xs">À venir</span>
                          </div>
                          <p className="mt-2 text-sm font-bold text-slate-900">3 événements</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">Prochain : dim. 14h</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-slate-100 bg-white p-3 md:p-4">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Activité récente</p>
                          <ul className="mt-3 space-y-2.5">
                            {(
                              [
                                ["Cotisation reçue", "Martin D.", "il y a 2 h"],
                                ["Inscription repas", "32 participants", "hier"],
                                ["Bénévole confirmé", "Bar — samedi", "hier"],
                              ] as const
                            ).map(([a, b, c]) => (
                              <li key={a} className="flex items-start justify-between gap-2 text-[11px] md:text-xs">
                                <span className="font-medium text-slate-800">{a}</span>
                                <span className="text-right text-slate-500">
                                  {b}
                                  <br />
                                  <span className="text-[10px] text-slate-400">{c}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 md:p-4">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={1.75} />
                            <div>
                              <p className="text-sm font-bold text-emerald-900">Rien d&apos;urgence</p>
                              <p className="mt-1 text-[11px] leading-relaxed text-emerald-800/90 md:text-xs">
                                Cotisations, événements et messages : tout est suivi. Vous gardez le contrôle sans
                                courir après chaque détail.
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 border-t border-emerald-100/80 pt-3">
                            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                              Inscriptions ouvertes
                            </span>
                            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                              8 bénévoles OK
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
