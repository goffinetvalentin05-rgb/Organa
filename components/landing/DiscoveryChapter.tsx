"use client";

import { motion, useReducedMotion } from "framer-motion";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyChooseSection from "@/components/landing/WhyChooseSection";
import AskChatGptSection from "@/components/landing/AskChatGptSection";
import { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

/** Chapitre unique 02 + 03 + CTA — un seul panneau bleu Obillz. */
export default function DiscoveryChapter() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`${landingSectionShellClass()} discovery-chapter scroll-mt-32 overflow-x-hidden md:scroll-mt-36`}
    >
      <motion.div
        className="how-it-works-panel"
        initial={reduceMotion ? false : { opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.85, ease: easePremium }}
      >
        <div className="how-it-works-panel__bg" aria-hidden />
        <div className="how-it-works-panel__grid" aria-hidden />
        <motion.div
          className="how-it-works-panel__halo how-it-works-panel__halo--a"
          aria-hidden
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 28, -12, 0], y: [0, -18, 14, 0], opacity: [0.55, 0.85, 0.6, 0.55] }
          }
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="how-it-works-panel__halo how-it-works-panel__halo--b"
          aria-hidden
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -22, 18, 0], y: [0, 16, -10, 0], opacity: [0.4, 0.7, 0.45, 0.4] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
        />
        <motion.div
          className="how-it-works-panel__halo how-it-works-panel__halo--c"
          aria-hidden
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 16, -20, 0], y: [0, -12, 18, 0], opacity: [0.35, 0.65, 0.4, 0.35] }
          }
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
        />
        <motion.div
          className="how-it-works-panel__glow"
          aria-hidden
          animate={
            reduceMotion ? undefined : { opacity: [0.45, 0.8, 0.45], scale: [1, 1.06, 1] }
          }
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="how-it-works-panel__glow how-it-works-panel__glow--lower"
          aria-hidden
          animate={
            reduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [1, 1.05, 1] }
          }
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
        />

        <div className="how-it-works-panel__content how-it-works-panel__content--chapter">
          <HowItWorksSection />
          <WhyChooseSection />
          <AskChatGptSection embedded />
        </div>
      </motion.div>
    </div>
  );
}
