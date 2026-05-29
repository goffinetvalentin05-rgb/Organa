"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Globe,
  Megaphone,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";

const CENTER = 50;
const RADIUS = 36;
const HUB_EDGE = 14;
const NODE_INSET = 5;
const CYCLE_MS = 2600;

const hubModules: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "membres", label: "Membres", icon: Users },
  { id: "cotisations", label: "Cotisations", icon: Wallet },
  { id: "factures", label: "Factures", icon: Receipt },
  { id: "paiements", label: "Paiements", icon: CreditCard },
  { id: "evenements", label: "Événements", icon: CalendarDays },
  { id: "campagnes", label: "Campagnes", icon: Megaphone },
  { id: "page-publique", label: "Page publique", icon: Globe },
];

const nodes = hubModules.map((mod, i) => {
  const angle = (i / hubModules.length) * 2 * Math.PI - Math.PI / 2;
  return {
    ...mod,
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
    delay: 0.12 + i * 0.09,
    floatDuration: 3.8 + (i % 4) * 0.55,
    floatDelay: i * 0.35,
  };
});

function lineEndpoints(x: number, y: number) {
  const dx = x - CENTER;
  const dy = y - CENTER;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x1: CENTER + ux * HUB_EDGE,
    y1: CENTER + uy * HUB_EDGE,
    x2: x - ux * NODE_INSET,
    y2: y - uy * NODE_INSET,
  };
}

const lines = nodes.map((node, i) => {
  const endpoints = lineEndpoints(node.x, node.y);
  const length = Math.hypot(endpoints.x2 - endpoints.x1, endpoints.y2 - endpoints.y1);
  return {
    id: node.id,
    ...endpoints,
    length,
    delay: 0.08 + i * 0.07,
    pulseDelay: i * 0.45,
  };
});

const membresLine = lines.find((l) => l.id === "membres")!;

export default function HeroHubVisual() {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.28 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);

  const activeId = hoveredId ?? nodes[cycleIndex]?.id ?? null;

  useEffect(() => {
    if (reduceMotion || !inView || hoveredId) return;
    const id = window.setInterval(() => {
      setCycleIndex((i) => (i + 1) % nodes.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, inView, hoveredId]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-[min(100%,580px)] sm:max-w-[640px] md:max-w-[720px] lg:max-w-[820px]"
    >
      {/* Halo rotatif */}
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-[4%] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.42),transparent_68%)] blur-2xl"
          aria-hidden
          animate={{ rotate: 360, scale: [1, 1.06, 1], opacity: [0.55, 0.85, 0.55] }}
          transition={{
            rotate: { duration: 48, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.38),transparent_70%)] blur-2xl"
          aria-hidden
        />
      )}

      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
        aria-hidden
      >
        {!reduceMotion ? (
          <>
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r="22"
              fill="none"
              stroke="rgba(147,197,253,0.2)"
              strokeWidth="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                inView
                  ? {
                      pathLength: 1,
                      opacity: [0.25, 0.7, 0.25],
                      scale: [1, 1.05, 1],
                    }
                  : { pathLength: 0, opacity: 0 }
              }
              transition={{
                pathLength: { duration: 1.1, ease: easePremium },
                opacity: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
                scale: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
              }}
              style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            />
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r="28"
              fill="none"
              stroke="rgba(96,165,250,0.14)"
              strokeWidth="0.25"
              animate={
                inView
                  ? { scale: [1, 1.08, 1], opacity: [0.3, 0.75, 0.3] }
                  : { scale: 1, opacity: 0 }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            />
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r="34"
              fill="none"
              stroke="rgba(96,165,250,0.1)"
              strokeWidth="0.2"
              animate={
                inView
                  ? { scale: [1, 1.05, 1], opacity: [0.2, 0.55, 0.2] }
                  : { scale: 1, opacity: 0 }
              }
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.9,
              }}
              style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            />
          </>
        ) : null}
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.72 }}
        animate={
          inView
            ? {
                opacity: 1,
                scale: reduceMotion ? 1 : [1, 1.04, 1],
              }
            : { opacity: 0, scale: 0.72 }
        }
        transition={{
          opacity: { duration: 0.65, ease: easePremium },
          scale: reduceMotion
            ? { duration: 0.7, ease: easePremium }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
        }}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    "0 8px 40px rgba(26,35,255,0.3), 0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 60px rgba(26,35,255,0.2)",
                    "0 16px 64px rgba(26,35,255,0.55), 0 0 0 1px rgba(255,255,255,0.28) inset, 0 0 90px rgba(96,165,250,0.35)",
                    "0 8px 40px rgba(26,35,255,0.3), 0 0 0 1px rgba(255,255,255,0.15) inset, 0 0 60px rgba(26,35,255,0.2)",
                  ],
                }
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-[108px] w-[108px] items-center justify-center rounded-3xl border border-white/25 bg-white/[0.12] p-4 shadow-[0_8px_40px_rgba(26,35,255,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl sm:h-[124px] sm:w-[124px] md:h-[140px] md:w-[140px] md:rounded-[1.35rem]"
        >
          <Image
            src="/logo-obillz.png"
            alt="Obillz"
            width={120}
            height={32}
            className="h-auto w-[88px] brightness-110 sm:w-[100px] md:w-[112px]"
            priority
          />
        </motion.div>
      </motion.div>

      {nodes.map((node) => (
        <HubNodeCard
          key={node.id}
          node={node}
          inView={inView}
          reduceMotion={!!reduceMotion}
          isActive={activeId === node.id}
          onActivate={() => setHoveredId(node.id)}
          onDeactivate={() => setHoveredId(null)}
        />
      ))}

      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-[22] h-full w-full"
        aria-hidden
      >
        <defs>
          <filter id="hub-line-glow">
            <feGaussianBlur stdDeviation="0.85" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {lines
          .filter((line) => line.id !== "membres")
          .map((line) => (
            <HubConnectorLine
              key={line.id}
              line={line}
              inView={inView}
              reduceMotion={!!reduceMotion}
              isActive={activeId === line.id}
            />
          ))}
        <MembresConnectorLine
          line={membresLine}
          inView={inView}
          reduceMotion={!!reduceMotion}
          isActive={activeId === "membres"}
        />
      </svg>
    </div>
  );
}

