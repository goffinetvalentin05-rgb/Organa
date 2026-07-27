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
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { landingSectionShellClass as faqAccordionShellClass } from "@/components/ui/styles";

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
        className={`group flex w-full items-start gap-3 px-4 py-4 text-left transition-colors duration-300 sm:gap-4 sm:px-5 sm:py-5 md:px-6 md:py-5 ${
          isOpen ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"
        }`}
      >
        <span className="min-w-0 flex-1 pt-0.5 text-[0.9rem] font-semibold leading-snug text-[#F8FAFC] sm:text-[0.9375rem] md:text-base">
          {question}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "border-[#38BDF8]/30 bg-[#2563EB]/15 text-[#F8FAFC] shadow-[0_0_16px_rgba(37,99,235,0.15)]"
              : "border-white/14 bg-white/[0.05] text-[rgba(226,232,240,0.72)] group-hover:border-white/20 group-hover:text-[#F8FAFC]"
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
            <p className="landing-premium-card-desc px-4 pb-4 text-sm sm:px-5 sm:pb-5 md:px-6 md:pb-6 md:text-[0.9375rem] md:leading-relaxed">
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
    <section id="faq" className={`${landingSectionShellClass()} overflow-x-clip`}>
      <div className="relative mx-auto w-[min(94%,1100px)] max-w-[1100px]">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16 lg:items-start">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="min-w-0 text-center lg:sticky lg:top-28 lg:text-left"
          >
            <motion.div variants={staggerItem}>
              <LandingSectionIntro
                layout="stack"
                label={t("marketing.faq.badge")}
                title={
                  <>
                    <span className="block">{t("marketing.faq.titleLine1")}</span>
                    <span className="mt-1 block text-[#2563eb]">{t("marketing.faq.titleLine2")}</span>
                  </>
                }
                description={t("marketing.faq.subtitle")}
                secondaryDescription={t("marketing.faq.reassurance")}
              />
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className={`${faqAccordionShellClass} landing-obillz-gradient overflow-hidden`}
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
