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
    <section
      id="demander-chatgpt"
      className="landing-final-cta relative scroll-mt-24 pb-16 pt-10 md:pb-24 md:pt-14 lg:pb-28"
    >
      <div className="landing-final-cta__frame relative mx-auto w-[94%] max-w-[1180px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="landing-final-cta__panel relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.25rem]"
        >
          {/* Ambiance — dégradé hero Obillz */}
          <div className="landing-final-cta__bg" aria-hidden />
          <div className="landing-final-cta__grid" aria-hidden />

          {/* Halos & lumière */}
          <motion.div
            className="landing-final-cta__halo landing-final-cta__halo--core"
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.06, 1] }
            }
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="landing-final-cta__halo landing-final-cta__halo--bottom"
            aria-hidden
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.45, 0.75, 0.45], y: [0, -10, 0] }
            }
            transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
          <div className="landing-final-cta__rays" aria-hidden />
          <div className="landing-final-cta__sheen" aria-hidden />
          <div className="landing-final-cta__edge" aria-hidden />

          {/* Contenu */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="relative z-10 mx-auto flex w-full max-w-[720px] flex-col items-center px-6 py-16 text-center sm:px-10 sm:py-20 md:px-14 md:py-24 lg:py-28"
          >
            <motion.h2
              variants={staggerItem}
              className="landing-final-cta__title text-balance font-bold tracking-tight text-white"
            >
              {t("marketing.askChatGpt.title")}
            </motion.h2>

            <motion.p
              variants={staggerItem}
              className="landing-final-cta__subtitle mt-5 max-w-[34rem] text-pretty text-blue-100/70 sm:mt-6"
            >
              {t("marketing.askChatGpt.subtitle")}
            </motion.p>

            <motion.div variants={staggerItem} className="mt-9 sm:mt-10">
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.22, ease: easePremium }}
                className="group relative inline-flex"
              >
                <motion.span
                  className="pointer-events-none absolute -inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),rgba(147,197,253,0.2)_45%,transparent_70%)] blur-2xl"
                  aria-hidden
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: [0.45, 0.8, 0.45], scale: [0.94, 1.06, 0.94] }
                  }
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-final-cta__btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full px-8 py-3.5 text-[0.9375rem] font-semibold sm:px-9 sm:py-4 sm:text-base"
                >
                  <span
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 landing-cta-shimmer"
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
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="mt-5 text-xs font-medium tracking-wide text-blue-100/50 sm:mt-6 sm:text-[13px]"
            >
              {t("marketing.askChatGpt.note")}
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
