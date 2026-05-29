"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  FileSpreadsheet,
  Layers,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

const painCards: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Cotisations oubliées",
    description: "Relances manuelles, suivi flou, membres qui paient en retard.",
    icon: AlertCircle,
  },
  {
    title: "Factures dispersées",
    description: "Fichiers Excel, mails perdus, aucune vue claire sur ce qui est payé.",
    icon: FileSpreadsheet,
  },
  {
    title: "Comité surchargé",
    description: "WhatsApp, tableurs et paperasse — le bénévolat devient ingérable.",
    icon: Users,
  },
  {
    title: "Événements mal suivis",
    description: "Inscriptions sur plusieurs canaux, listes incomplètes, aucun suivi central.",
    icon: CalendarDays,
  },
  {
    title: "Trop d’outils séparés",
    description:
      "Excel, WhatsApp, mails, fichiers partagés… chaque tâche a son outil, rien n’est relié.",
    icon: Layers,
  },
  {
    title: "Chacun sur son écran",
    description:
      "Téléphone, tablette ou PC — le comité consulte depuis partout, sans la même vue à jour.",
    icon: MonitorSmartphone,
  },
];

export default function ProblemSection() {
  return (
    <section id="probleme" className="relative scroll-mt-24 py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-[10%] top-1/2 h-64 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.12),transparent_70%)] blur-3xl"
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
          <h2 className="text-balance text-2xl font-black text-white md:text-4xl">
            Les clubs perdent trop de temps sur l&apos;administratif.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/75 md:text-base">
            Entre les fichiers Excel, les messages WhatsApp, les cotisations à relancer et les
            factures à suivre, la gestion d&apos;un club devient vite compliquée.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {painCards.map((card, index) => (
            <ProblemCard key={card.title} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemCard({
  card,
  index,
}: {
  card: (typeof painCards)[number];
  index: number;
}) {
  const Icon = card.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.07, 0.35),
        ease: easePremium,
      }}
      whileHover={{
        y: -5,
        transition: { duration: 0.22, ease: easePremium },
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-red-400/25 hover:shadow-[0_0_40px_rgba(239,68,68,0.12),0_0_60px_rgba(26,35,255,0.15)] md:p-6"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-[#1A23FF]/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
        aria-hidden
      />

      <motion.span
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-400/20 transition-[box-shadow,background] duration-300 group-hover:bg-red-500/15 group-hover:shadow-[0_0_20px_rgba(248,113,113,0.35)]"
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </motion.span>

      <h3 className="relative mt-4 text-lg font-bold text-white transition-colors duration-300 group-hover:text-red-50">
        {card.title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-blue-100/65">{card.description}</p>
    </motion.article>
  );
}
