"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function LandingBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 min-h-[100dvh] overflow-hidden bg-[#020617]"
      aria-hidden
    >
      {/* Lumière principale — haut centre */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-5%,rgba(26,35,255,0.45),transparent_55%)]" />
      {/* Wash gauche */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_0%_45%,rgba(37,99,235,0.2),transparent_55%)]" />
      {/* Wash droite violet */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_100%_75%,rgba(99,102,241,0.22),transparent_55%)]" />
      {/* Centre violet diffus */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_30%,rgba(139,92,246,0.1),transparent_65%)]" />
      {/* Vignette bas */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_100%,rgba(0,0,0,0.6),transparent_70%)]" />

      {/* Faisceau lumineux vertical — hero */}
      <div className="absolute left-1/2 top-0 h-[70vh] w-[min(600px,80vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(26,35,255,0.25),rgba(99,102,241,0.08)_50%,transparent_80%)] blur-2xl" />

      <motion.div
        className="landing-orb absolute -left-[15%] top-[20%] h-[min(500px,70vw)] w-[min(500px,70vw)] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.35),rgba(99,102,241,0.12)_50%,transparent_70%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45], x: [0, 24, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute -right-[10%] top-[55%] h-[min(420px,58vw)] w-[min(420px,58vw)] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.25),rgba(139,92,246,0.1)_50%,transparent_70%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.35, 0.65, 0.35], x: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="landing-orb absolute left-[30%] bottom-[15%] h-[min(300px,40vw)] w-[min(300px,40vw)] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2),transparent_70%)] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.25, 0.5, 0.25], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      <div className="landing-noise absolute inset-0 opacity-[0.05] mix-blend-overlay" />

      {!reduceMotion ? (
        <>
          {[12, 28, 45, 62, 78].map((top, i) => (
            <motion.div
              key={top}
              className="absolute h-1.5 w-1.5 rounded-full bg-blue-300/60 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
              style={{ left: `${15 + i * 14}%`, top: `${top}%` }}
              animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.5, 1] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </>
      ) : null}
    </div>
  );
}
