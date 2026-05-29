"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
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
    delay: 0.5 + i * 0.07,
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

const lines = nodes.map((node, i) => ({
  id: node.id,
  ...lineEndpoints(node.x, node.y),
  delay: 0.32 + i * 0.05,
}));

const membresLine = lines.find((l) => l.id === "membres")!;

export default function HeroHubVisual() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,580px)] sm:max-w-[640px] md:max-w-[720px] lg:max-w-[820px]">
      <div
        className="pointer-events-none absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.38),transparent_70%)] blur-2xl"
        aria-hidden
      />

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
              r="26"
              fill="none"
              stroke="rgba(96,165,250,0.12)"
              strokeWidth="0.25"
              animate={{ scale: [1, 1.06, 1], opacity: [0.35, 0.65, 0.35] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r="32"
              fill="none"
              stroke="rgba(96,165,250,0.08)"
              strokeWidth="0.2"
              animate={{ scale: [1, 1.04, 1], opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </>
        ) : null}
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.22, ease: easePremium }}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    "0 8px 40px rgba(26,35,255,0.25), 0 0 0 1px rgba(255,255,255,0.15) inset",
                    "0 12px 56px rgba(26,35,255,0.45), 0 0 0 1px rgba(255,255,255,0.22) inset",
                    "0 8px 40px rgba(26,35,255,0.25), 0 0 0 1px rgba(255,255,255,0.15) inset",
                  ],
                }
          }
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
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
          reduceMotion={!!reduceMotion}
          isActive={activeId === node.id}
          onActivate={() => setActiveId(node.id)}
          onDeactivate={() => setActiveId((id) => (id === node.id ? null : id))}
        />
      ))}

      {/* Traits SVG — tous les modules reliés au hub */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-[22] h-full w-full"
        aria-hidden
      >
        <defs>
          <filter id="hub-line-glow">
            <feGaussianBlur stdDeviation="0.75" result="blur" />
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
              isActive={activeId === line.id}
            />
          ))}
        <MembresConnectorLine line={membresLine} isActive={activeId === "membres"} />
      </svg>
    </div>
  );
}

/** Trait Membres : ligne SVG statique (évite le bug Framer sur trait vertical) */
function MembresConnectorLine({
  line,
  isActive,
}: {
  line: (typeof lines)[number];
  isActive: boolean;
}) {
  return (
    <motion.line
      x1={line.x1}
      y1={line.y1}
      x2={line.x2}
      y2={line.y2}
      stroke={isActive ? "#ffffff" : "#93c5fd"}
      strokeWidth={isActive ? 0.58 : 0.48}
      strokeLinecap="round"
      filter="url(#hub-line-glow)"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.95 }}
      transition={{ duration: 0.85, delay: line.delay, ease: easePremium }}
    />
  );
}

function HubConnectorLine({
  line,
  isActive,
}: {
  line: (typeof lines)[number];
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
            stopOpacity={isActive ? 0.7 : 0.35}
          />
          <stop offset="50%" stopColor={isActive ? "#ffffff" : "#93c5fd"} stopOpacity="1" />
          <stop
            offset="100%"
            stopColor={isActive ? "#93c5fd" : "#1A23FF"}
            stopOpacity={isActive ? 0.7 : 0.35}
          />
        </linearGradient>
      </defs>
      <motion.line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke={`url(#${gradId})`}
        strokeWidth={isActive ? 0.6 : 0.45}
        strokeLinecap="round"
        filter="url(#hub-line-glow)"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : [0, 1, 0.92] }}
        transition={{ duration: 0.85, delay: line.delay, ease: easePremium }}
      />
    </g>
  );
}

function HubNodeCard({
  node,
  reduceMotion,
  isActive,
  onActivate,
  onDeactivate,
}: {
  node: (typeof nodes)[number];
  reduceMotion: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const Icon = node.icon;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion ? 0 : isActive ? -6 : [0, -4, 0],
      }}
      whileHover={reduceMotion ? undefined : { scale: 1.06, y: -6 }}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      transition={{
        opacity: { duration: 0.55, delay: node.delay, ease: easePremium },
        scale: { duration: 0.25, ease: easePremium },
        y: reduceMotion
          ? { duration: 0.25 }
          : isActive
            ? { duration: 0.25 }
            : {
                duration: 4.8 + node.delay,
                repeat: Infinity,
                ease: "easeInOut",
                delay: node.delay,
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
      <motion.div
        animate={
          isActive
            ? {
                boxShadow: [
                  "0 12px 36px rgba(26,35,255,0.45), 0 0 28px rgba(96,165,250,0.35)",
                  "0 16px 44px rgba(26,35,255,0.55), 0 0 36px rgba(147,197,253,0.4)",
                  "0 12px 36px rgba(26,35,255,0.45), 0 0 28px rgba(96,165,250,0.35)",
                ],
              }
            : undefined
        }
        transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
        className={`flex max-w-[118px] items-center gap-1.5 rounded-xl border px-2.5 py-2 backdrop-blur-md transition-colors duration-200 sm:max-w-[128px] sm:gap-2 sm:px-3 sm:py-2.5 ${
          isActive
            ? "border-blue-300/50 bg-[#141c3d]/95"
            : "border-white/12 bg-[#0c1228]/92 shadow-[0_8px_28px_rgba(0,0,0,0.45),0_0_18px_rgba(26,35,255,0.12)]"
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors duration-200 sm:h-7 sm:w-7 ${
            isActive
              ? "bg-[#1A23FF]/35 text-white ring-blue-300/50"
              : "bg-[#1A23FF]/20 text-blue-300 ring-[#1A23FF]/30"
          }`}
        >
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} aria-hidden />
        </span>
        <span className="text-left text-[10px] font-bold leading-tight text-white sm:text-[11px]">
          {node.label}
        </span>
      </motion.div>
    </motion.button>
  );
}
