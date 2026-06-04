"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import TransitCore from "@/components/landing/transit/TransitCore";
import TransitDashboard from "@/components/landing/transit/TransitDashboard";
import { FloatingAnchor, TransitNode } from "@/components/landing/transit/TransitNode";
import TransitPaths from "@/components/landing/transit/TransitPaths";
import { buildTransitPaths, TRANSIT_SOURCES } from "@/lib/landing/hero-transit";

const PARALLAX = { stiffness: 120, damping: 28, mass: 0.45 };

export default function HeroTransitVisual() {
  const { t } = useI18n();
  const uid = useId().replace(/:/g, "");
  const paths = useMemo(() => buildTransitPaths(), []);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });
  const reduceMotion = useReducedMotion();
  const motionOn = !reduceMotion && inView;
  const [finePointer, setFinePointer] = useState(false);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, PARALLAX);
  const sy = useSpring(py, PARALLAX);
  const layerX = useTransform(sx, (v) => v * 10);
  const layerY = useTransform(sy, (v) => v * 6);
  const parallaxOn = motionOn && finePointer;

  useEffect(() => {
    setFinePointer(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  return (
    <div
      ref={ref}
      aria-label={t("marketing.hero.convergenceAriaLabel")}
      className="relative mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-12 md:py-16"
      onPointerMove={(e) => {
        if (!parallaxOn || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      {/* Atmosphère */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-[6%] top-1/2 h-[50%] w-[30%] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.08),transparent_70%)] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[min(320px,50vw)] w-[min(360px,55vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.22),transparent_70%)] blur-3xl" />
        <div className="absolute right-[4%] top-1/2 h-[45%] w-[28%] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.12),transparent_68%)] blur-3xl" />
      </div>

      {/* Desktop : scène horizontale */}
      <motion.div
        style={{ x: parallaxOn ? layerX : 0, y: parallaxOn ? layerY : 0 }}
        className="relative hidden min-h-[420px] md:block lg:min-h-[440px]"
      >
        <TransitPaths
          uid={uid}
          paths={paths}
          inView={inView}
          motionOn={motionOn}
          reduceMotion={!!reduceMotion}
        />

        {TRANSIT_SOURCES.map((source) => (
          <FloatingAnchor
            key={source.id}
            source={source}
            inView={inView}
            motionOn={motionOn}
          />
        ))}

        <TransitCore inView={inView} motionOn={motionOn} />

        <div className="absolute right-[2%] top-1/2 z-[18] -translate-y-1/2 lg:right-[4%]">
          <TransitDashboard
            inView={inView}
            motionOn={motionOn}
            tagline={t("marketing.hero.hubBaseline")}
          />
        </div>
      </motion.div>

      {/* Mobile : entrée → transit → dashboard */}
      <div className="flex flex-col items-center gap-10 md:hidden">
        <div className="flex flex-wrap justify-center gap-2 px-2">
          {TRANSIT_SOURCES.slice(0, 5).map((source, i) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.45 }}
            >
              <TransitNode source={source} variant="anchor" />
            </motion.div>
          ))}
        </div>

        <div className="relative flex h-28 items-center justify-center">
          <div className="absolute h-px w-32 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
          <TransitCore inView={inView} motionOn={motionOn} />
        </div>

        <div className="absolute left-1/2 top-[42%] h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/25 to-transparent md:hidden" aria-hidden />

        <TransitDashboard
          inView={inView}
          motionOn={motionOn}
          tagline={t("marketing.hero.hubBaseline")}
        />
      </div>
    </div>
  );
}
