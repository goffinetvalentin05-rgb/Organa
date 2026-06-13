"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import {
  easePremium,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import { useI18n } from "@/components/I18nProvider";
import { useLandingFaq } from "@/lib/landing/use-landing-faq";
import { landingSectionGlowClass, landingSectionShellClass } from "@/components/ui/styles";

function FaqAccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  reduceMotion,
  isLast,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  reduceMotion: boolean | null;
  isLast: boolean;
}) {
  return (
    <div className={isLast ? undefined : "border-b border-white/[0.08]"}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`group flex w-full items-start gap-4 px-5 py-5 text-left transition-colors duration-300 md:px-6 md:py-5 ${
          isOpen ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"
        }`}
      >
        <span className="min-w-0 flex-1 pt-0.5 text-[0.9375rem] font-semibold leading-snug text-white/95 md:text-base">
          {question}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "border-blue-400/35 bg-[#1A23FF]/20 text-white shadow-[0_0_20px_rgba(26,35,255,0.25)]"
              : "border-white/12 bg-white/[0.04] text-blue-200/75 group-hover:border-blue-400/25 group-hover:text-blue-100"
          }`}
          aria-hidden
        >
          {isOpen ? <Minus className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: easePremium }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-blue-100/72 md:px-6 md:pb-6 md:text-[0.9375rem] md:leading-relaxed">
              {answer}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const { t } = useI18n();
  const faqItems = useLandingFaq();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="relative scroll-mt-24 overflow-hidden py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[1100px]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16 lg:items-start">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="text-center lg:sticky lg:top-28 lg:text-left"
          >
            <motion.p
              variants={staggerItem}
              className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/70"
            >
              {t("marketing.faq.badge")}
            </motion.p>

            <motion.h2
              variants={staggerItem}
              className="mt-4 text-balance text-3xl font-black leading-[1.08] tracking-[-0.025em] text-white sm:text-4xl lg:mt-5 lg:text-[2.85rem] xl:text-[3.1rem]"
            >
              <span className="block">{t("marketing.faq.titleLine1")}</span>
              <span className="mt-1 block bg-gradient-to-r from-blue-200 via-white to-indigo-200 bg-clip-text text-transparent">
                {t("marketing.faq.titleLine2")}
              </span>
            </motion.h2>

            <motion.p
              variants={staggerItem}
              className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-blue-100/70 md:text-base lg:mx-0 lg:max-w-none"
            >
              {t("marketing.faq.subtitle")}
            </motion.p>

            <motion.p
              variants={staggerItem}
              className="mx-auto mt-6 max-w-md text-sm text-blue-100/45 lg:mx-0 lg:max-w-none"
            >
              {t("marketing.faq.reassurance")}
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className={`${landingSectionShellClass} overflow-hidden`}
          >
            {faqItems.map((item, index) => (
              <motion.div key={item.question} variants={staggerItem}>
                <FaqAccordionItem
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                  reduceMotion={reduceMotion}
                  isLast={index === faqItems.length - 1}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
