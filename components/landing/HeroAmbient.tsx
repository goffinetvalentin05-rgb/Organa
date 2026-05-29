"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Fond hero : spotlights, halos, grille masquée — palette Obillz uniquement */
export default function HeroAmbient() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(255,255,255,0.28),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_30%,rgba(59,130,246,0.2),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_48%_at_100%_40%,rgba(26,35,255,0.26),transparent_58%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(ellipse_90%_70%_at_50%_100%,rgba(26,35,255,0.35),transparent_65%)]" />

      <motion.div
        className="landing-orb absolute -left-[6%] top-[2%] h-[min(520px,65vw)] w-[min(520px,65vw)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),transparent_68%)] blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 32, 0], y: [0, -20, 0], opacity: [0.6, 1, 0.6] }
        }
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="landing-orb absolute -right-[4%] top-[18%] h-[min(460px,58vw)] w-[min(460px,58vw)] rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.2),transparent_70%)] blur-3xl"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -26, 0], y: [0, 16, 0], opacity: [0.5, 0.88, 0.5] }
        }
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />
      <motion.div
        className="landing-orb absolute bottom-[2%] left-1/2 h-[min(380px,52vw)] w-[min(640px,88vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.55),transparent_74%)] blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.1, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_95%_85%_at_50%_25%,black,transparent)]" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="absolute inset-x-[10%] bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div
        className="absolute left-1/2 top-[42%] h-[min(480px,70vw)] w-[min(900px,95vw)] -translate-x-1/2 rounded-full border border-white/[0.04] opacity-60"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-[48%] h-[min(320px,50vw)] w-[min(640px,80vw)] -translate-x-1/2 rounded-full border border-white/[0.06] opacity-40"
        aria-hidden
      />
    </div>
  );
}
