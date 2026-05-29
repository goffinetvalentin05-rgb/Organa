"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function LandingBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-5%,rgba(26,35,255,0.28),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_50%,rgba(37,99,235,0.1),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_80%,rgba(26,35,255,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_100%,rgba(0,0,0,0.5),transparent_70%)]" />

      <motion.div
        className="landing-orb absolute -left-[15%] top-[20%] h-[min(500px,70vw)] w-[min(500px,70vw)] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.2),transparent_70%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.3, 0.55, 0.3], x: [0, 24, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute -right-[10%] top-[55%] h-[min(420px,58vw)] w-[min(420px,58vw)] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12),transparent_70%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.25, 0.5, 0.25], x: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="landing-noise absolute inset-0 opacity-[0.04] mix-blend-overlay" />

      {!reduceMotion ? (
        <>
          {[12, 28, 45, 62, 78].map((top, i) => (
            <motion.div
              key={top}
              className="absolute h-1 w-1 rounded-full bg-blue-400/40"
              style={{ left: `${15 + i * 14}%`, top: `${top}%` }}
              animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.4, 1] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}