function MembresConnectorLine({
  line,
  inView,
  reduceMotion,
  isActive,
}: {
  line: (typeof lines)[number];
  inView: boolean;
  reduceMotion: boolean;
  isActive: boolean;
}) {
  return (
    <>
      <motion.line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={isActive ? "#ffffff" : "#93c5fd"}
        strokeWidth={isActive ? 0.65 : 0.48}
        strokeLinecap="round"
        filter="url(#hub-line-glow)"
        initial={{ opacity: 0 }}
        animate={{
          opacity: inView ? (isActive ? 1 : reduceMotion ? 0.9 : [0.45, 1, 0.5]) : 0,
        }}
        transition={{
          opacity: reduceMotion
            ? { duration: 0.5, delay: line.delay, ease: easePremium }
            : isActive
              ? { duration: 0.25 }
              : {
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: line.pulseDelay,
                },
        }}
      />
      {!reduceMotion && inView ? (
        <motion.line
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#ffffff"
          strokeWidth={0.35}
          strokeLinecap="round"
          strokeDasharray="2 8"
          initial={{ strokeDashoffset: 0, opacity: 0 }}
          animate={{
            strokeDashoffset: [0, -20],
            opacity: isActive ? [0.5, 0.9, 0.5] : [0, 0.35, 0],
          }}
          transition={{
            strokeDashoffset: { duration: 1.8, repeat: Infinity, ease: "linear" },
            opacity: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: line.pulseDelay },
          }}
        />
      ) : null}
    </>
  );
}

