"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";

type HeroStoryCtaProps = {
  /** Conservé pour compatibilité — l’apparition ne dépend plus de ce flag. */
  ready?: boolean;
};

export default function HeroStoryCta(_props: HeroStoryCtaProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="landing-hero-story-cta-wrap"
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reduceMotion ? 0.2 : 0.55,
        delay: reduceMotion ? 0 : 0.85,
        ease: easePremium,
      }}
    >
      <motion.div
        className="landing-hero-story-cta-float"
        animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.4,
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
