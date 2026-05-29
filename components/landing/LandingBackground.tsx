"use client";

import { motion } from "framer-motion";

/** Fond global — gradients radiaux, halos, formes discrètes */
export default function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_-25%,rgba(255,255,255,0.14),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_0%_40%,rgba(139,92,246,0.14),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_100%_70%,rgba(59,130,246,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(26,35,255,0.35),transparent_60%)]" />

      <motion.div
        className="landing-orb absolute left-[-18%] top-[38%] h-[min(520px,70vw)] w-[min(520px,70vw)] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.16),transparent_68%)] blur-3xl"
        animate={{ opacity: [0.45, 0.75, 0.45], x: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute right-[-14%] top-[58%] h-[min(440px,60vw)] w-[min(440px,60vw)] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.14),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.35, 0.65, 0.35], x: [0, -24, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div
        className="absolute left-[8%] top-[22%] h-px w-[28%] rotate-[-12deg] bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden
      />
      <div
        className="absolute right-[6%] top-[48%] h-px w-[22%] rotate-[8deg] bg-gradient-to-r from-transparent via-white/15 to-transparent"
        aria-hidden
      />
      <div
        className="absolute bottom-[18%] left-1/2 h-32 w-32 -translate-x-1/2 rounded-full border border-white/[0.06] opacity-40"
        aria-hidden
      />
    </div>
  );
}
