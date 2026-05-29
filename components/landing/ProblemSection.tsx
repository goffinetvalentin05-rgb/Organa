"use client";

import {
  CalendarDays,
  Clock,
  Coffee,
  FileSpreadsheet,
  MessageCircle,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";

const painPoints: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    icon: FileSpreadsheet,
    title: "Outils dispersés",
    description: "Excel, WhatsApp, emails et papiers — rien n'est au même endroit.",
    accent: "from-rose-500/20 to-transparent",
  },
  {
    icon: Wallet,
    title: "Cotisations à la main",
    description: "Relances manuelles et suivi des paiements chronophage pour le comité.",
    accent: "from-amber-500/20 to-transparent",
  },
  {
    icon: Users,
    title: "Infos membres éparpillées",
    description: "Coordonnées et équipes difficiles à retrouver rapidement.",
    accent: "from-violet-500/20 to-transparent",
  },
  {
    icon: CalendarDays,
    title: "Événements compliqués",
    description: "Bénévoles et plannings sans vue d'ensemble claire.",
    accent: "from-sky-500/20 to-transparent",
  },
  {
    icon: Coffee,
    title: "Buvette mal suivie",
    description: "Réservations et facturation souvent gérées sur le coin de la table.",
    accent: "from-orange-500/20 to-transparent",
  },
  {
    icon: MessageCircle,
    title: "Administration floue",
    description: "Manque de visibilité sur les finances et les tâches en attente.",
    accent: "from-emerald-500/15 to-transparent",
  },
];

export default function ProblemSection() {
  return (
    <LandingSection
      id="probleme"
      className="mt-20 md:mt-32 lg:mt-40"
      glow
      eyebrow="La douleur"
      title="Aujourd'hui, gérer un club peut vite devenir un casse-tête."
      subtitle="Dans beaucoup de clubs, le comité perd du temps, les informations se dispersent et le suivi des membres devient difficile — avant même d'arriver sur le terrain."
    >
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {painPoints.map((point, index) => (
          <ScrollReveal key={point.title} delay={index * 0.05} y={20}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-transparent p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/28 hover:shadow-[0_20px_48px_rgba(2,6,23,0.28)] md:p-6">
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${point.accent} opacity-80 blur-2xl transition group-hover:opacity-100`}
                aria-hidden
              />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <point.icon className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="relative mt-4 text-lg font-black text-white">{point.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-blue-100/85">
                {point.description}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal className="mt-12 md:mt-16" y={16}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-6">
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 text-center backdrop-blur-md md:text-left">
            <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-200/90 md:justify-start">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Sans centralisation
            </p>
            <p className="mt-2 text-sm font-semibold text-blue-100/90">
              Heures perdues chaque semaine pour le comité
            </p>
          </div>
          <div className="hidden text-2xl font-black text-white/40 md:block" aria-hidden>
            →
          </div>
          <div className="rounded-2xl border border-[#1A23FF]/35 bg-gradient-to-br from-[#1A23FF]/25 via-white/[0.08] to-transparent p-5 text-center backdrop-blur-md md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200/90">
              Avec Obillz
            </p>
            <p className="mt-2 text-lg font-black text-white">Tout au même endroit.</p>
            <p className="mt-1 text-sm text-blue-100/85">
              Membres, cotisations, événements, buvette — une vue claire pour le comité.
            </p>
          </div>
        </div>
      </ScrollReveal>

      <LandingCta
        compact
        title="Passez à une gestion plus simple"
        secondaryLabel="Voir la solution"
        secondaryHref="#comparaison"
      />
    </LandingSection>
  );
}
