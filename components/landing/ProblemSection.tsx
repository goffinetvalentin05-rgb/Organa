"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Coffee,
  FileSpreadsheet,
  MessageCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { staggerContainer, staggerItem } from "@/components/landing/landing-motion";

const todayPains = [
  { icon: FileSpreadsheet, text: "Fichiers Excel partout, versions introuvables" },
  { icon: MessageCircle, text: "WhatsApp du comité : +20 messages non lus" },
  { icon: Wallet, text: "Cotisations relancées à la main, sans suivi clair" },
  { icon: Users, text: "Coordonnées membres éparpillées" },
  { icon: CalendarDays, text: "Événements et bénévoles mal organisés" },
  { icon: Coffee, text: "Buvette et factures sur le coin de la table" },
];

const withObillzWins = [
  { icon: CheckCircle2, text: "Une seule base membres à jour" },
  { icon: CheckCircle2, text: "Cotisations envoyées et suivies en direct" },
  { icon: CheckCircle2, text: "Factures et encaissements visibles" },
  { icon: CheckCircle2, text: "Événements, buvette et sponsoring centralisés" },
  { icon: CheckCircle2, text: "QR codes et page publique du club" },
  { icon: CheckCircle2, text: "Comité qui gagne des heures chaque semaine" },
];

export default function ProblemSection() {
  return (
    <LandingSection
      id="probleme"
      className="mt-16 md:mt-28 lg:mt-36"
      glow
      eyebrow="Le problème"
      title="Vous vous reconnaissez ? C'est le quotidien de trop de clubs."
      subtitle="Excel, WhatsApp, relances manuelles, infos perdues — le comité passe plus de temps à gérer qu'à faire vivre le club."
    >
      <ScrollReveal className="mt-12" y={24} scale>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-white/[0.08] to-transparent p-1.5 shadow-[0_24px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl md:rounded-[2rem] md:p-2">
          <div className="grid gap-2 md:grid-cols-2 md:gap-3">
            <TodayColumn />
            <SolutionColumn />
          </div>
        </div>
      </ScrollReveal>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-14 md:gap-4"
      >
        {[
          { label: "Temps perdu", value: "5h+", sub: "par semaine en moyenne" },
          { label: "Outils utilisés", value: "4+", sub: "Excel, WhatsApp, mail…" },
          { label: "Visibilité", value: "Floue", sub: "sur les encaissements" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-5 text-center backdrop-blur-md md:py-6"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200/80">{stat.label}</p>
            <p className="mt-2 text-2xl font-black text-white md:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs text-blue-100/75">{stat.sub}</p>
          </motion.div>
        ))}
      </motion.div>

      <LandingCta
        compact
        title="Arrêtez de jongler — centralisez tout"
        secondaryLabel="Voir comment Obillz change la donne"
        secondaryHref="#comparaison"
      />
    </LandingSection>
  );
}

function TodayColumn() {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-rose-400/25 bg-gradient-to-br from-rose-950/40 via-slate-900/30 to-transparent p-5 md:p-6">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 ring-1 ring-rose-400/30">
          <AlertTriangle className="h-4 w-4 text-rose-300" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200/90">Aujourd&apos;hui</p>
          <p className="text-sm font-black text-white">Sans outil centralisé</p>
        </div>
      </div>
      <motion.ul
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative mt-5 space-y-2.5"
      >
        {todayPains.map((item) => (
          <motion.li
            key={item.text}
            variants={staggerItem}
            className="flex items-start gap-2.5 rounded-xl border border-rose-400/15 bg-black/20 px-3 py-2.5 text-sm text-rose-50/95"
          >
            <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" strokeWidth={2.5} aria-hidden />
            <span className="leading-snug">{item.text}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function SolutionColumn() {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-[#1A23FF]/35 bg-gradient-to-br from-[#1A23FF]/30 via-indigo-900/20 to-transparent p-5 md:p-6">
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-[#1A23FF]/30 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" strokeWidth={2} aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200/90">Avec Obillz</p>
          <p className="text-sm font-black text-white">Tout au même endroit</p>
        </div>
      </div>
      <motion.ul
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative mt-5 space-y-2.5"
      >
        {withObillzWins.map((item) => (
          <motion.li
            key={item.text}
            variants={staggerItem}
            className="flex items-start gap-2.5 rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2.5 text-sm text-blue-50"
          >
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2} aria-hidden />
            <span className="leading-snug">{item.text}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
