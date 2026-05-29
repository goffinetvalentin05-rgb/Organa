"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

const stats = [
  { value: "124", label: "membres suivis" },
  { value: "CHF 8’420", label: "encaissés" },
  { value: "17", label: "factures envoyées" },
  { value: "3", label: "événements actifs" },
  { value: "92%", label: "des cotisations suivies" },
];

export default function StatsShowcaseSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="stats" className="relative overflow-hidden py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(26,35,255,0.2),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1160px]">
        <motion.p
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80"
        >
          Vue d&apos;ensemble en temps réel
        </motion.p>

        <div className="relative mt-10 md:mt-12">
          <div
            className="pointer-events-none absolute inset-x-[5%] top-1/2 h-32 -translate-y-1/2 rounded-full bg-[#1A23FF]/30 blur-[80px]"
            aria-hidden
          />

          <div className="relative flex flex-col gap-4 md:hidden">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} reduceMotion={!!reduceMotion} />
            ))}
          </div>

          <div
            className="relative hidden md:grid md:grid-cols-5 md:gap-4"
            style={{ perspective: "1200px" }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40, rotateX: 12 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.65, delay: i * 0.08, ease: easePremium }}
                animate={
                  reduceMotion
                    ? undefined
                    : { y: [0, i % 2 === 0 ? -6 : -4, 0] }
                }
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${i * 8}px) rotateY(${(i - 2) * 3}deg)`,
                }}
              >
                <StatCard stat={stat} index={i} reduceMotion={!!reduceMotion} className="h-full" />
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

function StatCard({
  stat,
  index,
  reduceMotion,
  className = "",
}: {
  stat: (typeof stats)[number];
  index: number;
  reduceMotion: boolean;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.55, delay: index * 0.06, ease: easePremium }}
      animate={reduceMotion ? undefined : { y: [0, index % 2 === 0 ? -5 : -3, 0] }}
      className={`group relative rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35),0_0_24px_rgba(26,35,255,0.12)] backdrop-blur-xl transition hover:border-blue-400/30 hover:shadow-[0_20px_56px_rgba(26,35,255,0.2)] md:p-6 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
      <p className="text-2xl font-black tabular-nums tracking-tight text-white md:text-3xl">
        {stat.value}
      </p>
      <p className="mt-1.5 text-sm font-medium text-blue-100/65">{stat.label}</p>
    </motion.div>
  );
}
