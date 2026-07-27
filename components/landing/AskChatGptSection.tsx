"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function AskChatGptSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.askChatGpt.message")
  );

  return (
    <section id="demander-chatgpt" className="landing-final-cta relative scroll-mt-24">
      <div className="landing-final-cta__frame relative mx-auto">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="landing-final-cta__panel relative overflow-hidden"
        >
          <div className="landing-final-cta__glow" aria-hidden />
          <div className="landing-final-cta__orb" aria-hidden />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="landing-final-cta__content relative z-10"
          >
            <div className="landing-final-cta__copy">
              <motion.h2 variants={staggerItem} className="landing-final-cta__title">
                {t("marketing.askChatGpt.title")}
              </motion.h2>
              <motion.p variants={staggerItem} className="landing-final-cta__subtitle">
                {t("marketing.askChatGpt.subtitle")}
              </motion.p>
            </div>

            <motion.div variants={staggerItem} className="landing-final-cta__actions">
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.22, ease: easePremium }}
                className="group relative inline-flex"
              >
                <motion.span
                  className="pointer-events-none absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.45),rgba(99,102,241,0.18)_55%,transparent_70%)] blur-2xl"
                  aria-hidden
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: [0.45, 0.85, 0.45], scale: [0.94, 1.06, 0.94] }
                  }
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-final-cta__btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-8 py-3.5 text-[0.9375rem] font-semibold text-white sm:px-9 sm:py-4 sm:text-base"
                >
                  <span
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 landing-cta-shimmer"
                    aria-hidden
                  />
                  <span className="relative">{t("marketing.askChatGpt.cta")}</span>
                  <ArrowRight
                    className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </a>
              </motion.div>
              <p className="landing-final-cta__note">{t("marketing.askChatGpt.note")}</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
