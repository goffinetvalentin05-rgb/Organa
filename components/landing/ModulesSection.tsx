"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Coffee,
  Globe,
  Receipt,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

type ModuleItem = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  icon: LucideIcon;
  preview: { headline: string; sub: string; chips: string[] };
};

const modules: ModuleItem[] = [
  {
    id: "membres",
    title: "Membres",
    tagline: "Toute votre équipe, une seule liste",
    description:
      "Centralisez les joueurs, licenciés et comité. Chaque membre a sa fiche, ses cotisations et son historique au même endroit.",
    bullets: ["Fiches claires et à jour", "Import depuis Excel", "Export pour l'AG en un clic"],
    icon: Users,
    preview: {
      headline: "284 membres",
      sub: "12 nouveaux ce mois",
      chips: ["Actifs", "Comité", "Juniors"],
    },
  },
  {
    id: "cotisations",
    title: "Cotisations",
    tagline: "Envoyez et suivez sans relances manuelles",
    description:
      "Générez les cotisations de saison, envoyez-les par e-mail et voyez immédiatement qui a payé ou qui est en attente.",
    bullets: ["Envoi groupé par e-mail", "Relances ciblées", "Statut en temps réel"],
    icon: Wallet,
    preview: {
      headline: "92% payées",
      sub: "8% en attente · saison 25/26",
      chips: ["Envoyées", "Payées", "À relancer"],
    },
  },
  {
    id: "factures",
    title: "Factures",
    tagline: "Des documents pro, envoyés vite",
    description:
      "Créez des factures propres pour sponsors ou prestataires et suivez les paiements sans quitter Obillz.",
    bullets: ["Modèles prêts à l'emploi", "Envoi PDF par e-mail", "Suivi payé / impayé"],
    icon: Receipt,
    preview: {
      headline: "17 factures",
      sub: "4 en attente de paiement",
      chips: ["Brouillon", "Envoyée", "Payée"],
    },
  },
  {
    id: "evenements",
    title: "Événements",
    tagline: "Inscriptions et plannings simplifiés",
    description:
      "Tournois, repas de club, corvées : partagez un lien ou un QR code et récupérez toutes les réponses au même endroit.",
    bullets: ["Lien ou QR code public", "Liste des inscrits", "Plannings après-match"],
    icon: CalendarDays,
    preview: {
      headline: "3 événements",
      sub: "42 inscriptions cette semaine",
      chips: ["À venir", "Inscriptions", "Terminé"],
    },
  },
  {
    id: "paiements",
    title: "Paiements",
    tagline: "Encaissements visibles en direct",
    description:
      "Cotisations, buvette, événements : suivez les entrées d'argent et gardez une vue claire sur la trésorerie du club.",
    bullets: ["Solde club en direct", "Historique des encaissements", "Vue par catégorie"],
    icon: CreditCard,
    preview: {
      headline: "CHF 8'420",
      sub: "encaissés · 30 derniers jours",
      chips: ["Cotisations", "Buvette", "Événements"],
    },
  },
  {
    id: "depenses",
    title: "Dépenses",
    tagline: "Charges du club sous contrôle",
    description:
      "Enregistrez les dépenses du club et gardez une comptabilité lisible aux côtés des recettes et cotisations.",
    bullets: ["Saisie rapide", "Catégories personnalisées", "Vue avec les recettes"],
    icon: TrendingDown,
    preview: {
      headline: "Suivi charges",
      sub: "Matériel, déplacements, licences",
      chips: ["À valider", "Payé", "Archivé"],
    },
  },
  {
    id: "buvette",
    title: "Buvette",
    tagline: "Réservations sans chaos",
    description:
      "Gérez les créneaux buvette, les demandes et les confirmations pour les matchs et événements du club.",
    bullets: ["Calendrier des créneaux", "Demandes centralisées", "Moins de messages perdus"],
    icon: Coffee,
    preview: {
      headline: "Créneaux buvette",
      sub: "Samedi 14h–18h · confirmé",
      chips: ["Demandé", "Confirmé", "Passé"],
    },
  },
  {
    id: "page-publique",
    title: "Page publique",
    tagline: "Votre vitrine en ligne",
    description:
      "Une page web du club pour présenter l'équipe, le programme des matchs et les liens utiles aux membres.",
    bullets: ["URL personnalisée", "Logo et couleurs du club", "Liens inscriptions & buvette"],
    icon: Globe,
    preview: {
      headline: "Page du club",
      sub: "Matchs · contact · liens utiles",
      chips: ["Programme", "Buvette", "Contact"],
    },
  },
];

