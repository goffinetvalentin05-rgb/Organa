"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";
import { useI18n } from "@/components/I18nProvider";
import { useLandingFaq } from "@/lib/landing/use-landing-faq";

export default function FaqSection() {
  const { t } = useI18n();
  const faqItems = useLandingFaq();
  const [openIndex, setOpenIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="lp-section scroll-mt-32 md:scroll-mt-36">
      <div className="lp-wrap lp-wrap--narrow">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: easePremium }}
        >
          <p className="lp-eyebrow">{t("marketing.faq.badge")}</p>
          <h2 className="lp-title">
            {t("marketing.faq.titleLine1")} {t("marketing.faq.titleLine2")}
          </h2>
          <p className="lp-lead mx-auto">{t("marketing.faq.subtitle")}</p>
        </motion.div>

        <div className="lp-faq-list mt-12">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="lp-faq-item">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  {isOpen ? (
                    <Minus className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <Plus className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: easePremium }}
                      className="overflow-hidden"
                    >
                      <p>{item.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
