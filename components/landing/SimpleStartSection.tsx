"use client";

import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useRef } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";

type Step = {
  title: string;
  description: string;
};

const STEP_ICONS: LucideIcon[] = [Building2, Users, ShieldCheck, CheckCircle2];

const STEP_ENTRANCES = [
  { opacity: 0, x: -56, rotate: -2.5 },
  { opacity: 0, x: 56, rotate: 2.5 },
  { opacity: 0, y: 48, scale: 0.94 },
  { opacity: 0, y: 24, scale: 0.9 },
] as const;

export default function SimpleStartSection() {
  const { t, locale } = useI18n();
  const journeyRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const raw = getTranslationValue(locale, "marketing.simpleStart.steps");
  const steps = (Array.isArray(raw) ? raw : []) as Step[];

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start 72%", "end 42%"],
  });
  const lineProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.4,
  });

  return (
    <section
      id="demarrer"
      className="lp-simple-start scroll-mt-32 md:scroll-mt-36"
      aria-labelledby="lp-simple-start-title"
    >
      <motion.div
        className="lp-simple-start__panel"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 88,
                scale: 0.97,
              }
        }
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 1, ease: easePremium }}
      >
        <div className="lp-simple-start__grid" aria-hidden />
        <div className="lp-simple-start__glow" aria-hidden />

        <div className="lp-simple-start__inner">
          <motion.div
            className="lp-simple-start__header"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, ease: easePremium }}
          >
            <p className="lp-simple-start__label">{t("marketing.simpleStart.label")}</p>
            <h2 id="lp-simple-start-title" className="lp-simple-start__title">
              {t("marketing.simpleStart.title")}
            </h2>
          </motion.div>

          <div ref={journeyRef} className="lp-simple-start__journey">
            <div className="lp-simple-start__line" aria-hidden />
            <motion.div
              className="lp-simple-start__line-progress"
              style={reduceMotion ? { scaleY: 1 } : { scaleY: lineProgress }}
              aria-hidden
            />

            {steps.map((step, index) => {
              const Icon = STEP_ICONS[index] ?? Building2;
              const number = String(index + 1).padStart(2, "0");
              const isLeft = index % 2 === 0;
              const entrance = STEP_ENTRANCES[index] ?? STEP_ENTRANCES[0];

              return (
                <div key={number} className="lp-simple-start__row">
                  <motion.article
                    className={`lp-simple-start__card ${
                      isLeft ? "lp-simple-start__card--left" : "lp-simple-start__card--right"
                    }`}
                    initial={reduceMotion ? { opacity: 0 } : entrance}
                    whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-90px" }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.78,
                      delay: index * 0.05,
                      ease: easePremium,
                    }}
                    whileHover={
                      reduceMotion
                        ? undefined
                        : { y: -6, rotate: isLeft ? -0.6 : 0.6, scale: 1.012 }
                    }
                  >
                    <div className="lp-simple-start__card-glow" aria-hidden />
                    <div className="lp-simple-start__card-body">
                      <div className="lp-simple-start__card-copy">
                        <span className="lp-simple-start__step-label">
                          {t("marketing.simpleStart.stepLabel", { number })}
                        </span>
                        <h3 className="lp-simple-start__card-title">{step.title}</h3>
                        <p className="lp-simple-start__card-text">{step.description}</p>
                      </div>
                      <span className="lp-simple-start__icon" aria-hidden>
                        <span className="lp-simple-start__icon-ring" />
                        <Icon className="lp-simple-start__icon-svg" strokeWidth={1.8} />
                      </span>
                    </div>
                    <div className="lp-simple-start__marks" aria-hidden>
                      <span />
                      <span />
                      <span />
                    </div>
                  </motion.article>

                  <div className="lp-simple-start__node" aria-hidden>
                    <span>{number}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <motion.p
            className="lp-simple-start__aside"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.65, ease: easePremium, delay: 0.08 }}
          >
            {t("marketing.simpleStart.aside")}
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
