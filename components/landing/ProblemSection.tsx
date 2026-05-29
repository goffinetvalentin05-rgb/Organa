"use client";

import { motion } from "framer-motion";
import { AlertCircle, FileSpreadsheet, Users } from "lucide-react";
import { landingGlassCardClass } from "@/components/ui/styles";
import { scrollReveal, staggerContainer, staggerItem, viewportOnce } from "@/components/landing/landing-motion";

const painCards = [
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
];

export default function ProblemSection() {
  return (
    <section id="probleme" className="relative scroll-mt-24 py-16 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" aria-hidden />

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

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-10 grid gap-4 sm:grid-cols-3 md:mt-14"
        >
          {painCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                variants={staggerItem}
                className={`${landingGlassCardClass} p-5 md:p-6`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-400/20">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{card.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
