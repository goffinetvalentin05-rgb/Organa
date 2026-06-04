"use client";

import Image from "next/image";
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
import { easePremium } from "@/components/landing/landing-motion";
import {
  buildFluxStreamPaths,
  FLUX_ITEMS,
  mainFluxPath,
  type FluxItem,
  type FluxStreamPath,
} from "@/lib/landing/hero-flux";

const PARALLAX = { stiffness: 85, damping: 28, mass: 0.5 };

export default function HeroFlowVisual() {
  const { t } = useI18n();
  const streamPaths = useMemo(() => buildFluxStreamPaths(), []);
  const mainPath = useMemo(() => mainFluxPath(), []);
  const uid = useId().replace(/:/g, "");

  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.06 });
  const [finePointer, setFinePointer] = useState(false);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, PARALLAX);
  const sy = useSpring(py, PARALLAX);
  const sceneX = useTransform(sx, (v) => v * 12);
  const sceneY = useTransform(sy, (v) => v * 8);
  const hubX = useTransform(sx, (v) => v * -5);
  const hubY = useTransform(sy, (v) => v * -4);

  const motionOn = !reduceMotion && inView;
  const parallaxOn = motionOn && finePointer;

  useEffect(() => {
    setFinePointer(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  return (
    <div
      ref={ref}
      aria-label={t("marketing.hero.convergenceAriaLabel")}
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
      className="relative h-full min-h-[300px] w-full sm:min-h-[340px] md:min-h-[380px] lg:min-h-[400px]"
    >
      <motion.div
        style={{ x: parallaxOn ? sceneX : 0, y: parallaxOn ? sceneY : 0 }}
        className="absolute inset-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-r from-[#0a1028]/60 via-[#0d1438]/30 to-[#121a42]/50 shadow-[0_48px_120px_rgba(26,35,255,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] sm:rounded-[1.35rem]"
      >
        {/* Glow de fond — flux horizontal */}
        <motion.div
          className="pointer-events-none absolute inset-y-[18%] left-[5%] right-[22%] rounded-full bg-[radial-gradient(ellipse_at_30%_50%,rgba(26,35,255,0.5),rgba(99,102,241,0.15)_50%,transparent_75%)] blur-3xl"
          animate={motionOn ? { opacity: [0.4, 0.85, 0.4], scale: [1, 1.03, 1] } : undefined}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute right-[6%] top-1/2 h-[70%] w-[38%] -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.45),transparent_70%)] blur-3xl"
          style={{ x: parallaxOn ? hubX : 0, y: parallaxOn ? hubY : 0 }}
          animate={motionOn ? { opacity: [0.45, 0.9, 0.45] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />

        {/* SVG — trajectoires gauche → droite */}
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <filter id={`flux-glow-${uid}`}>
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`flux-main-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1A23FF" stopOpacity="0.2" />
              <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1A23FF" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          <motion.path
            d={mainPath.d}
            fill="none"
            stroke={`url(#flux-main-${uid})`}
            strokeWidth="0.9"
            strokeLinecap="round"
            filter={`url(#flux-glow-${uid})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: inView ? 1 : 0,
              opacity: inView ? (motionOn ? [0.35, 0.9, 0.35] : 0.7) : 0,
            }}
            transition={{
              pathLength: { duration: 1.2, ease: easePremium },
              opacity: motionOn ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 },
            }}
          />
          {motionOn ? (
            <motion.path
              d={mainPath.d}
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.35"
              strokeLinecap="round"
              strokeDasharray="3 12"
              animate={{ strokeDashoffset: [0, -30] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              style={{ opacity: 0.5 }}
            />
          ) : null}

          {streamPaths.map((path) => (
            <ItemStream key={path.id} path={path} uid={uid} inView={inView} motionOn={motionOn} reduceMotion={!!reduceMotion} />
          ))}
        </svg>

        {/* Éléments en transit gauche → hub */}
        {FLUX_ITEMS.map((item) => (
          <FluxTraveler
            key={item.id}
            item={item}
            inView={inView}
            motionOn={motionOn}
            reduceMotion={!!reduceMotion}
            parallaxOn={parallaxOn}
            parallaxX={sx}
            parallaxY={sy}
          />
        ))}

        {/* Hub Obillz — destination du flux */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
          transition={{ duration: 0.9, delay: 0.5, ease: easePremium }}
          style={{ x: parallaxOn ? hubX : 0, y: parallaxOn ? hubY : 0 }}
          className="absolute right-[4%] top-1/2 z-20 w-[min(42vw,300px)] -translate-y-1/2 sm:right-[5%] sm:w-[300px] md:w-[320px]"
        >
          <ObillzHub baseline={t("marketing.hero.hubBaseline")} motionOn={motionOn} />
        </motion.div>

        {/* Label narratif discret */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="pointer-events-none absolute bottom-3 left-4 text-[9px] font-medium uppercase tracking-[0.2em] text-blue-200/35 sm:left-6 sm:text-[10px]"
        >
          {t("marketing.hero.fluxLabel")}
        </motion.p>
      </motion.div>
    </div>
  );
}

function ItemStream({
  path,
  uid,
  inView,
  motionOn,
  reduceMotion,
}: {
  path: FluxStreamPath;
  uid: string;
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
}) {
  const grad = `item-stream-${path.id}-${uid}`;

  return (
    <g>
      <defs>
        <linearGradient id={grad} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <motion.path
        d={path.d}
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="0.35"
        strokeLinecap="round"
        filter={`url(#flux-glow-${uid})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: inView ? 1 : 0,
          opacity: inView ? (motionOn ? [0.1, 0.65, 0.1] : 0.45) : 0,
        }}
        transition={{
          pathLength: { duration: 0.8, delay: path.delay, ease: easePremium },
          opacity: reduceMotion
            ? { duration: 0.4, delay: path.delay }
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: path.delay },
        }}
      />
      {motionOn ? (
        <circle r="0.45" fill="#e0f2fe" opacity="0.8">
          <animateMotion dur="2.2s" repeatCount="indefinite" path={path.d} begin={`${path.delay}s`} />
        </circle>
      ) : null}
    </g>
  );
}

function FluxTraveler({
  item,
  inView,
  motionOn,
  reduceMotion,
  parallaxOn,
  parallaxX,
  parallaxY,
}: {
  item: FluxItem;
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
  parallaxOn: boolean;
  parallaxX: ReturnType<typeof useSpring>;
  parallaxY: ReturnType<typeof useSpring>;
}) {
  const depth = 0.25 + (item.delay % 4) * 0.12;
  const shiftX = useTransform(parallaxX, (v) => v * 10 * depth);
  const shiftY = useTransform(parallaxY, (v) => v * 8 * depth);

  const travelX = [`${item.startX - 12}%`, `${item.startX}%`, `${item.endX}%`, `${item.endX + 4}%`, `${item.startX - 12}%`];
  const travelY = [`${item.startY}%`, `${item.startY}%`, `${item.endY}%`, `${item.endY}%`, `${item.startY}%`];

  const staticLeft = reduceMotion ? `${(item.startX + item.endX) / 2}%` : undefined;

  return (
    <motion.div
      className="absolute z-10"
      style={{
        left: staticLeft ?? `${item.startX}%`,
        top: `${item.startY}%`,
        transform: "translate(-50%, -50%)",
        x: parallaxOn ? shiftX : 0,
        y: parallaxOn ? shiftY : 0,
      }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={
        inView
          ? {
              opacity: motionOn ? [0, 1, 1, 0, 0] : 0.9,
              scale: motionOn ? [0.75, 1, 0.92, 0.6, 0.75] : 1,
              ...(motionOn ? { left: travelX, top: travelY } : {}),
            }
          : { opacity: 0 }
      }
      transition={{
        duration: item.duration,
        repeat: motionOn ? Infinity : 0,
        delay: item.delay,
        ease: easePremium,
        times: motionOn ? [0, 0.12, 0.72, 0.9, 1] : undefined,
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.06 }}
    >
      <FluxChip item={item} />
    </motion.div>
  );
}

function FluxChip({ item }: { item: FluxItem }) {
  const Icon = item.icon;
  const tones: Record<FluxItem["tone"], string> = {
    green: "bg-emerald-500/22 text-emerald-200 ring-emerald-400/35",
    blue: "bg-[#1A23FF]/25 text-blue-300 ring-[#1A23FF]/35",
    amber: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
    emerald: "bg-emerald-500/18 text-emerald-200 ring-emerald-400/28",
    sky: "bg-sky-500/18 text-sky-200 ring-sky-400/28",
    slate: "bg-slate-500/18 text-slate-200 ring-slate-400/25",
    violet: "bg-violet-500/18 text-violet-200 ring-violet-400/28",
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/14 bg-[#0a1028]/90 px-2.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_16px_rgba(26,35,255,0.1)] backdrop-blur-xl">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${tones[item.tone]}`}>
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <ChipSkeleton id={item.id} />
    </div>
  );
}

function ChipSkeleton({ id }: { id: FluxItem["id"] }) {
  if (id === "member") {
    return (
      <div className="flex -space-x-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-3.5 w-3.5 rounded-full bg-blue-400/35 ring-1 ring-white/10" />
        ))}
      </div>
    );
  }
  if (id === "whatsapp") {
    return (
      <div className="space-y-1" aria-hidden>
        <div className="h-1 w-9 rounded-full bg-emerald-400/40" />
        <div className="h-1 w-5 rounded-full bg-white/12" />
      </div>
    );
  }
  return (
    <div className="space-y-1" aria-hidden>
      <div className="h-1 w-8 rounded-full bg-white/18" />
      <div className="h-1 w-5 rounded-full bg-white/10" />
    </div>
  );
}

