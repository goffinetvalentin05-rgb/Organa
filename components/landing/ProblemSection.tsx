"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, X } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import {
  easePremium,
  staggerContainer,
  staggerFast,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";

const todayPains = [
  "Fichiers Excel dispersés",
  "Cotisations suivies à la main",
  "Relances oubliées",
  "Informations membres éparpillées",
  "Buvette et événements difficiles à organiser",
  "Encaissements peu visibles",
];

const withObillzWins = [
  "Membres centralisés",
  "Cotisations envoyées et suivies",
  "Factures et paiements clairs",
  "Événements et buvette organisés",
  "QR codes et inscriptions publiques",
  "Encaissements visibles",
];

export default function ProblemSection() {
  return (
    <LandingSection
      id="probleme"
      className="mt-20 md:mt-32 lg:mt-40"
      glow
      eyebrow="Le problème"
      title="Votre comité passe trop de temps à gérer l'administratif."
      subtitle="Entre les fichiers Excel, les messages WhatsApp et les relances à la main, l'organisation devient vite compliquée."
    >
      <ScrollReveal className="mt-12 md:mt-14" y={28}>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/22 bg-gradient-to-br from-white/[0.1] via-white/[0.03] to-transparent p-1.5 shadow-[0_28px_70px_rgba(2,6,23,0.38)] backdrop-blur-xl md:rounded-[2rem] md:p-2">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[#1A23FF] shadow-[0_12px_32px_rgba(26,35,255,0.5)] md:flex"
            aria-hidden
          >
            <ArrowRight className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>

          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <TodayColumn items={todayPains} />
            <SolutionColumn items={withObillzWins} />
          </div>
        </div>
      </ScrollReveal>
    </LandingSection>
  );
}

function TodayColumn({ items }: { items: string[] }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="relative overflow-hidden rounded-[1.35rem] border border-rose-400/30 bg-gradient-to-br from-rose-950/50 via-slate-900/35 to-transparent p-5 md:p-6"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-rose-500/25 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/25 ring-1 ring-rose-400/35">
          <AlertTriangle className="h-4 w-4 text-rose-300" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200/90">
            Aujourd&apos;hui
          </p>
          <p className="text-sm font-black text-white">Sans outil centralisé</p>
        </div>
      </div>
      <motion.ul variants={staggerFast} className="relative mt-5 space-y-2">
        {items.map((text) => (
          <motion.li
            key={text}
            variants={staggerItem}
            className="flex items-center gap-2.5 rounded-xl border border-rose-400/18 bg-black/25 px-3 py-2.5 text-sm text-rose-50/95"
          >
            <X className="h-3.5 w-3.5 shrink-0 text-rose-400" strokeWidth={2.5} aria-hidden />
            <span className="leading-snug">{text}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

function SolutionColumn({ items }: { items: string[] }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } },
      }}
      className="relative overflow-hidden rounded-[1.35rem] border border-[#1A23FF]/40 bg-gradient-to-br from-[#1A23FF]/35 via-indigo-900/25 to-transparent p-5 md:p-6"
    >
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#1A23FF]/35 blur-3xl"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.5, delay: 0.28, ease: easePremium }}
        className="relative flex items-center gap-2.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/25 ring-1 ring-emerald-400/35">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/90">
            Avec Obillz
          </p>
          <p className="text-sm font-black text-white">Tout centralisé</p>
        </div>
      </motion.div>
      <motion.ul variants={staggerFast} className="relative mt-5 space-y-2">
        {items.map((text) => (
          <motion.li
            key={text}
            variants={staggerItem}
            className="flex items-center gap-2.5 rounded-xl border border-white/18 bg-white/[0.1] px-3 py-2.5 text-sm text-blue-50 shadow-[0_4px_16px_rgba(2,6,23,0.12)]"
          >
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-emerald-400"
              strokeWidth={2}
              aria-hidden
            />
            <span className="leading-snug">{text}</span>
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}
