"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import { useI18n } from "@/components/I18nProvider";
import { useLandingFaq, type LandingFaqItem } from "@/lib/landing/use-landing-faq";

function FeaturedCard({ item, reduceMotion }: { item: LandingFaqItem; reduceMotion: boolean | null }) {
  const Icon = item.icon;
  return (
    <motion.article
      variants={staggerItem}
      whileHover={reduceMotion ? undefined : { y: -2 }}
      className="group relative overflow-hidden rounded-xl border border-blue-400/25 bg-gradient-to-r from-[#1A23FF]/10 via-white/[0.04] to-transparent px-4 py-3 shadow-[0_0_28px_rgba(26,35,255,0.12)] backdrop-blur-md md:px-4 md:py-3.5"
    >
      <div className="relative flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1A23FF]/90 text-white shadow-[0_0_16px_rgba(26,35,255,0.4)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-300/70">
            {item.groupLabel}
          </p>
          <p className="mt-0.5 text-[13px] font-medium leading-snug text-white/95">
            {item.question}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-blue-100/65">{item.answer}</p>
        </div>
      </div>
    </motion.article>
  );
}

function AccordionItem({
  item,
  index,
  isOpen,
  onToggle,
  reduceMotion,
}: {
  item: LandingFaqItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  reduceMotion: boolean | null;
}) {
  const Icon = item.icon;
  const isAlt = index % 2 === 1;

  return (
    <motion.article
      layout={!reduceMotion}
      variants={staggerItem}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-md transition-shadow duration-300 ${
        isOpen
          ? "border-blue-400/35 bg-gradient-to-r from-[#1A23FF]/12 to-transparent shadow-[0_0_40px_rgba(26,35,255,0.22)]"
          : isAlt
            ? "border-white/[0.06] bg-white/[0.02] ml-0 md:ml-4"
            : "border-white/[0.08] bg-white/[0.04] mr-0 md:mr-4"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left md:px-4 md:py-3.5"
        aria-expanded={isOpen}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
            isOpen
              ? "bg-[#1A23FF] text-white shadow-[0_0_18px_rgba(26,35,255,0.5)]"
              : "bg-white/[0.06] text-blue-200 ring-1 ring-white/10"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-blue-300/60">
            {item.groupLabel}
          </span>
          <span className="mt-0.5 block text-[13px] font-medium leading-snug text-white/95">
            {item.question}
          </span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
            isOpen ? "border-blue-400/40 bg-[#1A23FF]/25 text-white" : "border-white/12 text-blue-200"
          }`}
          aria-hidden
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easePremium }}
          >
            <p className="border-t border-white/[0.06] px-4 pb-4 pt-2 text-sm leading-relaxed text-blue-100/70 md:pl-[4.25rem] md:pr-5 md:pb-5">
              {item.answer}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

export default function FaqSection() {
  const { t } = useI18n();
  const faqItems = useLandingFaq();
  const featuredItems = faqItems.filter((item) => item.featured);
  const accordionItems = faqItems.filter((item) => !item.featured);
  const [openIndex, setOpenIndex] = useState<number>(0);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="relative scroll-mt-24 overflow-hidden py-16 md:py-28">
      <motion.div
        className="pointer-events-none absolute left-[5%] top-[20%] h-72 w-72 rounded-full bg-[#1A23FF]/18 blur-[100px]"
        animate={reduceMotion ? undefined : { x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-[10%] top-0 h-px bg-gradient-to-r from-transparent via-blue-500/35 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1060px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-14 lg:items-start">
          {/* Titre — colonne gauche, toujours visible */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative z-10 text-center lg:sticky lg:top-28 lg:text-left"
          >
            <motion.p
              variants={staggerItem}
              className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-[#1A23FF]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-200 shadow-[0_0_28px_rgba(26,35,255,0.25)]"
            >
              <HelpCircle className="h-3.5 w-3.5" aria-hidden />
              FAQ
            </motion.p>
            <motion.h2
              variants={staggerItem}
              className="mt-5 text-balance text-2xl font-black leading-[1.15] tracking-[-0.02em] text-white md:text-3xl lg:text-[2.35rem]"
            >
              <span className="block">Vous avez encore des questions ?</span>
              <span className="mt-1 block bg-gradient-to-r from-blue-200 via-white to-blue-300 bg-clip-text text-transparent">
                On a les réponses.
              </span>
            </motion.h2>
            <motion.p variants={staggerItem} className="mt-4 text-sm text-blue-100/70 md:text-base">
              Les essentiels en un coup d&apos;œil, le détail en un clic.
            </motion.p>
            <motion.div
              variants={staggerItem}
              className="mt-6 hidden items-center gap-3 lg:flex"
              aria-hidden
            >
              <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-blue-100/60">
                {t("marketing.faq.themesCount", { count: faqItems.length })}
              </span>
              <span className="h-1 w-1 rounded-full bg-blue-400/50" />
              <span className="text-xs text-blue-100/50">{t("marketing.faq.themesList")}</span>
            </motion.div>
          </motion.div>

          {/* Contenu — colonne droite */}
          <div className="relative z-10 space-y-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="flex flex-col gap-2"
            >
              {featuredItems.map((item) => (
                <FeaturedCard key={item.question} item={item} reduceMotion={reduceMotion} />
              ))}
            </motion.div>

            <motion.div
              variants={scrollReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="relative space-y-2.5 rounded-[1.5rem] border border-white/[0.08] bg-white/[0.02] p-3 shadow-[0_0_60px_rgba(26,35,255,0.1)] backdrop-blur-sm md:p-4"
            >
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/70">
                {t("marketing.faq.otherQuestions")}
              </p>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="space-y-2"
              >
                {accordionItems.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    item={item}
                    index={index}
                    isOpen={openIndex === index}
                    onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
