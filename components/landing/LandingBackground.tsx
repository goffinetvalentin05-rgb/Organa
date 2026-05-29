"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Fond global — profondeur, halos bleus Obillz, vignette */
export default function LandingBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_-18%,rgba(255,255,255,0.16),transparent_54%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_0%_35%,rgba(59,130,246,0.14),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_65%,rgba(26,35,255,0.22),transparent_56%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_100%,rgba(26,35,255,0.4),transparent_62%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_50%,transparent_40%,rgba(8,12,120,0.35)_100%)]" />

      <motion.div
        className="landing-orb absolute left-[-20%] top-[32%] h-[min(560px,72vw)] w-[min(560px,72vw)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_68%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.4, 0.7, 0.4], x: [0, 36, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute right-[-16%] top-[52%] h-[min(480px,62vw)] w-[min(480px,62vw)] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.14),transparent_70%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.35, 0.62, 0.35], x: [0, -28, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
      />
      <motion.div
        className="landing-orb absolute bottom-[-8%] left-1/2 h-[min(400px,55vw)] w-[min(720px,90vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.42),transparent_72%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div
        className="absolute left-[6%] top-[18%] h-px w-[32%] rotate-[-14deg] bg-gradient-to-r from-transparent via-white/22 to-transparent"
        aria-hidden
      />
      <div
        className="absolute right-[4%] top-[42%] h-px w-[26%] rotate-[10deg] bg-gradient-to-r from-transparent via-white/16 to-transparent"
        aria-hidden
      />
      <div
        className="absolute bottom-[22%] left-1/2 h-px w-[40%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/12 to-transparent"
        aria-hidden
      />

      <div className="landing-noise absolute inset-0 opacity-[0.035] mix-blend-overlay" />
    </div>
  );
}
