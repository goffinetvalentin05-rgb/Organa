"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
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
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col overflow-x-hidden px-5 sm:px-8"
    >
        {/* Halo centré — respiration légère */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[38%] h-[min(520px,70vw)] w-[min(720px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.35),transparent_68%)]"
          aria-hidden
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.5, 0.85, 0.5], scale: [1, 1.04, 1] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="flex flex-1 flex-col items-center justify-center pb-12 pt-24 sm:pb-16 sm:pt-28 md:pt-32">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex w-full max-w-[56rem] flex-col items-center text-center lg:max-w-[68rem]"
          >
            <motion.h1
              variants={heroTitleLine}
              className="font-bold tracking-[-0.04em] text-white"
            >
              <span className="block text-[2.5rem] leading-[1.1] sm:text-[3rem] md:text-[3.85rem] lg:text-[4.85rem] lg:leading-[1.1] xl:text-[5.35rem]">
                {t("marketing.hero.titleLine1")}
              </span>
              <span className="mt-1 block text-[2.5rem] leading-[1.1] sm:mt-1.5 sm:text-[3rem] md:text-[3.85rem] lg:text-[4.85rem] lg:leading-[1.1] xl:text-[5.35rem]">
                {t("marketing.hero.titleLine2")}
              </span>
            </motion.h1>

            <motion.p
              variants={heroSubtitleLine}
              className="mt-6 max-w-[36rem] text-pretty text-[0.9375rem] leading-[1.65] text-white/45 sm:mt-7 sm:text-base md:mt-8 md:max-w-[40rem] md:text-[1.0625rem] md:leading-[1.7] lg:text-lg"
            >
              {t("marketing.hero.subtitle")}
            </motion.p>

            <motion.div
              variants={heroCtaEnter}
              className="relative z-20 mt-8 sm:mt-9 md:mt-10"
            >
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.22, ease: easePremium }}
                className="group relative inline-flex"
              >
                <motion.span
                  className="pointer-events-none absolute -inset-2 rounded-full bg-[#1A23FF]/40 blur-2xl"
                  aria-hidden
                  animate={
                    reduceMotion
                      ? undefined
                      : { opacity: [0.45, 0.9, 0.45], scale: [0.95, 1.05, 0.95] }
                  }
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <Link
                  href="/inscription"
                  className="relative inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1A23FF] px-8 py-3.5 text-[0.9375rem] font-semibold text-white shadow-[0_0_48px_rgba(26,35,255,0.55),0_4px_24px_rgba(26,35,255,0.35)] transition-[background,box-shadow] duration-300 hover:bg-[#222bff] hover:shadow-[0_0_64px_rgba(26,35,255,0.7),0_6px_32px_rgba(26,35,255,0.45)] sm:px-9 sm:py-4 sm:text-base"
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
          </motion.div>
        </div>
    </section>
  );
}
