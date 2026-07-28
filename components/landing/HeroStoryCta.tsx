"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";

const APPEAR_DELAY_MS = 900;

type HeroStoryCtaProps = {
  /** True quand le préloader a terminé (ou n’a pas été joué). */
  ready?: boolean;
};

export default function HeroStoryCta({ ready = true }: HeroStoryCtaProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) {
      setVisible(false);
      return;
    }
    const delay = reduceMotion ? 120 : APPEAR_DELAY_MS;
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [ready, reduceMotion]);

  return (
    <motion.div
      className="landing-hero-story-cta-wrap"
      initial={false}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 10, scale: 0.96 }
      }
      transition={{ duration: reduceMotion ? 0.2 : 0.55, ease: easePremium }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <motion.div
        className="landing-hero-story-cta-float"
        animate={
          reduceMotion || !visible
            ? undefined
            : { y: [0, -4, 0] }
        }
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Link href="/notre-histoire" className="landing-hero-story-cta">
          <span className="landing-hero-story-cta__glow" aria-hidden />
          <span className="landing-hero-story-cta__icon" aria-hidden>
            <Image
              src="/logo-page-chargement.png"
              alt=""
              width={64}
              height={64}
              className="landing-hero-story-cta__logo"
              sizes="28px"
            />
          </span>
          <span className="landing-hero-story-cta__label">
            {t("marketing.storyWidget.title")}
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
