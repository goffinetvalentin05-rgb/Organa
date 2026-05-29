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

/** Hauteur réservée pour la nav fixe (LandingNav) — alignée sur pt + header + logo */
const LANDING_NAV_RESERVE =
  "h-[4.75rem] shrink-0 sm:h-[5rem] md:h-[5.25rem]";

export default function HeroSection() {
  return (
    <>
      <section
        id="hero"
        className="relative flex h-[100svh] max-h-[100svh] min-h-[100svh] flex-col overflow-hidden px-3 sm:px-4"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[85%] bg-[radial-gradient(ellipse_75%_55%_at_50%_15%,rgba(26,35,255,0.32),transparent)]"
          aria-hidden
        />

        <div className={LANDING_NAV_RESERVE} aria-hidden />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex w-full max-w-[920px] flex-col items-center"
          >
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
        </div>
      </section>

      <section
        className="relative px-3 pb-12 pt-2 sm:px-4 sm:pb-16 md:pb-20"
        aria-label="Aperçu des modules Obillz"
      >
        <div className="relative mx-auto w-full max-w-[900px] overflow-visible">
          <div
            className="pointer-events-none absolute inset-x-[10%] top-1/2 -z-10 h-[60%] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.4),transparent_70%)] blur-3xl"
            aria-hidden
          />
          <HeroHubVisual />
        </div>
      </section>
    </>
  );
}
