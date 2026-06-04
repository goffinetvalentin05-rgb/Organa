"use client";

import Image from "next/image";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";
import {
  buildConvergencePaths,
  HERO_FRAGMENTS,
  type ConvergencePath,
  type HeroFragment,
} from "@/lib/landing/hero-convergence";

const PARALLAX = { stiffness: 100, damping: 26, mass: 0.45 };

const BG_SPARKS = [
  { x: "18%", y: "30%", d: 0 },
  { x: "82%", y: "35%", d: 0.5 },
  { x: "30%", y: "88%", d: 1 },
  { x: "72%", y: "12%", d: 0.8 },
  { x: "50%", y: "6%", d: 0.3 },
] as const;

export default function HeroConvergence() {
  const { t } = useI18n();
  const paths = useMemo(() => buildConvergencePaths(HERO_FRAGMENTS), []);
  const uid = useId().replace(/:/g, "");

  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const [finePointer, setFinePointer] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, PARALLAX);
  const sy = useSpring(py, PARALLAX);
  const layerX = useTransform(sx, (v) => v * 24);
  const layerY = useTransform(sy, (v) => v * 18);
  const hubX = useTransform(sx, (v) => v * 7);
  const hubY = useTransform(sy, (v) => v * 6);

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
      className="relative mx-auto h-[min(64vw,270px)] w-full max-w-[880px] sm:h-[min(52vw,310px)] md:h-[330px]"
    >
      {motionOn ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          {BG_SPARKS.map((s, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-blue-200/60 shadow-[0_0_8px_rgba(147,197,253,0.8)]"
              style={{ left: s.x, top: s.y }}
              animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.5, 1], y: [0, -6, 0] }}
              transition={{ duration: 3.2 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: s.d }}
            />
          ))}
        </div>
      ) : null}

      <motion.div
        className="pointer-events-none absolute inset-[0%] rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.45),rgba(139,92,246,0.08)_50%,transparent_75%)] blur-3xl"
        style={{ x: parallaxOn ? layerX : 0, y: parallaxOn ? layerY : 0 }}
        aria-hidden
        animate={motionOn ? { opacity: [0.35, 0.75, 0.35], scale: [1, 1.05, 1] } : undefined}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <filter id={`cv-glow-${uid}`}>
            <feGaussianBlur stdDeviation="1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`cv-flow-${uid}`} x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="45%" stopColor="#93c5fd" />
            <stop offset="55%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {paths.map((path) => (
          <FlowPath
            key={path.id}
            path={path}
            uid={uid}
            inView={inView}
            motionOn={motionOn}
            reduceMotion={!!reduceMotion}
            isHovered={hoveredId === path.id}
          />
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.8, delay: 0.2, ease: easePremium }}
        style={{ x: parallaxOn ? hubX : 0, y: parallaxOn ? hubY : 0 }}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <CentralObillz
          baseline={t("marketing.hero.hubBaseline")}
          tagline={t("marketing.hero.convergenceTagline")}
          motionOn={motionOn}
        />
      </motion.div>

      {HERO_FRAGMENTS.map((fragment) => (
        <DispersedFragment
          key={fragment.id}
          fragment={fragment}
          inView={inView}
          motionOn={motionOn}
          reduceMotion={!!reduceMotion}
          parallaxOn={parallaxOn}
          parallaxX={sx}
          parallaxY={sy}
          isHovered={hoveredId === fragment.id}
          onHover={() => setHoveredId(fragment.id)}
          onLeave={() => setHoveredId(null)}
        />
      ))}
    </div>
  );
}

