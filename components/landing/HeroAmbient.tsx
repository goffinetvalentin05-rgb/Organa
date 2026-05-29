"use client";

import { motion } from "framer-motion";

/** Fond hero : halos animés, grille, spot — sans impact perf (CSS + FM léger) */
export default function HeroAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-5%,rgba(255,255,255,0.22),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_50%,rgba(59,130,246,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_100%_60%,rgba(99,102,241,0.2),transparent_55%)]" />

      <motion.div
        className="landing-orb absolute -left-[10%] top-[12%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_68%)] blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, -16, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute -right-[8%] top-[28%] h-[min(380px,50vw)] w-[min(380px,50vw)] rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.22),transparent_70%)] blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 12, 0], opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="landing-orb absolute bottom-[8%] left-1/2 h-[min(320px,45vw)] w-[min(480px,70vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.45),transparent_72%)] blur-3xl"
        animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,black,transparent)]" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="absolute inset-x-[10%] bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </div>
  );
}