const AUTO_MS = 5200;

export default function ModulesSection() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive(index);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 12000);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % modules.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion]);

  const current = modules[active];
  const Icon = current.icon;

  return (
    <section id="modules" className="relative scroll-mt-24 py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-x-[5%] top-1/2 h-[min(420px,60vh)] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.2),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1160px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            Fonctionnalités
          </p>
          <h2 className="mt-3 text-balance text-2xl font-black text-white md:text-4xl">
            Tout le club au même endroit.
          </h2>
          <p className="mt-4 text-sm text-blue-100/70 md:text-base">
            Cliquez sur un module pour explorer — la présentation défile aussi toute seule.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easePremium }}
          className="mt-10 overflow-hidden rounded-[1.5rem] border border-blue-400/20 bg-gradient-to-br from-[#1A23FF]/[0.12] via-white/[0.04] to-transparent p-4 shadow-[0_0_60px_rgba(26,35,255,0.15)] backdrop-blur-xl md:mt-14 md:rounded-[1.75rem] md:p-6"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-8">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:overflow-visible lg:pb-0">
              {modules.map((mod, index) => {
                const ModIcon = mod.icon;
                const isActive = index === active;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className={`flex min-w-[148px] shrink-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-300 lg:min-w-0 lg:w-full lg:px-4 lg:py-3.5 ${
                      isActive
                        ? "border-blue-400/45 bg-[#1A23FF]/20 shadow-[0_0_28px_rgba(26,35,255,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]"
                        : "border-white/[0.08] bg-white/[0.03] hover:border-blue-400/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-shadow duration-300 ${
                        isActive
                          ? "bg-[#1A23FF] text-white shadow-[0_0_20px_rgba(26,35,255,0.55)]"
                          : "bg-[#1A23FF]/15 text-blue-300 ring-1 ring-[#1A23FF]/25"
                      }`}
                    >
                      <ModIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white">{mod.title}</span>
                      <span className="mt-0.5 hidden text-[11px] leading-snug text-blue-100/55 sm:block">
                        {mod.tagline}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#060b1c]/80 md:min-h-[360px]">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(26,35,255,0.25),transparent)]"
                aria-hidden
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: easePremium }}
                  className="relative flex h-full flex-col p-5 md:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A23FF] text-white shadow-[0_0_24px_rgba(26,35,255,0.5)]">
                          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </span>
                        <h3 className="text-xl font-black text-white md:text-2xl">{current.title}</h3>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-blue-200/90">{current.tagline}</p>
                    </div>
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/75 md:text-[0.9375rem]">
                    {current.description}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {current.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm text-blue-50/90">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/25 text-[#93c5fd] ring-1 ring-[#1A23FF]/30">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div className="relative mt-6 flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:mt-8 md:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/70">
                      Aperçu
                    </p>
                    <p className="mt-2 text-2xl font-black tabular-nums text-white md:text-3xl">
                      {current.preview.headline}
                    </p>
                    <p className="mt-1 text-sm text-blue-100/65">{current.preview.sub}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {current.preview.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-[#1A23FF]/30 bg-[#1A23FF]/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="absolute bottom-4 left-5 right-5 flex items-center gap-2 md:left-7 md:right-7">
                {modules.map((mod, index) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className="group flex flex-1 flex-col gap-1"
                    aria-label={`Afficher ${mod.title}`}
                  >
                    <span
                      className={`block h-1 overflow-hidden rounded-full bg-white/10 ${
                        index === active ? "" : "opacity-60"
                      }`}
                    >
                      {index === active && !reduceMotion && !paused ? (
                        <motion.span
                          className="block h-full origin-left rounded-full bg-gradient-to-r from-[#1A23FF] to-[#93c5fd]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                          key={`progress-${active}`}
                        />
                      ) : (
                        <span
                          className={`block h-full rounded-full ${
                            index === active ? "w-full bg-[#1A23FF]" : "w-0"
                          }`}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-blue-200/50 lg:hidden">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" aria-hidden />
            Faites défiler les modules
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
