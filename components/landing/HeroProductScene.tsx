"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import HeroProductPreview from "@/components/landing/HeroProductPreview";
import { heroSatelliteWidgets } from "@/components/landing/hero-widgets";
import { easePremium, scaleIn } from "@/components/landing/landing-motion";
import { ProductWidgetCard } from "@/components/landing/ProductWidget";

const liveToasts = [
  { id: "t1", label: "Cotisation", text: "48 cotisations envoyées" },
  { id: "t2", label: "Paiement", text: "CHF 120 reçu · Martin L." },
  { id: "t3", label: "Événement", text: "12 nouvelles inscriptions" },
];

const satellitePositions = [
  "lg:col-start-1 lg:row-start-1 lg:justify-self-end lg:self-end lg:pr-2",
  "lg:col-start-3 lg:row-start-1 lg:justify-self-start lg:self-end lg:pl-2",
  "lg:col-start-1 lg:row-start-3 lg:justify-self-end lg:self-start lg:pr-2",
  "lg:col-start-3 lg:row-start-3 lg:justify-self-start lg:self-start lg:pl-2",
];

export default function HeroProductScene() {
  const reduceMotion = useReducedMotion();
  const [toastIndex, setToastIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setToastIndex((i) => (i + 1) % liveToasts.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const toast = liveToasts[toastIndex];

  return (
    <div className="relative mx-auto w-full max-w-[1140px] px-0 sm:px-2">
      <div
        className="pointer-events-none absolute inset-x-[2%] top-[8%] -z-10 h-[72%] rounded-full bg-[radial-gradient(ellipse,rgba(255,255,255,0.32),transparent_68%)] blur-3xl"
        aria-hidden
      />
      <div
        className="landing-hero-stage pointer-events-none absolute inset-x-[8%] bottom-[-2%] -z-10 h-48 blur-2xl md:h-56"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-[18%] bottom-2 -z-10 h-24 rounded-full bg-[#1A23FF]/50 blur-[72px] md:h-32"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[36%] -z-10 h-px w-[min(94%,760px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        aria-hidden
      />

      <div className="hidden lg:grid lg:grid-cols-[minmax(0,210px)_minmax(0,1fr)_minmax(0,210px)] lg:grid-rows-[minmax(0,auto)_1fr_minmax(0,auto)] lg:items-center lg:gap-x-8 lg:gap-y-6">
        {heroSatelliteWidgets.map((widget, index) => (
          <div key={widget.id} className={satellitePositions[index]}>
            <HeroSatellite widget={widget} delay={0.78 + index * 0.11} floatIndex={index} />
          </div>
        ))}

        <motion.div
          custom={0.32}
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="relative z-10 lg:col-start-2 lg:row-start-1 lg:row-span-3"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
            transition={{
              duration: 7.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.4,
            }}
            className="relative mx-auto max-w-[820px]"
          >
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18),transparent_72%)] blur-xl"
              aria-hidden
            />
            <HeroProductPreview embedded showLiveToast={false} />
            <div className="pointer-events-none absolute left-1/2 top-[11%] z-20 w-[min(90%,300px)] -translate-x-1/2">
              <AnimatePresence mode="wait">
                {!reduceMotion ? (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: -14, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.94 }}
                    transition={{ duration: 0.42, ease: easePremium }}
                    className="flex items-center gap-2.5 rounded-xl border border-[#1A23FF]/20 bg-white/97 px-4 py-2.5 shadow-[0_20px_48px_rgba(2,6,23,0.26),0_0_24px_rgba(26,35,255,0.12)] backdrop-blur-md"
                  >
                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#1A23FF] shadow-[0_0_8px_rgba(26,35,255,0.6)]" />
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
        custom={0.38}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="lg:hidden"
      >
        <HeroProductPreview embedded showLiveToast />
        <div className="mt-5 grid grid-cols-2 gap-3">
          {heroSatelliteWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 22, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.62 + index * 0.09, ease: easePremium }}
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
      initial={{ opacity: 0, scale: 0.84, y: 28 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion ? 0 : [0, -11, 0],
      }}
      transition={{
        opacity: { duration: 0.68, delay, ease: easePremium },
        scale: { duration: 0.68, delay, ease: easePremium },
        y: reduceMotion
          ? undefined
          : {
              duration: 5.8 + floatIndex * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
              delay: delay + 0.6,
            },
      }}
      className="w-full max-w-[210px]"
    >
      <ProductWidgetCard
        {...widget}
        icon={widget.icon}
        className="shadow-[0_28px_56px_rgba(2,6,23,0.22),0_0_0_1px_rgba(255,255,255,0.6)_inset,0_0_32px_rgba(26,35,255,0.08)]"
      />
    </motion.div>
  );
}
