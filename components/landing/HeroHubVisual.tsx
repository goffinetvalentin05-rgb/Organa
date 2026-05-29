"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  CreditCard,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";

type HubNode = {
  id: string;
  label: string;
  icon: LucideIcon;
  x: number;
  y: number;
  delay: number;
};

const nodes: HubNode[] = [
  { id: "membres", label: "Membres", icon: Users, x: 18, y: 18, delay: 0.5 },
  { id: "cotisations", label: "Cotisations", icon: Wallet, x: 82, y: 18, delay: 0.62 },
  { id: "factures", label: "Factures", icon: Receipt, x: 8, y: 72, delay: 0.74 },
  { id: "paiements", label: "Paiements", icon: CreditCard, x: 50, y: 88, delay: 0.86 },
  { id: "evenements", label: "Événements", icon: CalendarDays, x: 92, y: 72, delay: 0.98 },
];

const lines: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [
  { x1: 50, y1: 50, x2: 18, y2: 18, delay: 0.35 },
  { x1: 50, y1: 50, x2: 82, y2: 18, delay: 0.42 },
  { x1: 50, y1: 50, x2: 8, y2: 72, delay: 0.49 },
  { x1: 50, y1: 50, x2: 50, y2: 88, delay: 0.56 },
  { x1: 50, y1: 50, x2: 92, y2: 72, delay: 0.63 },
];

export default function HeroHubVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,540px)] sm:max-w-[600px] md:max-w-[680px] lg:max-w-[760px]">
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.35),transparent_70%)] blur-2xl"
        aria-hidden
      />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1A23FF" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1A23FF" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {lines.map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="url(#line-grad)"
            strokeWidth="0.35"
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.85] }}
            transition={{ duration: 0.9, delay: line.delay, ease: easePremium }}
          />
        ))}
        {!reduceMotion ? (
          <motion.circle
            cx="50"
            cy="50"
            r="22"
            fill="none"
            stroke="rgba(96,165,250,0.15)"
            strokeWidth="0.2"
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.25, ease: easePremium }}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={reduceMotion ? undefined : { boxShadow: ["0 0 40px rgba(26,35,255,0.4)", "0 0 60px rgba(59,130,246,0.55)", "0 0 40px rgba(26,35,255,0.4)"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-blue-400/40 bg-[#0a0f24]/90 p-3 shadow-[0_0_48px_rgba(26,35,255,0.5)] backdrop-blur-xl sm:h-[100px] sm:w-[100px] md:h-[112px] md:w-[112px] md:rounded-3xl"
        >
          <Image
            src="/logo-obillz.png"
            alt="Obillz"
            width={80}
            height={24}
            className="h-auto w-[72px] brightness-110 sm:w-20"
          />
        </motion.div>
      </motion.div>

      {nodes.map((node) => (
        <HubNodeCard key={node.id} node={node} reduceMotion={!!reduceMotion} />
      ))}
    </div>
  );
}

function HubNodeCard({ node, reduceMotion }: { node: HubNode; reduceMotion: boolean }) {
  const Icon = node.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion ? 0 : [0, -5, 0],
      }}
      transition={{
        opacity: { duration: 0.55, delay: node.delay, ease: easePremium },
        scale: { duration: 0.55, delay: node.delay, ease: easePremium },
        y: reduceMotion
          ? undefined
          : { duration: 4.5 + node.delay, repeat: Infinity, ease: "easeInOut", delay: node.delay },
      }}
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <div className="flex min-w-[100px] items-center gap-2 rounded-xl border border-white/10 bg-[#0c1228]/90 px-3 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.45),0_0_20px_rgba(26,35,255,0.15)] backdrop-blur-md sm:min-w-[112px] sm:px-3.5 sm:py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1A23FF]/20 text-blue-300 ring-1 ring-[#1A23FF]/30">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </span>
        <span className="text-[11px] font-bold text-white sm:text-xs">{node.label}</span>
      </div>
    </motion.div>
  );
}
