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
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

const cardIcons: LucideIcon[] = [
  AlertCircle,
  FileSpreadsheet,
  Users,
  CalendarDays,
  Layers,
  MonitorSmartphone,
];

type ProblemCard = { title: string; description: string };

export default function ProblemSection() {
  const { t, locale } = useI18n();
  const raw = getTranslationValue(locale, "marketing.problem.cards");
  const cards = (Array.isArray(raw) ? raw : []) as ProblemCard[];

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
            {t("marketing.problem.title")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/75 md:text-base">
            {t("marketing.problem.subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          transition={{ delay: 0.1, ease: easePremium }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((card, index) => {
            const Icon = cardIcons[index] ?? AlertCircle;
            return (
              <motion.article
                key={card.title}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-md transition-shadow hover:border-blue-400/20 hover:shadow-[0_0_32px_rgba(26,35,255,0.15)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A23FF]/20 text-blue-300 ring-1 ring-[#1A23FF]/30">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{card.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