function HubConnectorLine({
  line,
  inView,
  reduceMotion,
  isActive,
}: {
  line: (typeof lines)[number];
  inView: boolean;
  reduceMotion: boolean;
  isActive: boolean;
}) {
  const gradId = `hub-grad-${line.id}`;

  return (
    <g>
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
        >
          <stop
            offset="0%"
            stopColor={isActive ? "#93c5fd" : "#1A23FF"}
            stopOpacity={isActive ? 0.85 : 0.4}
          />
          <stop offset="50%" stopColor={isActive ? "#ffffff" : "#93c5fd"} stopOpacity="1" />
          <stop
            offset="100%"
            stopColor={isActive ? "#93c5fd" : "#1A23FF"}
            stopOpacity={isActive ? 0.85 : 0.4}
          />
        </linearGradient>
      </defs>
      <motion.line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={`url(#${gradId})`}
        strokeWidth={isActive ? 0.68 : 0.45}
        strokeLinecap="round"
        filter="url(#hub-line-glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: inView ? 1 : 0,
          opacity: inView
            ? isActive
              ? 1
              : reduceMotion
                ? 0.88
                : [0.35, 0.95, 0.4]
            : 0,
        }}
        transition={{
          pathLength: { duration: 0.75, delay: line.delay, ease: easePremium },
          opacity: reduceMotion
            ? { duration: 0.5, delay: line.delay, ease: easePremium }
            : isActive
              ? { duration: 0.2 }
              : {
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: line.pulseDelay,
                },
        }}
      />
      {!reduceMotion && inView ? (
        <motion.line
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#e0f2fe"
          strokeWidth={0.28}
          strokeLinecap="round"
          strokeDasharray={`${line.length * 0.12} ${line.length * 0.88}`}
          initial={{ strokeDashoffset: line.length }}
          animate={{
            strokeDashoffset: isActive
              ? [line.length, 0]
              : [line.length, line.length * 0.15, line.length],
            opacity: isActive ? [0.4, 0.85, 0.4] : 0,
          }}
          transition={{
            strokeDashoffset: {
              duration: isActive ? 1.4 : 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: line.pulseDelay * 0.5,
            },
            opacity: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ) : null}
    </g>
  );
}

function HubNodeCard({
  node,
  inView,
  reduceMotion,
  isActive,
  onActivate,
  onDeactivate,
}: {
  node: (typeof nodes)[number];
  inView: boolean;
  reduceMotion: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const Icon = node.icon;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{
        opacity: inView ? 1 : 0,
        scale: inView ? 1 : 0.55,
        y: reduceMotion ? 0 : isActive ? -8 : [0, -7, 0],
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.08, y: -8 }}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      transition={{
        opacity: { duration: 0.5, delay: node.delay, ease: easePremium },
        scale: { duration: 0.55, delay: node.delay, ease: easePremium },
        y: reduceMotion
          ? { duration: 0.25 }
          : isActive
            ? { duration: 0.28, ease: easePremium }
            : {
                duration: node.floatDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: node.floatDelay,
              },
      }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onTouchStart={onActivate}
      onTouchEnd={onDeactivate}
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation outline-none"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      aria-label={node.label}
    >
      {isActive && !reduceMotion ? (
        <motion.span
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-[#1A23FF]/30 blur-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      ) : null}
      <motion.div
        animate={
          isActive && !reduceMotion
            ? {
                boxShadow: [
                  "0 12px 36px rgba(26,35,255,0.5), 0 0 32px rgba(96,165,250,0.4)",
                  "0 18px 48px rgba(26,35,255,0.65), 0 0 44px rgba(147,197,253,0.5)",
                  "0 12px 36px rgba(26,35,255,0.5), 0 0 32px rgba(96,165,250,0.4)",
                ],
                borderColor: ["rgba(147,197,253,0.45)", "rgba(255,255,255,0.55)", "rgba(147,197,253,0.45)"],
              }
            : undefined
        }
        transition={{ duration: 1.4, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
        className={`flex max-w-[118px] items-center gap-1.5 rounded-xl border px-2.5 py-2 backdrop-blur-md transition-colors duration-200 sm:max-w-[128px] sm:gap-2 sm:px-3 sm:py-2.5 ${
          isActive
            ? "border-blue-300/50 bg-[#141c3d]/95"
            : "border-white/12 bg-[#0c1228]/92 shadow-[0_8px_28px_rgba(0,0,0,0.45),0_0_18px_rgba(26,35,255,0.12)]"
        }`}
      >
        <motion.span
          animate={
            isActive && !reduceMotion
              ? { scale: [1, 1.12, 1], rotate: [0, 4, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors duration-200 sm:h-7 sm:w-7 ${
            isActive
              ? "bg-[#1A23FF]/35 text-white ring-blue-300/50"
              : "bg-[#1A23FF]/20 text-blue-300 ring-[#1A23FF]/30"
          }`}
        >
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} aria-hidden />
        </motion.span>
        <span className="text-left text-[10px] font-bold leading-tight text-white sm:text-[11px]">
          {node.label}
        </span>
      </motion.div>
    </motion.button>
  );
}