function ObillzHub({ baseline, motionOn }: { baseline: string; motionOn: boolean }) {
  return (
    <div className="relative">
      {motionOn ? (
        <>
          <motion.div
            className="pointer-events-none absolute -inset-8 rounded-3xl border border-blue-400/20"
            animate={{ opacity: [0.2, 0.55, 0.2], scale: [1, 1.06, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -inset-4 rounded-2xl bg-[radial-gradient(circle,rgba(26,35,255,0.55),transparent_68%)] blur-2xl"
            animate={{ opacity: [0.5, 0.95, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </>
      ) : null}

      <motion.div
        animate={
          motionOn
            ? {
                boxShadow: [
                  "0 28px 90px rgba(26,35,255,0.5), 0 0 0 1px rgba(255,255,255,0.22) inset, 0 0 110px rgba(26,35,255,0.3)",
                  "0 36px 110px rgba(26,35,255,0.65), 0 0 0 1px rgba(255,255,255,0.32) inset, 0 0 140px rgba(139,92,246,0.35)",
                  "0 28px 90px rgba(26,35,255,0.5), 0 0 0 1px rgba(255,255,255,0.22) inset, 0 0 110px rgba(26,35,255,0.3)",
                ],
              }
            : undefined
        }
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-white/28 bg-gradient-to-br from-[#1c2860]/98 via-[#131b48]/99 to-[#0a0f28]/99 p-4 backdrop-blur-2xl sm:p-5"
      >
        {motionOn ? (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
            animate={{ x: ["-120%", "120%"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
            aria-hidden
          />
        ) : null}

        <div className="relative mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <Image src="/obillz-logo.png" alt="Obillz" width={130} height={34} className="h-8 w-auto brightness-110" priority />
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-emerald-400/80"
                animate={motionOn ? { opacity: [0.35, 1, 0.35] } : undefined}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </span>
        </div>

        <div className="relative space-y-2" aria-hidden>
          <div className="flex gap-2">
            <div className="h-2.5 flex-1 rounded-full bg-[#1A23FF]/45" />
            <div className="h-2.5 w-1/4 rounded-full bg-white/15" />
          </div>
          <div className="flex gap-2">
            <div className="h-2.5 w-1/3 rounded-full bg-white/12" />
            <div className="h-2.5 flex-1 rounded-full bg-indigo-400/30" />
          </div>
          <div className="h-2.5 w-4/5 rounded-full bg-white/10" />
        </div>

        <p className="relative mt-3 text-center text-[10px] font-medium text-blue-100/75 sm:text-[11px]">{baseline}</p>
      </motion.div>
    </div>
  );
}
