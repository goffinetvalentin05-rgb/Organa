"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import {
  easePremium,
  floatY,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function AskChatGptSection({
  embedded = false,
}: {
  /** Intégré dans le panneau bleu Discovery (sans carte séparée). */
  embedded?: boolean;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.askChatGpt.message")
  );
  const titleLines = t("marketing.askChatGpt.title").split("\n");

  return (
    <section
      id="demander-chatgpt"
      className={
        embedded
          ? "landing-final-cta landing-final-cta--embedded discovery-chapter__block discovery-chapter__block--ask scroll-mt-32 md:scroll-mt-36"
          : "landing-final-cta scroll-mt-24"
      }
    >
      <div className="landing-final-cta__frame">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="landing-final-cta__stage"
        >
          {!embedded ? (
            <div className="landing-final-cta__atmosphere" aria-hidden>
              <span className="landing-final-cta__blob landing-final-cta__blob--tl" />
              <span className="landing-final-cta__blob landing-final-cta__blob--br" />
              <span className="landing-final-cta__blob landing-final-cta__blob--c" />
              <span className="landing-final-cta__grain" />
            </div>
          ) : null}

          <div className="landing-final-cta__grid">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="landing-final-cta__copy"
            >
              <motion.h2 variants={staggerItem} className="landing-final-cta__title display-title">
                {titleLines.map((line, index) => (
                  <span key={index} className="landing-final-cta__title-line">
                    {line}
                  </span>
                ))}
              </motion.h2>

              <motion.p variants={staggerItem} className="landing-final-cta__subtitle">
                {t("marketing.askChatGpt.subtitle")}
              </motion.p>

              <motion.div variants={staggerItem} className="landing-final-cta__actions">
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.025 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.22, ease: easePremium }}
                  className="group relative inline-flex"
                >
                  <motion.span
                    className="landing-final-cta__btn-aura"
                    aria-hidden
                    animate={
                      reduceMotion
                        ? undefined
                        : { opacity: [0.4, 0.8, 0.4], scale: [0.96, 1.06, 0.96] }
                    }
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-final-cta__btn"
                  >
                    <span className="landing-final-cta__btn-shimmer landing-cta-shimmer" aria-hidden />
                    <WhatsAppIcon className="landing-final-cta__btn-icon" />
                    <span>{t("marketing.askChatGpt.cta")}</span>
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              className="landing-final-cta__visual"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.85, delay: 0.12, ease: easePremium }}
              aria-hidden
            >
              <motion.div
                className="landing-final-cta__orb-wrap"
                animate={reduceMotion ? undefined : floatY(0.2)}
              >
                <span className="landing-final-cta__orb-floor" />
                <motion.span
                  className="landing-final-cta__orb-pulse"
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: [0.35, 0.7, 0.35], scale: [0.92, 1.08, 0.92] }
                  }
                  transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="landing-final-cta__orb">
                  <span className="landing-final-cta__orb-glass" />
                  <span className="landing-final-cta__orb-rim" />
                  <span className="landing-final-cta__orb-shine" />
                  <span className="landing-final-cta__orb-core">
                    <WhatsAppIcon className="landing-final-cta__orb-icon" />
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
