"use client";

import { Clock, Eye, Layers, Shield, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import LandingCta from "@/components/landing/LandingCta";

const benefits: Array<{ icon: LucideIcon; title: string; line: string }> = [
  { icon: Clock, title: "Gain de temps", line: "Automatisez l'essentiel pour le comité" },
  { icon: Layers, title: "Centralisation", line: "Tout le club au même endroit" },
  { icon: Sparkles, title: "Image pro", line: "Factures et communication soignées" },
  { icon: Users, title: "Simplicité comité", line: "Prise en main rapide, sans technique" },
  { icon: Shield, title: "Moins d'oublis", line: "Suivi clair des tâches et paiements" },
  { icon: Eye, title: "Meilleure visibilité", line: "Vue d'ensemble sur le club en direct" },
];

export default function BenefitsSection() {
  return (
    <section className="relative mx-auto mt-24 w-[94%] max-w-[1160px] md:mt-32">
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 -bottom-10 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(255,255,255,0.10),transparent_60%)]"
        aria-hidden
      />

      <ScrollReveal className="mx-auto flex max-w-[820px] flex-col items-center px-2 text-center text-white md:px-4">
        <h2 className="text-3xl font-black md:text-5xl">
          Moins d&apos;administratif. Plus de temps pour votre club.
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-blue-100 md:text-lg">
          Automatisez l&apos;essentiel, structurez vos données et concentrez l&apos;énergie du
          comité sur la vie sportive et les projets du club.
        </p>
      </ScrollReveal>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:gap-5">
        {benefits.map((item, index) => (
          <ScrollReveal key={item.title} delay={index * 0.04} y={16}>
            <div className="group flex h-full flex-col items-center rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-6 text-center backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09] md:px-5 md:py-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
                <item.icon className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mt-4 text-sm font-black text-white md:text-base">{item.title}</p>
              <p className="mt-1.5 text-xs leading-snug text-blue-100/80 md:text-sm">{item.line}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal className="mt-12 md:mt-14" y={20}>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.02] p-1 backdrop-blur-xl">
          <div className="grid gap-1 md:grid-cols-3">
            {[
              { label: "Membres suivis", value: "Centralisés" },
              { label: "Cotisations", value: "Envoi auto" },
              { label: "Organisation", value: "Une plateforme" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.25rem] bg-white px-5 py-6 text-center shadow-[0_12px_32px_rgba(2,6,23,0.12)] md:py-8"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-xl font-black text-[#1A23FF] md:text-2xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <LandingCta
        compact
        title="Offrez une organisation claire à votre comité"
        primaryLabel="Commencer gratuitement"
      />
    </section>
  );
}
