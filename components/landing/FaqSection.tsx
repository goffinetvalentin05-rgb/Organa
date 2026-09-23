"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";
import { useI18n } from "@/components/I18nProvider";
import { useLandingFaq } from "@/lib/landing/use-landing-faq";

export default function FaqSection() {
  const { t } = useI18n();
  const faqItems = useLandingFaq();
  const [openIndex, setOpenIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <section id="faq" className="lp-faq scroll-mt-32 md:scroll-mt-36">
      <div className="lp-faq__grid">
        <div className="lp-faq__aside">
          <div className="lp-faq__sticky">
            <p className="lp-eyebrow">{t("marketing.faq.badge")}</p>
            <h2 className="lp-title">
              {t("marketing.faq.titleLine1")} <span>{t("marketing.faq.titleLine2")}</span>
            </h2>
            <p className="lp-lead">{t("marketing.faq.subtitle")}</p>
          </div>
        </div>

        <div className="lp-faq__list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={item.question}
                className={`lp-faq__item${isOpen ? " is-open" : ""}`}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.55, delay: Math.min(index, 2) * 0.05, ease: easePremium }}
              >
                <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen}>
                  <span>{item.question}</span>
                  <Plus className="lp-faq__icon" strokeWidth={1.75} aria-hidden />
                </button>
                <div className={`lp-faq__panel${isOpen ? " is-open" : ""}`}>
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