function CentralObillz({
  baseline,
  tagline,
  motionOn,
}: {
  baseline: string;
  tagline: string;
  motionOn: boolean;
}) {
  return (
    <div className="relative">
      {motionOn ? (
        <>
          <motion.div
            className="pointer-events-none absolute -inset-10 rounded-full border border-blue-400/15"
            animate={{ scale: [1, 1.14, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -inset-6 rounded-full border border-violet-300/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
        </>
      ) : null}

      <motion.div
        animate={
          motionOn
            ? {
                scale: [1, 1.04, 1],
                boxShadow: [
                  "0 22px 70px rgba(26,35,255,0.42), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 0 90px rgba(26,35,255,0.3), 0 0 140px rgba(99,102,241,0.18)",
                  "0 30px 90px rgba(26,35,255,0.58), 0 0 0 1px rgba(255,255,255,0.32) inset, 0 0 120px rgba(96,165,250,0.38), 0 0 180px rgba(139,92,246,0.22)",
                  "0 22px 70px rgba(26,35,255,0.42), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 0 90px rgba(26,35,255,0.3), 0 0 140px rgba(99,102,241,0.18)",
                ],
              }
            : undefined
        }
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-white/28 bg-gradient-to-br from-[#273580]/96 via-[#151d4a]/98 to-[#090e24]/99 px-6 py-5 text-center shadow-[0_28px_80px_rgba(26,35,255,0.38)] backdrop-blur-2xl sm:min-w-[248px]"
      >
        {motionOn ? (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
            animate={{ x: ["-130%", "130%"] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
            aria-hidden
          />
        ) : null}
        <motion.div
          className="pointer-events-none absolute -inset-5 rounded-[1.2rem] bg-[radial-gradient(circle,rgba(26,35,255,0.5),transparent_68%)] blur-2xl"
          animate={motionOn ? { opacity: [0.5, 0.9, 0.5] } : undefined}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <Image
          src="/logo-obillz.png"
          alt="Obillz"
          width={160}
          height={42}
          className="relative mx-auto h-auto w-[100px] brightness-110 sm:w-[112px]"
          priority
        />
        <p className="relative mt-2.5 text-[11px] font-semibold leading-snug text-white/95 sm:text-xs">
          {baseline}
        </p>
        <p className="relative mt-1 text-[9px] font-medium tracking-wide text-blue-200/55 sm:text-[10px]">
          {tagline}
        </p>
      </motion.div>
    </div>
  );
}

function FlowPath({
  path,
  uid,
  inView,
  motionOn,
  reduceMotion,
  isHovered,
}: {
  path: ConvergencePath;
  uid: string;
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
  isHovered: boolean;
}) {
  const gradId = `cv-${path.id}-${uid}`;

  return (
    <g>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={path.x1} y1={path.y1} x2={path.x2} y2={path.y2}>
          <stop offset="0%" stopColor="#1A23FF" stopOpacity={isHovered ? 1 : 0.65} />
          <stop offset="55%" stopColor="#93c5fd" stopOpacity="1" />
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity={isHovered ? 0.9 : 0.4} />
        </linearGradient>
      </defs>
      <motion.path
        d={path.d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={isHovered ? 0.55 : 0.36}
        strokeLinecap="round"
        filter={`url(#cv-glow-${uid})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: inView ? 1 : 0,
          opacity: inView ? (isHovered ? 1 : motionOn ? [0.25, 0.85, 0.3] : 0.7) : 0,
        }}
        transition={{
          pathLength: { duration: 1, delay: path.delay, ease: easePremium },
          opacity: reduceMotion
            ? { duration: 0.4, delay: path.delay }
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: path.delay },
        }}
      />
      {motionOn ? (
        <>
          <motion.path
            d={path.d}
            fill="none"
            stroke={`url(#cv-flow-${uid})`}
            strokeWidth={0.28}
            strokeLinecap="round"
            strokeDasharray={`${path.length * 0.12} ${path.length * 0.88}`}
            animate={{ strokeDashoffset: [path.length, 0] }}
            transition={{
              duration: isHovered ? 1 : 1.6,
              repeat: Infinity,
              ease: "linear",
              delay: path.delay * 0.4,
            }}
            style={{ opacity: isHovered ? 0.9 : 0.5 }}
          />
          <circle r="0.55" fill="#e0f2fe" opacity={0.85}>
            <animateMotion dur={`${isHovered ? 1.6 : 2.4}s`} repeatCount="indefinite" path={path.d} begin={`${path.delay}s`} />
          </circle>
        </>
      ) : null}
    </g>
  );
}

function DispersedFragment({
  fragment,
  inView,
  motionOn,
  reduceMotion,
  parallaxOn,
  parallaxX,
  parallaxY,
  isHovered,
  onHover,
  onLeave,
}: {
  fragment: HeroFragment;
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
  parallaxOn: boolean;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const depth = 0.4 + (fragment.delay % 3) * 0.15;
  const shiftX = useTransform(parallaxX, (v) => v * 18 * depth);
  const shiftY = useTransform(parallaxY, (v) => v * 14 * depth);

  const driftUnit = reduceMotion ? 0 : 1;
  const animX = [
    0,
    fragment.driftX * driftUnit * 0.55,
    fragment.driftX * driftUnit,
    fragment.driftX * driftUnit * 0.55,
    0,
  ];
  const animY = [
    0,
    fragment.driftY * driftUnit * 0.55,
    fragment.driftY * driftUnit,
    fragment.driftY * driftUnit * 0.55,
    0,
  ];

  return (
    <motion.div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${fragment.x}%`,
        top: `${fragment.y}%`,
        x: parallaxOn ? shiftX : 0,
        y: parallaxOn ? shiftY : 0,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.65, filter: "blur(8px)" }}
        animate={{
          opacity: inView ? (isHovered ? 1 : 0.88) : 0,
          scale: inView ? (isHovered ? 1.06 : 1) : 0.65,
          filter: inView ? "blur(0px)" : "blur(8px)",
          x: motionOn ? animX : 0,
          y: motionOn ? animY : 0,
          rotate: motionOn
            ? [fragment.rotate, fragment.rotate + 2, fragment.rotate, fragment.rotate - 2, fragment.rotate]
            : fragment.rotate,
        }}
        transition={{
          opacity: { duration: 0.5, delay: fragment.delay, ease: easePremium },
          scale: { duration: 0.5, delay: fragment.delay, ease: easePremium },
          filter: { duration: 0.5, delay: fragment.delay },
          x: motionOn
            ? { duration: fragment.duration, repeat: Infinity, ease: "easeInOut", delay: fragment.delay }
            : { duration: 0.2 },
          y: motionOn
            ? { duration: fragment.duration, repeat: Infinity, ease: "easeInOut", delay: fragment.delay }
            : { duration: 0.2 },
          rotate: motionOn
            ? { duration: fragment.duration * 1.3, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 },
        }}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="cursor-default"
      >
        <motion.div
          animate={motionOn ? { y: [0, -fragment.floatY, 0, fragment.floatX * 0.3, 0] } : undefined}
          transition={{
            duration: fragment.duration * 0.85,
            repeat: Infinity,
            ease: "easeInOut",
            delay: fragment.delay + 0.15,
          }}
          whileHover={reduceMotion ? undefined : { y: -4 }}
        >
          <WorkFragment chip={fragment} isHovered={isHovered} motionOn={motionOn} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function WorkFragment({
  chip,
  isHovered,
  motionOn,
}: {
  chip: HeroFragment;
  isHovered: boolean;
  motionOn: boolean;
}) {
  const Icon = chip.icon;

  return (
    <motion.div
      animate={
        isHovered && motionOn
          ? {
              boxShadow: [
                "0 12px 32px rgba(0,0,0,0.35), 0 0 28px rgba(96,165,250,0.35)",
                "0 16px 40px rgba(0,0,0,0.4), 0 0 36px rgba(147,197,253,0.45)",
                "0 12px 32px rgba(0,0,0,0.35), 0 0 28px rgba(96,165,250,0.35)",
              ],
            }
          : undefined
      }
      transition={{ duration: 1.2, repeat: isHovered ? Infinity : 0 }}
      className={`rounded-xl border px-2.5 py-2 backdrop-blur-xl transition-colors ${
        isHovered
          ? "border-blue-300/40 bg-[#121a3e]/92"
          : "border-white/14 bg-[#0a1028]/85 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      }`}
    >
      <FragmentBody id={chip.id} Icon={Icon} />
    </motion.div>
  );
}

function FragmentBody({ id, Icon }: { id: HeroFragment["id"]; Icon: LucideIcon }) {
  switch (id) {
    case "invoice":
      return (
        <div className="flex items-center gap-2">
          <IconChip Icon={Icon} tone="amber" />
          <div className="space-y-1">
            <div className="h-1 w-10 rounded-full bg-white/25" />
            <div className="h-1 w-7 rounded-full bg-white/12" />
            <div className="h-1 w-8 rounded-full bg-amber-400/30" />
          </div>
        </div>
      );
    case "members":
      return (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <span className="h-4 w-4 rounded-full bg-blue-400/40 ring-1 ring-white/20" />
            <span className="h-4 w-4 rounded-full bg-indigo-400/35 ring-1 ring-white/20" />
            <span className="h-4 w-4 rounded-full bg-violet-400/30 ring-1 ring-white/20" />
          </div>
          <IconChip Icon={Icon} tone="blue" small />
        </div>
      );
    case "payment":
      return (
        <div className="flex items-center gap-2">
          <IconChip Icon={Icon} tone="emerald" />
          <span className="rounded-md bg-emerald-400/20 px-1.5 py-0.5 text-[8px] font-bold text-emerald-200/90">
            CHF
          </span>
        </div>
      );
    case "calendar":
      return (
        <div className="flex items-center gap-2">
          <IconChip Icon={Icon} tone="sky" />
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-sm ${i === 2 ? "bg-sky-400/50" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>
      );
    case "registration":
      return (
        <div className="flex items-center gap-2">
          <IconChip Icon={Icon} tone="violet" />
          <div className="space-y-1">
            <div className="flex gap-0.5">
              <div className="h-1 w-3 rounded-sm bg-violet-400/40" />
              <div className="h-1 w-6 rounded-sm bg-white/15" />
            </div>
            <div className="h-1 w-9 rounded-sm bg-white/10" />
          </div>
        </div>
      );
    case "list":
      return (
        <div className="relative space-y-1 pr-1">
          {[0.7, 0.5, 0.85].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className={`h-1 w-1 rounded-full ${i === 0 ? "bg-green-400/60" : "bg-white/20"}`} />
              <div className="h-1 rounded-full bg-white/15" style={{ width: `${w}rem` }} />
            </div>
          ))}
          <Icon className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-blue-300/50" aria-hidden />
        </div>
      );
    case "document":
      return (
        <div className="flex items-center gap-2">
          <IconChip Icon={Icon} tone="slate" />
          <div className="h-8 w-6 rounded-sm border border-white/15 bg-white/5" />
        </div>
      );
    case "planning":
      return (
        <div className="flex items-center gap-2">
          <IconChip Icon={Icon} tone="indigo" />
          <div className="space-y-0.5">
            <div className="h-1 w-8 rounded-full bg-indigo-400/35" />
            <div className="h-1 w-5 rounded-full bg-white/12" />
          </div>
        </div>
      );
    default:
      return <IconChip Icon={Icon} tone="blue" />;
  }
}

function IconChip({
  Icon,
  tone,
  small,
}: {
  Icon: LucideIcon;
  tone: "amber" | "blue" | "emerald" | "sky" | "violet" | "slate" | "indigo";
  small?: boolean;
}) {
  const tones = {
    amber: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
    blue: "bg-[#1A23FF]/25 text-blue-300 ring-[#1A23FF]/35",
    emerald: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/30",
    sky: "bg-sky-500/20 text-sky-200 ring-sky-400/30",
    violet: "bg-violet-500/20 text-violet-200 ring-violet-400/30",
    slate: "bg-slate-500/20 text-slate-200 ring-slate-400/25",
    indigo: "bg-indigo-500/20 text-indigo-200 ring-indigo-400/30",
  };

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-lg ring-1 ${tones[tone]} ${small ? "h-5 w-5" : "h-7 w-7"}`}
    >
      <Icon className={small ? "h-2.5 w-2.5" : "h-3.5 w-3.5"} strokeWidth={2} aria-hidden />
    </span>
  );
}
