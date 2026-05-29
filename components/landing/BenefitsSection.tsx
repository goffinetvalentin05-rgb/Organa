"use client";

import { motion } from "framer-motion";
import { Clock, Eye, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

const benefits: Array<{
  icon: LucideIcon;
  stat: string;
  title: string;
  line: string;
}> = [
  {
    icon: Clock,
    stat: "5h+",
    title: "Gain de temps",
    line: "Moins de relances manuelles et de fichiers éparpillés pour le comité.",
  },
  {
    icon: Sparkles,
    stat: "1",
    title: "Organisation plus professionnelle",
    line: "Factures, cotisations et communication alignées sur une plateforme claire.",
  },
  {
    icon: Eye,
    stat: "100%",
    title: "Suivi financier plus clair",
    line: "Encaissements et paiements visibles sans tableaux bricolés.",
  },
];

export default function BenefitsSection() {
  return (
    <LandingSection
      className="mt-24 md:mt-36"
      glow
      eyebrow="Les bénéfices"
      title="Moins d'administratif. Plus de clarté pour le comité."
    >
      <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
        {benefits.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.65, delay: index * 0.1, ease: easePremium }}
            className="group relative overflow-hidden rounded-[1.75rem] border border-white/22 bg-gradient-to-br from-white/[0.14] via-white/[0.06] to-[#1A23FF]/[0.08] p-6 shadow-[0_24px_56px_rgba(2,6,23,0.3)] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-white/35 hover:shadow-[0_32px_64px_rgba(26,35,255,0.25)] md:p-8"
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/15"
              aria-hidden
            />
            <p className="text-4xl font-black tabular-nums tracking-tight text-white md:text-5xl">
              {item.stat}
            </p>
            <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/25 transition group-hover:scale-105 group-hover:bg-white/18">
              <item.icon className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-black text-white md:text-xl">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/85">{item.line}</p>
          </motion.article>
        ))}
      </div>
    </LandingSection>
  );
}
