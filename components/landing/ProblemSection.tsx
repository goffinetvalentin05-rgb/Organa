"use client";

import {
  CalendarDays,
  Coffee,
  FileSpreadsheet,
  MessageCircle,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import LandingCta from "@/components/landing/LandingCta";

const painPoints: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: FileSpreadsheet,
    title: "Trop d'outils dispersés",
    description: "Excel, WhatsApp, emails et papiers — rien n'est au même endroit.",
  },
  {
    icon: Wallet,
    title: "Cotisations à la main",
    description: "Relances manuelles et suivi des paiements chronophage pour le comité.",
  },
  {
    icon: Users,
    title: "Infos membres éparpillées",
    description: "Coordonnées et équipes difficiles à retrouver rapidement.",
  },
  {
    icon: CalendarDays,
    title: "Organisation compliquée",
    description: "Événements, bénévoles et plannings sans vue d'ensemble claire.",
  },
  {
    icon: Coffee,
    title: "Buvette difficile à gérer",
    description: "Réservations et facturation souvent gérées sur le coin de la table.",
  },
  {
    icon: MessageCircle,
    title: "Suivi administratif flou",
    description: "Manque de visibilité sur les finances et les tâches en attente.",
  },
];

export default function ProblemSection() {
  return (
    <section id="probleme" className="relative mx-auto mt-20 w-[94%] max-w-[1100px] md:mt-32 lg:mt-40">
      <div
        className="pointer-events-none absolute inset-x-[-8%] -top-20 -bottom-12 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_65%)]" />
        <div className="absolute left-[10%] top-[15%] h-36 w-36 rounded-full bg-[#1A23FF]/25 blur-3xl" />
      </div>

      <ScrollReveal className="text-center">
        <h2 className="text-balance text-3xl font-black leading-tight text-white md:text-5xl">
          Aujourd&apos;hui, gérer un club peut vite devenir un casse-tête.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-blue-100/85 md:text-lg">
          Dans beaucoup de clubs, les tâches sont dispersées entre Excel, messages WhatsApp,
          emails et gestion manuelle. Le comité perd du temps, les informations se dispersent
          et le suivi des membres devient difficile.
        </p>
      </ScrollReveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {painPoints.map((point, index) => (
          <ScrollReveal key={point.title} delay={index * 0.05} y={20}>
            <article className="group relative h-full overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.10] md:p-6">
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/[0.04] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
                <point.icon className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden />
              </div>
              <h3 className="relative mt-4 text-lg font-black text-white">{point.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-blue-100/80">
                {point.description}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal className="mt-12 md:mt-14" y={16}>
        <div className="relative overflow-hidden rounded-2xl border border-[#1A23FF]/40 bg-gradient-to-r from-[#1A23FF]/20 via-white/[0.08] to-white/[0.04] px-6 py-8 text-center backdrop-blur-xl md:px-10 md:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/90">La solution</p>
          <p className="mt-3 text-2xl font-black text-white md:text-3xl">
            Obillz centralise tout dans une seule plateforme.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-blue-100/85 md:text-base">
            Membres, cotisations, événements, buvette, factures et communication — une vue claire
            pour le comité, sans jongler entre les outils.
          </p>
        </div>
      </ScrollReveal>

      <LandingCta
        compact
        title="Passez à une gestion plus simple"
        secondaryLabel="Voir la démonstration"
        secondaryHref="#comparaison"
      />
    </section>
  );
}
