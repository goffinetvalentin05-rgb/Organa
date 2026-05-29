"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  CreditCard,
  Receipt,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { landingGlassCardClass } from "@/components/ui/styles";
import {
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";

const modules: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Membres", description: "Liste centralisée, fiches claires, export simple.", icon: Users },
  { title: "Factures", description: "Création rapide, envoi par e-mail, suivi des paiements.", icon: Receipt },
  { title: "Cotisations", description: "Envoi groupé, relances et statut en un coup d’œil.", icon: Wallet },
  { title: "Dépenses", description: "Charges du club suivies avec le reste de la compta.", icon: TrendingDown },
  { title: "Événements", description: "Inscriptions, QR codes, planning après-match.", icon: CalendarDays },
  { title: "Paiements", description: "Encaissements et soldes visibles en temps réel.", icon: CreditCard },
];

export default function ModulesSection() {
  return (
    <section id="modules" className="relative scroll-mt-24 py-16 md:py-24">
      <div className="relative mx-auto w-[94%] max-w-[1160px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center"
        >
          <h2 className="text-balance text-2xl font-black text-white md:text-4xl">
            Tout le club au même endroit.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:mt-14 md:gap-4"
        >
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.article
                key={mod.title}
                variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.22 } }}
                className={`group ${landingGlassCardClass} p-5 md:p-6`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A23FF]/15 text-blue-300 ring-1 ring-[#1A23FF]/25 transition group-hover:bg-[#1A23FF]/25 group-hover:shadow-[0_0_24px_rgba(26,35,255,0.35)]">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{mod.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{mod.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
