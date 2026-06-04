"use client";

import { motion } from "framer-motion";
import { easePremium } from "@/components/landing/landing-motion";

const RINGS = [1, 1.55, 2.15] as const;

type TransitCoreProps = {
  inView: boolean;
  motionOn: boolean;
};

export default function TransitCore({ inView, motionOn }: TransitCoreProps) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-[12] -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.7, delay: 0.15, ease: easePremium }}
    >
      {/* Halo diffus */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.35),transparent_68%)] blur-2xl sm:h-40 sm:w-40"
        animate={motionOn ? { opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] } : undefined}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      {/* Anneaux fins */}
      {RINGS.map((scale, i) => (
        <motion.div
          key={scale}
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-white/[0.07]"
          style={{
            width: `${3.25 * scale}rem`,
            height: `${3.25 * scale}rem`,
            marginLeft: `${-1.625 * scale}rem`,
            marginTop: `${-1.625 * scale}rem`,
          }}
          animate={
            motionOn
              ? {
                  rotate: i % 2 === 0 ? 360 : -360,
                  opacity: [0.25, 0.5, 0.25],
                }
              : { opacity: 0.3 }
          }
          transition={{
            rotate: { duration: 22 + i * 8, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
          }}
          aria-hidden
        />
      ))}

      {/* Noyau */}
      <motion.div
        className="relative flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16"
        animate={motionOn ? { scale: [1, 1.03, 1] } : undefined}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1A23FF]/80 to-[#6366f1]/40 blur-md" aria-hidden />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0a0f24]/90 shadow-[0_0_32px_rgba(26,35,255,0.55),inset_0_1px_0_rgba(255,255,255,0.15)] sm:h-12 sm:w-12">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#1A23FF] to-[#4338ca] shadow-[0_0_20px_rgba(26,35,255,0.7)]">
            <span className="text-[10px] font-bold tracking-tight text-white">O</span>
          </div>
        </div>
      </motion.div>

      {motionOn ? (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1A23FF]/40"
          animate={{ scale: [1, 1.65], opacity: [0.4, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      ) : null}
    </motion.div>
  );
}
