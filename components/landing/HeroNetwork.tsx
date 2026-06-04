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
  buildHubNodes,
  buildHubPaths,
  type HubModuleBase,
  type HubNode,
  type HubPath,
} from "@/lib/landing/landing-hub-modules";
import { useLandingHubModules } from "@/lib/landing/use-landing-hub-modules";

const CYCLE_MS = 3000;
const PARALLAX_SPRING = { stiffness: 100, damping: 26, mass: 0.45 };

const BG_PARTICLES = [
  { x: "8%", y: "18%", s: 2, d: 0 },
  { x: "22%", y: "72%", s: 1.5, d: 0.4 },
  { x: "78%", y: "28%", s: 2, d: 0.8 },
  { x: "92%", y: "65%", s: 1.5, d: 1.2 },
  { x: "45%", y: "8%", s: 1, d: 0.6 },
  { x: "55%", y: "92%", s: 1.5, d: 1 },
  { x: "15%", y: "45%", s: 1, d: 1.5 },
  { x: "85%", y: "48%", s: 1, d: 0.2 },
  { x: "35%", y: "85%", s: 2, d: 0.9 },
  { x: "68%", y: "12%", s: 1.5, d: 1.3 },
  { x: "5%", y: "88%", s: 1, d: 0.5 },
  { x: "95%", y: "38%", s: 1.5, d: 1.1 },
] as const;

