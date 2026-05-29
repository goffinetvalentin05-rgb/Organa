"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import HeroProductPreview from "@/components/landing/HeroProductPreview";
import { heroSatelliteWidgets } from "@/components/landing/hero-widgets";
import { easePremium } from "@/components/landing/landing-motion";
import { ProductWidgetCard } from "@/components/landing/ProductWidget";

const liveToasts = [
  { id: "t1", label: "Cotisation", text: "48 emails envoyés", tone: "blue" as const },
  { id: "t2", label: "Paiement", text: "CHF 120 reçu · Martin L.", tone: "green" as const },
  { id: "t3", label: "Événement", text: "12 nouvelles inscriptions", tone: "blue" as const },
];

const satellitePositions = [
  "lg:col-start-1 lg:row-start-1 lg:justify-self-end lg:self-end",
  "lg:col-start-3 lg:row-start-1 lg:justify-self-start lg:self-end",
  "lg:col-start-1 lg:row-start-3 lg:justify-self-end lg:self-start",
  "lg:col-start-3 lg:row-start-3 lg:justify-self-start lg:self-start",
];

export default function HeroProductScene() {
  const reduceMotion = useReducedMotion();
  const [toastIndex, setToastIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setToastIndex((i) => (i + 1) % liveToasts.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const toast = liveToasts[toastIndex];

  return (
    <div className="relative mx-auto w-full max-w-[1100px] px-0 sm:px-2">
      <div
        className="pointer-events-none absolute inset-x-[5%] top-[12%] -z-10 h-[65%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.28),transparent_65%)] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-[25%] bottom-0 -z-10 h-40 rounded-full bg-[#1A23FF]/55 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] -z-10 h-px w-[min(92%,720px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        aria-hidden
      />

      <div className="hidden lg:grid lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,200px)] lg:grid-rows-[auto_1fr_auto] lg:items-center lg:gap-x-6 lg:gap-y-4">
        {heroSatelliteWidgets.map((widget, index) => (
          <div key={widget.id} className={satellitePositions[index]}>
            <HeroSatellite widget={widget} delay={0.72 + index * 0.1} floatIndex={index} />
          </div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.95, delay: 0.38, ease: easePremium }}
          className="relative z-10 lg:col-start-2 lg:row-start-1 lg:row-span-3"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2,
            }}
            className="relative"
          >
            <HeroProductPreview embedded showLiveToast={false} />
            <div className="pointer-events-none absolute left-1/2 top-[14%] z-20 w-[min(92%,280px)] -translate-x-1/2 sm:top-[12%]">
              <AnimatePresence mode="wait">
                {!reduceMotion ? (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: -12, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.45, ease: easePremium }}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-[0_16px_40px_rgba(2,6,23,0.28)] backdrop-blur-md ${
                      toast.tone === "green"
                        ? "border-emerald-300/50 bg-white/95"
                        : "border-[#1A23FF]/25 bg-white/95"
                    }`}
                  >
                    <span
                      className={`flex h-2 w-2 shrink-0 rounded-full ${
                        toast.tone === "green" ? "bg-emerald-500" : "bg-[#1A23FF]"
                      }`}
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        {toast.label}
                      </p>
                      <p className="truncate text-xs font-bold text-slate-900">{toast.text}</p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.42, ease: easePremium }}
        className="lg:hidden"
      >
        <HeroProductPreview embedded showLiveToast />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {heroSatelliteWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.58 + index * 0.08, ease: easePremium }}
            >
              <ProductWidgetCard {...widget} icon={widget.icon} compact />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function HeroSatellite({
  widget,
  delay,
  floatIndex,
}: {
  widget: (typeof heroSatelliteWidgets)[number];
  delay: number;
  floatIndex: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.86, y: 24 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion ? 0 : [0, -10, 0],
      }}
      transition={{
        opacity: { duration: 0.65, delay, ease: easePremium },
        scale: { duration: 0.65, delay, ease: easePremium },
        y: reduceMotion
          ? undefined
          : {
              duration: 5.5 + floatIndex * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: delay + 0.5,
            },
      }}
      className="w-full max-w-[200px]"
    >
      <ProductWidgetCard
        {...widget}
        icon={widget.icon}
        className="shadow-[0_24px_52px_rgba(2,6,23,0.24),0_0_0_1px_rgba(255,255,255,0.55)_inset]"
      />
    </motion.div>
  );
}
