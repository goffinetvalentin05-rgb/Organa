"use client";

import { motion } from "framer-motion";
import { Clock, Eye, Layers, Shield, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection from "@/components/landing/LandingSection";
import { staggerContainer, staggerItem } from "@/components/landing/landing-motion";

const benefits: Array<{ icon: LucideIcon; title: string; line: string }> = [
  { icon: Clock, title: "Gain de temps", line: "Automatisez l'essentiel pour le comité" },
  { icon: Layers, title: "Tout centralisé", line: "Un seul espace pour tout le club" },
  { icon: Sparkles, title: "Image professionnelle", line: "Factures et communication soignées" },
  { icon: Users, title: "Comité efficace", line: "Prise en main rapide, sans technique" },
  { icon: Shield, title: "Moins d'oublis", line: "Suivi clair des tâches et paiements" },
  { icon: Eye, title: "Visibilité totale", line: "Encaissements et situation en direct" },
];

export default function BenefitsSection() {
  return (
    <LandingSection
      className="mt-20 md:mt-32"
      glow
      eyebrow="Les bénéfices"
      title="Moins d'administratif. Plus de temps pour votre club."
      subtitle="Structurez vos données, gagnez en clarté et concentrez l'énergie du comité sur la vie sportive."
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:gap-5"
      >
        {benefits.map((item) => (
          <motion.div key={item.title} variants={staggerItem}>
            <div className="group flex h-full flex-col items-center rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.1] to-white/[0.02] px-4 py-6 text-center shadow-[0_12px_32px_rgba(2,6,23,0.18)] backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:shadow-[0_20px_48px_rgba(2,6,23,0.28)] md:px-5 md:py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 transition group-hover:scale-105 group-hover:bg-white/15">
                <item.icon className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="mt-4 text-sm font-black text-white md:text-base">{item.title}</p>
              <p className="mt-1.5 text-xs leading-snug text-blue-100/80 md:text-sm">{item.line}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 overflow-hidden rounded-[1.75rem] border border-white/22 bg-gradient-to-br from-white/[0.14] to-white/[0.02] p-1 shadow-[0_20px_50px_rgba(2,6,23,0.25)] backdrop-blur-xl md:mt-14"
      >
        <div className="grid gap-1 md:grid-cols-3">
          {[
            { label: "Membres suivis", value: "Centralisés" },
            { label: "Cotisations", value: "Envoi auto" },
            { label: "Organisation", value: "Une plateforme" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.35rem] bg-white px-5 py-7 text-center shadow-[0_8px_24px_rgba(2,6,23,0.1)] md:py-9"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-black text-[#1A23FF] md:text-3xl">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <LandingCta
        compact
        title="Offrez une organisation claire à votre comité"
        subtitle="Essayez Obillz gratuitement — votre club n'a rien à perdre."
        primaryLabel="Commencer gratuitement"
      />
    </LandingSection>
  );
}
