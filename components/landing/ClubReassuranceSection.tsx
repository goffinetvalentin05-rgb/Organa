"use client";

import { motion } from "framer-motion";
import { ListChecks, RefreshCw, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import {
  easePremium,
  scrollReveal,
  viewportOnce,
} from "@/components/landing/landing-motion";
import {
  landingGlassCardClass,
  landingIconBadgeClass,
  landingSectionGlowClass,
} from "@/components/ui/styles";

type ReassuranceCard = { title: string; description: string };

const cardIcons: LucideIcon[] = [Users, ListChecks, RefreshCw];

export default function ClubReassuranceSection() {
  const { t, locale } = useI18n();
  const raw = getTranslationValue(locale, "marketing.clubReassurance.cards");
  const cards = (Array.isArray(raw) ? raw : []) as ReassuranceCard[];

  return (
    <section id="pense-pour-les-clubs" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[1100px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-balance text-2xl font-black text-white md:text-4xl lg:text-[2.75rem]">
            {t("marketing.clubReassurance.title")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/75 md:text-base">
            {t("marketing.clubReassurance.subtitle")}
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
          {cards.map((card, index) => {
            const Icon = cardIcons[index] ?? Users;

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, delay: index * 0.1, ease: easePremium }}
                className={`${landingGlassCardClass} p-6 md:p-7`}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#1A23FF]/15 blur-2xl"
                  aria-hidden
                />
                <span className={landingIconBadgeClass}>
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold text-white md:text-xl">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-blue-100/70">{card.description}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
