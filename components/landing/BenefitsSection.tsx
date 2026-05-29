"use client";

import { Clock, Eye, Layers, Shield, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";

const benefits: Array<{ icon: LucideIcon; title: string; line: string }> = [
  { icon: Clock, title: "Moins de temps perdu", line: "Automatisez l'essentiel pour le comité" },
  { icon: Layers, title: "Tout centralisé", line: "Un seul espace pour le club" },
  { icon: Sparkles, title: "Image plus pro", line: "Factures et communication soignées" },
  { icon: Users, title: "Comité plus efficace", line: "Prise en main rapide, sans technique" },
  { icon: Shield, title: "Moins d'oublis", line: "Suivi clair des tâches et paiements" },
  { icon: Eye, title: "Meilleure visibilité", line: "Vue d'ensemble en temps réel" },
];

export default function BenefitsSection() {
  return (
    <LandingSection
      className="mt-24 md:mt-32"
      glow
      eyebrow="Les bénéfices"
      title="Moins d'administratif. Plus de temps pour votre club."
      subtitle="Structurez vos données, gagnez en clarté et concentrez l'énergie du comité sur la vie sportive et les projets du club."
    >
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:gap-5">
        {benefits.map((item, index) => (
          <ScrollReveal key={item.title} delay={index * 0.04} y={16}>
            <div className="group flex h-full flex-col items-center rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-6 text-center backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/28 hover:bg-white/[0.10] hover:shadow-[0_16px_40px_rgba(2,6,23,0.22)] md:px-5 md:py-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15 group-hover:ring-white/25">
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
    </LandingSection>
  );
}
