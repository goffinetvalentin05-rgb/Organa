"use client";

import { motion } from "framer-motion";
import HeroHubVisual from "@/components/landing/HeroHubVisual";
import { LandingPrimaryButton, LandingSecondaryButton } from "@/components/landing/LandingButtons";
import {
  easePremium,
  heroTitleLine,
  staggerContainer,
  staggerItem,
} from "@/components/landing/landing-motion";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col items-center justify-center scroll-mt-0 px-3 pb-16 pt-32 sm:px-4 sm:pb-20 sm:pt-36 md:pb-24 md:pt-40 lg:pt-44"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[85%] bg-[radial-gradient(ellipse_75%_55%_at_50%_15%,rgba(26,35,255,0.32),transparent)]"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-[920px] flex-col items-center justify-center text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex w-full flex-col items-center"
        >
          <motion.p
            variants={staggerItem}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200/90"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
            Plateforme tout-en-un · Suisse
          </motion.p>

          <motion.h1
            variants={heroTitleLine}
            className="max-w-[18ch] text-balance text-[2.15rem] font-black leading-[1.05] tracking-[-0.038em] text-white sm:max-w-none sm:text-5xl md:text-6xl lg:text-[4rem] lg:leading-[1.02]"
          >
            Gérez votre club sans perdre vos soirées.
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-blue-100/80 md:mt-6 md:text-lg"
          >
            Factures, membres, cotisations, événements et paiements réunis dans un seul logiciel
            pensé pour les clubs sportifs.
          </motion.p>

          <motion.div
            variants={staggerItem}
            className="mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center"
          >
            <LandingPrimaryButton href="/inscription" className="w-full sm:w-auto">
              Tester Obillz gratuitement
            </LandingPrimaryButton>
            <LandingSecondaryButton href="#comment-ca-marche" className="w-full sm:w-auto">
              Voir comment ça marche
            </LandingSecondaryButton>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: easePremium }}
          className="relative mt-14 w-full max-w-[780px] sm:mt-16 md:mt-20 lg:mt-24"
        >
          <div
            className="pointer-events-none absolute inset-x-[10%] top-1/2 -z-10 h-[60%] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.4),transparent_70%)] blur-3xl"
            aria-hidden
          />
          <HeroHubVisual />
        </motion.div>
      </div>
    </section>
  );
}
