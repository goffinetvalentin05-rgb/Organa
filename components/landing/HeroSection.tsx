"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import HeroDemoVideo from "@/components/landing/HeroDemoVideo";
import {
  easePremium,
  heroCtaEnter,
  heroSubtitleLine,
  heroTitleLine,
  staggerContainer,
} from "@/components/landing/landing-motion";

export default function HeroSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section id="hero" className="landing-hero-shell relative flex flex-col">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[min(520px,70vw)] w-[min(720px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.4),rgba(99,102,241,0.1)_50%,transparent_68%)] blur-xl"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.45, 0.75, 0.45], scale: [1, 1.04, 1] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="landing-hero-content">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="landing-hero-stack relative z-10 flex w-full flex-col items-center text-center"
        >
          <motion.h1 variants={heroTitleLine} className="landing-hero-title landing-hero-title-glow display-title">
            <span className="landing-hero-title-desktop">
              <span className="landing-hero-title-line">{t("marketing.hero.titleLine1")}</span>
              <span className="landing-hero-title-line">{t("marketing.hero.titleLine2")}</span>
            </span>
            <span className="landing-hero-title-mobile">
              <span className="landing-hero-title-line">{t("marketing.hero.titleMobileLine1")}</span>
              <span className="landing-hero-title-line">{t("marketing.hero.titleMobileLine2")}</span>
              <span className="landing-hero-title-line">{t("marketing.hero.titleMobileLine3")}</span>
            </span>
          </motion.h1>

          <motion.p variants={heroSubtitleLine} className="landing-hero-description text-pretty">
            {t("marketing.hero.subtitle")}
          </motion.p>

          <motion.div variants={heroCtaEnter} className="landing-hero-cta-wrap">
            <div className="lp-hero-ctas">
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -3 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.22, ease: easePremium }}
              >
                <Link
                  href="/inscription"
                  className="landing-hero-cta group relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-[0.9375rem] font-semibold text-white sm:px-9 sm:py-4 sm:text-base"
                >
                  {t("marketing.hero.ctaPrimary")}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </Link>
              </motion.div>
              <Link href="/#en-pratique" className="lp-hero-secondary">
                {t("marketing.hero.ctaSecondary")}
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="landing-hero-video-slot">
        <div className="landing-hero-video-compose relative">
          <div className="lp-hero-product-glow" aria-hidden />
          <HeroDemoVideo />
        </div>
      </div>
    </section>
  );
}
