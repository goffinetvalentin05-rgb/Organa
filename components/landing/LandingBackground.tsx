"use client";

import { motion } from "framer-motion";

/** Lueurs globales de page — complète le hero sans surcharge */
export default function LandingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgba(255,255,255,0.08),transparent_50%)]" />
      <motion.div
        className="landing-orb absolute left-[-15%] top-[45%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute right-[-10%] top-[65%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1),transparent_70%)] blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}
