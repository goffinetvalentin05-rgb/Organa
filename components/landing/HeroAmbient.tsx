"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Fond hero : halos bleus Obillz, grille, profondeur */
export default function HeroAmbient() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_-8%,rgba(255,255,255,0.24),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_0%_45%,rgba(59,130,246,0.22),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_42%_at_100%_55%,rgba(26,35,255,0.28),transparent_55%)]" />

      <motion.div
        className="landing-orb absolute -left-[8%] top-[8%] h-[min(480px,60vw)] w-[min(480px,60vw)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_68%)] blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 28, 0], y: [0, -18, 0], opacity: [0.65, 1, 0.65] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute -right-[6%] top-[22%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.24),transparent_70%)] blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -22, 0], y: [0, 14, 0], opacity: [0.55, 0.9, 0.55] }
        }
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="landing-orb absolute bottom-[4%] left-1/2 h-[min(360px,50vw)] w-[min(520px,75vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.5),transparent_72%)] blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_90%_80%_at_50%_30%,black,transparent)]" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="absolute inset-x-[8%] bottom-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
    </div>
  );
}