export default function HeroNetwork() {
  const { t } = useI18n();
  const hubModules = useLandingHubModules();
  const nodes = useMemo(() => buildHubNodes(hubModules), [hubModules]);
  const paths = useMemo(() => buildHubPaths(nodes), [nodes]);
  const uid = useId().replace(/:/g, "");

  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.12 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [isFinePointer, setIsFinePointer] = useState(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, PARALLAX_SPRING);
  const smoothY = useSpring(pointerY, PARALLAX_SPRING);
  const layerX = useTransform(smoothX, (v) => v * 28);
  const layerY = useTransform(smoothY, (v) => v * 20);
  const centerX = useTransform(smoothX, (v) => v * 8);
  const centerY = useTransform(smoothY, (v) => v * 7);
  const centerRotate = useTransform(smoothX, (v) => v * 2.2);

  const activeId = hoveredId ?? nodes[cycleIndex]?.id ?? null;
  const parallaxOn = !reduceMotion && isFinePointer;
  const motionOn = !reduceMotion && inView;

  useEffect(() => {
    setIsFinePointer(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView || hoveredId) return;
    const id = window.setInterval(() => {
      setCycleIndex((i) => (i + 1) % nodes.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, inView, hoveredId, nodes.length]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!parallaxOn || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    pointerX.set((e.clientX - r.left) / r.width - 0.5);
    pointerY.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={containerRef}
      aria-label={t("marketing.hero.hubAriaLabel")}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative mx-auto h-[min(62vw,260px)] w-full max-w-[920px] touch-manipulation sm:h-[min(50vw,300px)] md:h-[320px] lg:h-[340px]"
    >
      {/* Particules de fond */}
      {motionOn ? (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          {BG_PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-blue-200/50 shadow-[0_0_6px_rgba(147,197,253,0.6)]"
              style={{
                left: p.x,
                top: p.y,
                width: p.s,
                height: p.s,
              }}
              animate={{
                opacity: [0.15, 0.55, 0.15],
                y: [0, -8, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3.5 + (i % 4) * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.d,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Halos profondeur */}
      <motion.div
        className="pointer-events-none absolute inset-[2%] rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.5),rgba(99,102,241,0.12)_45%,transparent_72%)] blur-3xl"
        style={{ x: parallaxOn ? layerX : 0, y: parallaxOn ? layerY : 0 }}
        aria-hidden
        animate={motionOn ? { opacity: [0.35, 0.8, 0.35], scale: [1, 1.06, 1] } : undefined}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[70%] w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.28),transparent_68%)] blur-2xl"
        aria-hidden
        animate={motionOn ? { opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.08, 0.95] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Connexions SVG */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <filter id={`glow-${uid}`}>
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={`energy-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="40%" stopColor="#93c5fd" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {paths.map((path) => (
          <AnimatedConnector
            key={path.id}
            path={path}
            uid={uid}
            inView={inView}
            motionOn={motionOn}
            reduceMotion={!!reduceMotion}
            isActive={activeId === path.id}
          />
        ))}
      </svg>

      {/* Hub central */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.75 }}
        transition={{ duration: 0.75, delay: 0.15, ease: easePremium }}
        style={{
          x: parallaxOn ? centerX : 0,
          y: parallaxOn ? centerY : 0,
          rotate: parallaxOn ? centerRotate : 0,
        }}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <CentralHub
          baseline={t("marketing.hero.hubBaseline")}
          modules={hubModules}
          activeId={activeId}
          motionOn={motionOn}
          reduceMotion={!!reduceMotion}
        />
      </motion.div>

      {/* Cartes modules */}
      {nodes.map((node, index) => (
        <ModuleOrb
          key={node.id}
          node={node}
          index={index}
          inView={inView}
          motionOn={motionOn}
          reduceMotion={!!reduceMotion}
          parallaxOn={parallaxOn}
          parallaxX={smoothX}
          parallaxY={smoothY}
          isActive={activeId === node.id}
          onActivate={() => setHoveredId(node.id)}
          onDeactivate={() => setHoveredId(null)}
        />
      ))}
    </div>
  );
}

function CentralHub({
  baseline,
  modules,
  activeId,
  motionOn,
  reduceMotion,
}: {
  baseline: string;
  modules: HubModuleBase[];
  activeId: string | null;
  motionOn: boolean;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative">
      {motionOn ? (
        <>
          <motion.div
            className="pointer-events-none absolute -inset-8 rounded-full border border-blue-400/20"
            animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -inset-5 rounded-full border border-indigo-300/15"
            animate={{ scale: [1.05, 1.18, 1.05], opacity: [0.2, 0.45, 0.2], rotate: [0, 180, 360] }}
            transition={{
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 24, repeat: Infinity, ease: "linear" },
            }}
            aria-hidden
          />
        </>
      ) : null}

      <motion.div
        animate={
          motionOn
            ? {
                scale: [1, 1.045, 1],
                boxShadow: [
                  "0 20px 64px rgba(26,35,255,0.4), 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 80px rgba(26,35,255,0.28), 0 0 120px rgba(99,102,241,0.15)",
                  "0 28px 88px rgba(26,35,255,0.58), 0 0 0 1px rgba(255,255,255,0.3) inset, 0 0 110px rgba(96,165,250,0.4), 0 0 160px rgba(139,92,246,0.2)",
                  "0 20px 64px rgba(26,35,255,0.4), 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 80px rgba(26,35,255,0.28), 0 0 120px rgba(99,102,241,0.15)",
                ],
              }
            : undefined
        }
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-[#243072]/95 via-[#151d48]/97 to-[#0a0f28]/98 px-5 py-4 text-center shadow-[0_24px_70px_rgba(26,35,255,0.35)] backdrop-blur-2xl sm:min-w-[230px] sm:px-6 sm:py-4.5"
      >
        {motionOn ? (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
            animate={{ x: ["-120%", "120%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
            aria-hidden
          />
        ) : null}

        <motion.div
          className="pointer-events-none absolute -inset-4 rounded-[1.25rem] bg-[radial-gradient(circle,rgba(26,35,255,0.45),transparent_65%)] blur-2xl"
          aria-hidden
          animate={motionOn ? { opacity: [0.45, 0.85, 0.45] } : undefined}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        <Image
          src="/logo-obillz.png"
          alt="Obillz"
          width={150}
          height={40}
          className="relative mx-auto h-auto w-[96px] brightness-110 sm:w-[108px]"
          priority
        />
        <p className="relative mt-2.5 text-[10px] font-medium leading-snug tracking-wide text-blue-100/80 sm:text-[11px]">
          {baseline}
        </p>
        <div className="relative mt-3 flex justify-center gap-2" aria-hidden>
          {modules.map((mod) => {
            const Icon = mod.icon;
            const lit = activeId === mod.id;
            return (
              <motion.span
                key={mod.id}
                animate={
                  lit && motionOn
                    ? { scale: [1, 1.15, 1], boxShadow: ["0 0 0 rgba(96,165,250,0)", "0 0 16px rgba(96,165,250,0.7)", "0 0 0 rgba(96,165,250,0)"] }
                    : { scale: 1 }
                }
                transition={{ duration: 1.2, repeat: lit ? Infinity : 0, ease: "easeInOut" }}
                className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 sm:h-8 sm:w-8 ${
                  lit
                    ? "bg-[#1A23FF]/50 text-white ring-blue-300/55"
                    : "bg-[#1A23FF]/22 text-blue-300/90 ring-white/12"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </motion.span>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function AnimatedConnector({
  path,
  uid,
  inView,
  motionOn,
  reduceMotion,
  isActive,
}: {
  path: HubPath;
  uid: string;
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
  isActive: boolean;
}) {
  const gradId = `line-${path.id}-${uid}`;
  const energyId = `en-${path.id}-${uid}`;

  return (
    <g>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={path.x1} y1={path.y1} x2={path.x2} y2={path.y2}>
          <stop offset="0%" stopColor="#1A23FF" stopOpacity={isActive ? 1 : 0.5} />
          <stop offset="50%" stopColor={isActive ? "#ffffff" : "#93c5fd"} stopOpacity="1" />
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity={isActive ? 0.95 : 0.55} />
        </linearGradient>
      </defs>

      {/* Tracé de base */}
      <motion.path
        d={path.d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={isActive ? 0.65 : 0.42}
        strokeLinecap="round"
        filter={`url(#glow-${uid})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: inView ? 1 : 0,
          opacity: inView ? (isActive ? 1 : motionOn ? [0.35, 0.92, 0.4] : 0.75) : 0,
        }}
        transition={{
          pathLength: { duration: 0.9, delay: path.delay, ease: easePremium },
          opacity: reduceMotion
            ? { duration: 0.4, delay: path.delay }
            : isActive
              ? { duration: 0.2 }
              : { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: path.pulseDelay },
        }}
      />

      {/* Impulsion lumineuse continue */}
      {motionOn ? (
        <motion.path
          d={path.d}
          fill="none"
          stroke={`url(#energy-${uid})`}
          strokeWidth={isActive ? 0.5 : 0.32}
          strokeLinecap="round"
          strokeDasharray={`${path.length * 0.14} ${path.length * 0.86}`}
          initial={{ strokeDashoffset: path.length }}
          animate={{ strokeDashoffset: [path.length, 0] }}
          transition={{
            duration: isActive ? 1.1 : 1.8 + path.pulseDelay * 0.15,
            repeat: Infinity,
            ease: "linear",
            delay: path.delay * 0.5,
          }}
          style={{ opacity: isActive ? 0.95 : 0.55 }}
        />
      ) : null}

      {/* Trait blanc rapide */}
      {motionOn ? (
        <motion.path
          d={path.d}
          fill="none"
          stroke="#ffffff"
          strokeWidth={0.24}
          strokeLinecap="round"
          strokeDasharray={`${path.length * 0.06} ${path.length * 0.94}`}
          animate={{ strokeDashoffset: [path.length, 0] }}
          transition={{
            duration: isActive ? 0.9 : 1.4,
            repeat: Infinity,
            ease: "linear",
            delay: path.pulseDelay * 0.3,
          }}
          style={{ opacity: isActive ? 0.85 : 0.35 }}
        />
      ) : null}

      {/* Particules sur le chemin */}
      {motionOn ? (
        <>
          <PathDot d={path.d} r={0.7} dur={isActive ? 1.8 : 2.6} delay={path.pulseDelay * 0.5} />
          <PathDot d={path.d} r={0.45} dur={isActive ? 2.4 : 3.4} delay={path.pulseDelay * 0.5 + 0.9} />
          <PathDot d={path.d} r={0.35} dur={isActive ? 3 : 4.2} delay={path.pulseDelay * 0.5 + 1.8} />
        </>
      ) : null}
    </g>
  );
}

function PathDot({ d, r, dur, delay }: { d: string; r: number; dur: number; delay: number }) {
  return (
    <circle r={r} fill="#e0f2fe" opacity={0.9}>
      <animateMotion
        dur={`${dur}s`}
        repeatCount="indefinite"
        path={d}
        begin={`${delay}s`}
      />
    </circle>
  );
}

function ModuleOrb({
  node,
  index,
  inView,
  motionOn,
  reduceMotion,
  parallaxOn,
  parallaxX,
  parallaxY,
  isActive,
  onActivate,
  onDeactivate,
}: {
  node: HubNode;
  index: number;
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
  parallaxOn: boolean;
  parallaxX: ReturnType<typeof useSpring>;
  parallaxY: ReturnType<typeof useSpring>;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const Icon = node.icon;
  const depth = 0.35 + (index % 3) * 0.18;
  const shiftX = useTransform(parallaxX, (v) => v * 20 * depth);
  const shiftY = useTransform(parallaxY, (v) => v * 14 * depth);

  const floatY = reduceMotion ? 0 : isActive ? -node.floatY * 0.7 : [-node.floatY * 0.35, node.floatY * 0.5, -node.floatY * 0.35];
  const floatX = reduceMotion ? 0 : isActive ? 0 : [-node.floatX * 0.4, node.floatX * 0.5, -node.floatX * 0.3];

  return (
    <motion.div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        x: parallaxOn ? shiftX : 0,
        y: parallaxOn ? shiftY : 0,
      }}
    >
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.5, filter: "blur(6px)" }}
        animate={{
          opacity: inView ? 1 : 0,
          scale: inView ? 1 : 0.5,
          filter: inView ? "blur(0px)" : "blur(6px)",
          y: floatY,
          x: floatX,
        }}
        whileHover={
          reduceMotion
            ? undefined
            : { scale: 1.06, y: -node.floatY * 0.85, transition: { duration: 0.25 } }
        }
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={{
          opacity: { duration: 0.55, delay: node.delay, ease: easePremium },
          scale: { duration: 0.55, delay: node.delay, ease: easePremium },
          filter: { duration: 0.55, delay: node.delay, ease: easePremium },
          y: reduceMotion
            ? { duration: 0.2 }
            : { duration: node.floatDuration, repeat: Infinity, ease: "easeInOut", delay: node.floatDelay },
          x: reduceMotion
            ? { duration: 0.2 }
            : { duration: node.floatDuration * 1.15, repeat: Infinity, ease: "easeInOut", delay: node.floatDelay + 0.2 },
        }}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onTouchStart={onActivate}
        onTouchEnd={onDeactivate}
        className="relative cursor-pointer touch-manipulation outline-none"
        aria-label={`${node.label} — ${node.hint}`}
      >
        {isActive && motionOn ? (
          <motion.span
            className="pointer-events-none absolute -inset-4 -z-10 rounded-2xl bg-[radial-gradient(circle,rgba(26,35,255,0.5),transparent_70%)] blur-xl"
            animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : null}

        <motion.div
          animate={
            isActive && motionOn
              ? {
                  boxShadow: [
                    "0 14px 40px rgba(26,35,255,0.5), 0 0 36px rgba(96,165,250,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
                    "0 20px 52px rgba(26,35,255,0.65), 0 0 48px rgba(147,197,253,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                    "0 14px 40px rgba(26,35,255,0.5), 0 0 36px rgba(96,165,250,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
                  ],
                }
              : undefined
          }
          transition={{ duration: 1.3, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
          className={`w-[min(40vw,152px)] rounded-xl border px-3 py-2.5 text-left backdrop-blur-xl sm:w-[158px] sm:px-3.5 sm:py-3 ${
            isActive
              ? "border-blue-300/55 bg-[#161f48]/96"
              : "border-white/16 bg-[#0b1026]/88 shadow-[0_12px_32px_rgba(0,0,0,0.45),0_0_22px_rgba(26,35,255,0.14)]"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <motion.span
              animate={isActive && motionOn ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 1.1, repeat: isActive ? Infinity : 0 }}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-8 sm:w-8 ${
                isActive
                  ? "bg-[#1A23FF]/45 text-white ring-blue-300/55 shadow-[0_0_14px_rgba(96,165,250,0.5)]"
                  : "bg-[#1A23FF]/22 text-blue-300 ring-[#1A23FF]/32"
              }`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden />
            </motion.span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold leading-tight text-white sm:text-xs">
                {node.label}
              </span>
              <span
                className={`mt-0.5 block text-[9px] leading-snug sm:text-[10px] ${
                  isActive ? "text-blue-50/90" : "text-blue-200/50"
                }`}
              >
                {node.hint}
              </span>
            </span>
          </div>
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
