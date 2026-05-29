"use client";

import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  MessageCircle,
  Receipt,
  Users,
  CalendarX,
  EyeOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import {
  easePremium,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";

const pains: Array<{
  icon: LucideIcon;
  title: string;
  line: string;
}> = [
  {
    icon: FileSpreadsheet,
    title: "Excel partout",
    line: "Fichiers dispersés, versions qui se multiplient, erreurs faciles.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp dans tous les sens",
    line: "Infos noyées dans les groupes, rien n'est retrouvable.",
  },
  {
    icon: Receipt,
    title: "Cotisations à la main",
    line: "Relances oubliées, suivi approximatif, stress pour le caissier.",
  },
  {
    icon: Users,
    title: "Membres mal centralisés",
    line: "Coordonnées éparpillées, pas de vision claire du club.",
  },
  {
    icon: CalendarX,
    title: "Événements & buvette compliqués",
    line: "Inscriptions et réservations difficiles à organiser.",
  },
  {
    icon: EyeOff,
    title: "Paiements peu visibles",
    line: "Qui a payé ? Qui est en retard ? Difficile à dire rapidement.",
  },
];

export default function ProblemSection() {
  return (
    <LandingSection
      id="probleme"
      className="mt-20 md:mt-32 lg:mt-40"
      glow
      eyebrow="Le problème"
      title="Vous vous reconnaissez ?"
      subtitle="Entre tableurs, messages et relances manuelles, la gestion du club devient un second métier."
    >
      <ScrollReveal className="mt-12 md:mt-16" y={24}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
        >
          {pains.map((pain, index) => {
            const Icon = pain.icon;
            return (
              <motion.article
                key={pain.title}
                variants={staggerItem}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: easePremium } }}
                className={`group relative overflow-hidden rounded-[1.35rem] border border-white/18 bg-gradient-to-br from-white/[0.11] via-white/[0.04] to-transparent p-5 shadow-[0_20px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl transition duration-300 hover:border-white/30 hover:shadow-[0_28px_60px_rgba(2,6,23,0.38)] md:p-6 ${
                  index === 1 ? "lg:translate-y-4" : index === 4 ? "lg:-translate-y-2" : ""
                }`}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-500/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/[0.08] ring-1 ring-white/15 transition group-hover:border-white/35 group-hover:bg-white/[0.14]">
                  <Icon className="h-5 w-5 text-blue-100" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="relative mt-4 text-base font-black text-white md:text-lg">
                  {pain.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-blue-100/85">
                  {pain.line}
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </ScrollReveal>
    </LandingSection>
  );
}
