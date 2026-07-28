"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import HeroStoryCta from "@/components/landing/HeroStoryCta";
import {
  easePremium,
  heroCtaEnter,
  heroSubtitleLine,
  heroTitleLine,
  staggerContainer,
} from "@/components/landing/landing-motion";
import TrustStatsSection from "@/components/landing/TrustStatsSection";

export default function HeroSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="hero"
      className="landing-hero-shell relative flex flex-col overflow-x-hidden"
    >
      {/* Halo centré — discret */}
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
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-[radial-gradient(ellipse_90%_100%_at_50%_100%,rgba(26,35,255,0.12),transparent_70%)]"
        aria-hidden
      />

      <div className="landing-hero-content">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex w-full flex-col items-center text-center"
        >
          <motion.h1
            variants={heroTitleLine}
            className="landing-hero-title landing-hero-title-glow display-title text-white"
          >
            <span className="landing-hero-title-line">
              {t("marketing.hero.titleLine1")}
            </span>
            <span className="landing-hero-title-line">
              {t("marketing.hero.titleLine2")}
            </span>
          </motion.h1>

          <motion.p
            variants={heroSubtitleLine}
            className="landing-hero-description text-pretty text-blue-100/60"
          >
            {t("marketing.hero.subtitle")}
          </motion.p>

          <motion.div variants={heroCtaEnter} className="landing-hero-cta-wrap">
            <motion.div
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.22, ease: easePremium }}
              className="group relative inline-flex w-full justify-center"
            >
              <motion.span
                className="pointer-events-none absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.5),rgba(99,102,241,0.2)_60%,transparent_70%)] blur-2xl"
                aria-hidden
                animate={
                  reduceMotion
                    ? undefined
                    : { opacity: [0.5, 0.85, 0.5], scale: [0.92, 1.06, 0.92] }
                }
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <Link
                href="/inscription"
                className="landing-hero-cta relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-[0.9375rem] font-semibold text-white shadow-[0_0_48px_rgba(26,35,255,0.55),0_4px_24px_rgba(26,35,255,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] transition-[background,box-shadow] duration-300 hover:shadow-[0_0_72px_rgba(26,35,255,0.75),0_6px_32px_rgba(26,35,255,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] sm:px-9 sm:py-4 sm:text-base"
              >
                {t("marketing.hero.ctaPrimary")}
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </Link>
            </motion.div>
          </motion.div>

          <div className="landing-hero-story-cta-slot">
            <HeroStoryCta />
          </div>
        </motion.div>
      </div>

      <TrustStatsSection />
    </section>
  );
}
