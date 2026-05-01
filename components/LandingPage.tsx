"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Coffee,
  FileText,
  LayoutDashboard,
  LineChart,
  Mail,
  MessageCircle,
  Plus,
  QrCode,
  Receipt,
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
      "left-[6%] top-[74%] -rotate-6 md:left-[3%] md:top-[78%] lg:left-[3%] lg:top-[78%] animate-float [animation-delay:120ms]",
  },
  {
    title: "Planning manifestation",
    line1: "Soirée du club",
    line2: "8 bénévoles inscrits",
    secondary: "Organisation simple des bénévoles",
    floatClass:
      "right-[6%] top-[72%] rotate-6 md:right-[3%] md:top-[78%] lg:right-[3%] lg:top-[78%] animate-float [animation-delay:260ms]",
  },
  {
    title: "Cotisation annuelle",
    line1: "Envoyée aux membres",
    line2: "Équipe 1",
    secondary: "Envoi en 2 clics",
    floatClass:
      "left-1/2 top-[92%] -translate-x-1/2 rotate-[-2deg] md:top-[92%] lg:top-[96%] animate-float [animation-delay:400ms]",
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

function SwissFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Drapeau suisse"
      role="img"
    >
      <rect width="32" height="32" fill="#DA291C" />
      <path d="M13.5 7h5v5.5H24v5h-5.5V23h-5v-5.5H8v-5h5.5z" fill="#FFFFFF" />
    </svg>
  );
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
            <header className="mx-auto flex max-w-[1040px] items-center justify-between gap-4">
              <Link href="/" className="transition hover:opacity-95">
                <Image src="/logo-obillz.png" alt="Obillz" width={124} height={30} priority />
              </Link>
              <nav className="hidden items-center gap-2 md:flex">
                <a
                  href="/#fonctionnalites"
                  className="rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/20"
                >
                  Fonctions
                </a>
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

            <div className="relative mt-4 p-4 pb-16 sm:p-5 md:mt-6 md:pb-48 lg:pb-56">
              <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:36px_36px]" />
              <div className="pointer-events-none absolute inset-0 rounded-t-[26px] border border-b-0 border-white/25" />

              <div className="relative z-20">
                <div className="mt-10 text-center md:mt-20 lg:mt-24">
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

        <section id="probleme" className="mx-auto mt-24 w-[94%] max-w-[1160px] md:mt-36 lg:mt-44">
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
                  className="space-y-6 md:space-y-8"
                >
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90 md:text-sm">
                    Le quotidien sans outil centralisé
                  </p>

                  {/* Mobile : pile verticale lisible (pas de chaos) */}
                  <div className="mx-auto max-w-md space-y-4 md:hidden">
                    <div className="rounded-[20px] bg-[#0B141A] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
                      <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]/20">
                          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Comité du club</p>
                          <p className="text-[9px] text-white/45">Groupe WhatsApp</p>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-lg bg-[#202C33] p-2.5">
                        <div className="ml-4 max-w-[92%] rounded-lg rounded-tr-sm bg-[#005C4B] px-2.5 py-2 text-[11px] leading-snug text-white/95">
                          Qui peut tenir la buvette samedi ?
                        </div>
                        <div className="ml-4 max-w-[92%] rounded-lg rounded-tr-sm bg-[#005C4B] px-2.5 py-2 text-[11px] leading-snug text-white/95">
                          On n&apos;a pas la liste des bénévoles <span aria-hidden>😅</span>
                        </div>
                        <p className="pr-1 text-right text-[9px] text-[#8696A0]">+12 messages non lus</p>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-sm border border-slate-400/60 bg-white shadow-[0_6px_24px_rgba(2,6,23,0.18)]">
                      <div className="flex items-center gap-1.5 bg-[#217346] px-2 py-1.5">
                        <span className="text-[9px] text-white/90">●●●</span>
                        <span className="flex-1 truncate text-center text-[10px] font-medium text-white">
                          membres_2024_FINAL_v3.xlsx
                        </span>
                      </div>
                      <div className="border-b border-slate-200 bg-slate-100 px-2 py-1 font-mono text-[9px] text-slate-600">
                        A1: Nom <span className="text-slate-300">|</span> B1: Cotis.
                      </div>
                      <div className="bg-white p-2 font-mono text-[9px] leading-relaxed text-slate-700">
                        <div className="grid grid-cols-[1fr_1fr] gap-x-3 border-b border-slate-100 pb-1">
                          <span>Dupont</span>
                          <span className="text-right text-slate-400">?</span>
                        </div>
                        <p className="mt-2 text-red-600">#REF!</p>
                        <p className="text-[9px] text-amber-700">Fichier non enregistré</p>
                      </div>
                    </div>
                    <div className="relative -rotate-[0.5deg] border border-amber-200/80 bg-[#FFF8D6] px-3 py-3 shadow-[4px_5px_0_rgba(15,23,42,0.12)]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70">Note</p>
                      <p className="mt-1 text-sm font-medium leading-snug text-amber-950">
                        Relancer Dupont — cotisation pas reçue
                      </p>
                    </div>
                    <div className="border-l-4 border-slate-500 bg-[#FAFAF9] px-3 py-3 shadow-[0_4px_20px_rgba(2,6,23,0.12)]">
                      <p className="text-[11px] font-semibold text-slate-600">Facture buvette — non envoyée</p>
                      <p className="mt-3 text-sm font-bold text-slate-900">Match samedi 18h</p>
                      <p className="mt-1 text-[11px] text-slate-600">3 bénévoles non confirmés</p>
                      <p className="mt-1 text-[11px] text-amber-800">Sponsor : paiement non suivi</p>
                    </div>
                  </div>

                  {/* Desktop : scène bureau — styles variés, chaos maîtrisé */}
                  <div className="relative mx-auto hidden min-h-[460px] max-w-[900px] md:block lg:min-h-[480px]">
                    <div
                      className="absolute left-0 top-2 z-[3] w-[min(100%,340px)] shadow-[0_14px_40px_rgba(2,6,23,0.22)]"
                      style={{ transform: "rotate(-2.5deg)" }}
                    >
                      <div className="overflow-hidden rounded-sm border border-slate-500/40 bg-white">
                        <div className="flex items-center gap-2 bg-[#217346] px-2.5 py-2">
                          <span className="text-[10px] text-white/80">● ● ●</span>
                          <span className="flex-1 truncate text-center text-[11px] font-medium text-white">
                            membres_2024_FINAL_v3.xlsx
                          </span>
                        </div>
                        <div className="border-b border-slate-200 bg-[#F3F3F3] px-2 py-1.5 font-mono text-[10px] text-slate-600">
                          Feuille1
                        </div>
                        <div className="p-3 font-mono text-[10px] text-slate-800">
                          <div className="grid grid-cols-4 gap-2 border-b border-slate-200 pb-1 text-slate-400">
                            <span>A</span>
                            <span>B</span>
                            <span>C</span>
                            <span>D</span>
                          </div>
                          <p className="mt-2 font-bold text-red-600">#REF!</p>
                          <p className="mt-1 text-[9px] text-amber-700">Non enregistré · dernière modif ?</p>
                        </div>
                      </div>
                    </div>
                    <div
                      className="absolute right-0 top-6 z-[4] w-[min(100%,300px)] shadow-[0_16px_44px_rgba(0,0,0,0.28)]"
                      style={{ transform: "rotate(3.5deg)" }}
                    >
                      <div className="rounded-[22px] bg-[#0B141A] p-3">
                        <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/25 text-xs">
                            <MessageCircle className="h-4 w-4 text-[#25D366]" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-white">Comité du club</p>
                            <p className="text-[9px] text-white/45">en ligne</p>
                          </div>
                        </div>
                        <div className="space-y-2 rounded-xl bg-[#202C33] p-2.5">
                          <div className="ml-6 max-w-[94%] rounded-2xl rounded-tr-md bg-[#005C4B] px-3 py-2 text-[11px] leading-snug text-white">
                            Qui peut tenir la buvette samedi ?
                          </div>
                          <div className="ml-6 max-w-[94%] rounded-2xl rounded-tr-md bg-[#005C4B] px-3 py-2 text-[11px] leading-snug text-white">
                            On n&apos;a pas la liste des bénévoles <span aria-hidden>😅</span>
                          </div>
                          <p className="pr-1 text-right text-[10px] font-medium text-[#8696A0]">+12 messages non lus</p>
                        </div>
                      </div>
                    </div>
                    <div
                      className="absolute left-[8%] top-[210px] z-[5] w-[min(88%,260px)] border border-amber-300/90 bg-[#FFFACD] px-3 py-3 shadow-[5px_6px_0_rgba(15,23,42,0.14)]"
                      style={{ transform: "rotate(4deg)" }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900/55">Post-it</p>
                      <p className="mt-1.5 text-[12px] font-semibold leading-snug text-amber-950">
                        Relancer Dupont — cotisation pas reçue
                      </p>
                    </div>
                    <div
                      className="absolute right-[12%] top-0 z-[2] w-[min(72%,200px)] border border-slate-300 bg-[#F4F4F3] px-2.5 py-2 shadow-[0_8px_20px_rgba(2,6,23,0.15)]"
                      style={{ transform: "rotate(-4deg)" }}
                    >
                      <p className="text-[9px] uppercase tracking-wide text-slate-500">Brouillon</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-800">Facture buvette</p>
                      <p className="text-[10px] text-slate-500">Non envoyée</p>
                    </div>
                    <div
                      className="absolute bottom-4 left-1/2 z-[3] w-[min(94%,360px)] border-l-[5px] border-l-rose-500 bg-white px-4 py-3 shadow-[0_12px_36px_rgba(2,6,23,0.2)]"
                      style={{ transform: "translateX(-50%) rotate(-1.5deg)" }}
                    >
                      <p className="text-[12px] font-black text-slate-900">Match samedi · 18h</p>
                      <p className="mt-1.5 text-[11px] text-slate-600">3 bénévoles non confirmés</p>
                      <p className="mt-1 text-[11px] font-medium text-amber-800">Sponsor : paiement non suivi</p>
                    </div>
                  </div>
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

                  {/* Mobile : pile verticale, lisible, sans dispersion */}
                  <div className="overflow-hidden rounded-2xl border border-white/25 bg-white shadow-[0_20px_50px_rgba(2,6,23,0.22)] md:hidden">
                    <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-4 text-center">
                      <p className="text-lg font-black text-slate-900">Dashboard du club</p>
                      <p className="mt-1 text-xs leading-snug text-slate-500">
                        Vue d&apos;ensemble : membres, cotisations, finances
                      </p>
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[11px] font-semibold text-slate-500">Membres</p>
                          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">284</p>
                          <p className="mt-1 text-[10px] text-emerald-600">+12 ce mois</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-[11px] font-semibold text-slate-500">Cotisations</p>
                          <p className="mt-1 text-2xl font-black tabular-nums text-slate-900">92%</p>
                          <p className="mt-1 text-[10px] text-slate-500">En attente : 8%</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#1A23FF]/20 bg-[#1A23FF]/[0.06] p-4">
                        <p className="text-[11px] font-semibold text-[#1A23FF]">Solde du club</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">À jour</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">Vue consolidée en temps réel</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">À traiter</p>
                        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/90 p-4">
                          <p className="text-sm font-bold text-slate-900">Facture #2026-003</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">Paiement en attente</p>
                          <p className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            À relancer
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Action rapide</p>
                        <div className="mt-2 flex flex-col gap-2">
                          <span className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800">
                            <Plus className="h-4 w-4 text-[#1A23FF]" strokeWidth={2} />
                            Ajouter un membre
                          </span>
                          <span className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800">
                            <Plus className="h-4 w-4 text-[#1A23FF]" strokeWidth={2} />
                            Envoyer cotisation
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop : sidebar + zone principale type produit */}
                  <div className="hidden overflow-hidden rounded-2xl border border-white/25 bg-white shadow-[0_24px_60px_rgba(2,6,23,0.28)] md:block">
                    <div className="flex">
                      <aside className="w-[168px] shrink-0 border-r border-slate-200 bg-[#F4F7FB] px-3 py-4 lg:w-[188px]">
                        <div className="mb-4 flex items-center gap-2 px-1">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A23FF] text-[11px] font-black text-white">
                            O
                          </div>
                          <span className="truncate text-xs font-bold text-slate-800">Obillz</span>
                        </div>
                        <nav className="space-y-1" aria-label="Navigation">
                          <div className="flex items-center gap-2 rounded-lg bg-[#1A23FF] px-2.5 py-2 text-xs font-semibold text-white shadow-sm">
                            <LayoutDashboard className="h-3.5 w-3.5 shrink-0 opacity-95" strokeWidth={2} />
                            <span className="truncate">Dashboard du club</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600">
                            <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">Membres</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600">
                            <Wallet className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">Cotisations</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600">
                            <Receipt className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">Factures</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">Événements</span>
                          </div>
                        </nav>
                      </aside>
                      <div className="min-w-0 flex-1">
                        <div className="border-b border-slate-100 bg-white px-5 py-4 lg:px-6">
                          <h4 className="text-lg font-black tracking-tight text-slate-900 lg:text-xl">
                            Dashboard du club
                          </h4>
                          <p className="mt-1 text-xs text-slate-500 lg:text-sm">
                            Vue d&apos;ensemble : membres, cotisations, finances
                          </p>
                        </div>
                        <div className="space-y-6 p-5 lg:p-6">
                          <div className="grid grid-cols-4 gap-3 lg:gap-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 lg:p-4">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Users className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" strokeWidth={1.75} />
                                <span className="text-[10px] font-semibold lg:text-[11px]">Membres</span>
                              </div>
                              <p className="mt-2 text-xl font-black tabular-nums text-slate-900 lg:text-2xl">284</p>
                              <p className="mt-1 text-[10px] text-emerald-600">+12 ce mois</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 lg:p-4">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Wallet className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" strokeWidth={1.75} />
                                <span className="text-[10px] font-semibold lg:text-[11px]">Cotisations</span>
                              </div>
                              <p className="mt-2 text-xl font-black tabular-nums text-slate-900 lg:text-2xl">92%</p>
                              <p className="mt-1 text-[10px] text-slate-500">En attente : 8%</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 lg:p-4">
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <FileText className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" strokeWidth={1.75} />
                                <span className="text-[10px] font-semibold lg:text-[11px]">Factures</span>
                              </div>
                              <p className="mt-2 text-xl font-black tabular-nums text-slate-900 lg:text-2xl">4</p>
                              <p className="mt-1 text-[10px] text-amber-700">En retard</p>
                            </div>
                            <div className="rounded-xl border border-[#1A23FF]/20 bg-[#1A23FF]/[0.06] p-3 lg:p-4">
                              <p className="text-[10px] font-semibold text-[#1A23FF] lg:text-[11px]">Solde du club</p>
                              <p className="mt-2 text-lg font-black text-slate-900 lg:text-xl">À jour</p>
                              <p className="mt-0.5 text-[9px] text-slate-500">Vue consolidée</p>
                            </div>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                À traiter maintenant
                              </p>
                              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/90 p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">Facture #2026-003</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-700">Paiement en attente</p>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                    À relancer
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                Actions rapides
                              </p>
                              <div className="mt-2 flex flex-col gap-2">
                                <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-sm">
                                  <Plus className="h-3.5 w-3.5 text-[#1A23FF]" strokeWidth={2} />
                                  Nouvelle cotisation
                                </span>
                                <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-sm">
                                  <Plus className="h-3.5 w-3.5 text-[#1A23FF]" strokeWidth={2} />
                                  Nouvelle facture
                                </span>
                                <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-sm">
                                  <Plus className="h-3.5 w-3.5 text-[#1A23FF]" strokeWidth={2} />
                                  Ajouter un membre
                                </span>
                              </div>
                            </div>
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

        <section className="mx-auto mt-12 w-[94%] max-w-[1040px] md:mt-16">
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

        <footer className="mx-auto mt-16 w-[94%] max-w-[1160px] md:mt-20">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.22)] md:p-12 lg:p-14">
            <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr] md:gap-12">
              <div>
                <Link href="/" className="inline-flex transition hover:opacity-90">
                  <Image src="/logo-obillz.png" alt="Obillz" width={132} height={32} />
                </Link>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                  Un logiciel simple pour gérer votre club, vos membres, vos cotisations et vos
                  documents au même endroit.
                </p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-[#1A23FF] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(26,35,255,0.28)] transition hover:-translate-y-0.5"
                  >
                    Créer mon club gratuitement
                  </Link>
                  <Link
                    href="/connexion"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Connexion
                  </Link>
                </div>
              </div>

              <nav aria-label="Explorer">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Explorer
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href="/#fonctionnalites"
                      className="text-slate-700 transition hover:text-[#1A23FF]"
                    >
                      Fonctionnalités
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/inscription"
                      className="text-slate-700 transition hover:text-[#1A23FF]"
                    >
                      Créer mon club
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/connexion"
                      className="text-slate-700 transition hover:text-[#1A23FF]"
                    >
                      Connexion
                    </Link>
                  </li>
                </ul>
              </nav>

              <nav aria-label="Légal">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Légal
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link
                      href="/conditions-utilisation"
                      className="text-slate-700 transition hover:text-[#1A23FF]"
                    >
                      Conditions d&apos;utilisation
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/politique-confidentialite"
                      className="text-slate-700 transition hover:text-[#1A23FF]"
                    >
                      Politique de confidentialité
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:gap-5 md:mt-12">
              <SwissFlag className="h-10 w-10 shrink-0 rounded-md shadow-[0_2px_6px_rgba(15,23,42,0.12)]" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Conçu en Suisse</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 md:text-[0.8125rem]">
                  Obillz est un logiciel suisse, développé et hébergé en Suisse, pensé pour les
                  clubs locaux.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
              <span>Obillz · Gestion de clubs sportifs</span>
              <span>© {new Date().getFullYear()} Obillz</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
