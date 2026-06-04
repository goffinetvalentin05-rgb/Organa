import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import {
  LANDING_MODULE_IDS,
  landingModuleIcons,
  type LandingModuleId,
} from "@/lib/landing/landing-modules";

export type FlowSourceId = LandingModuleId;

export type FlowSourceDef = {
  id: FlowSourceId;
  icon: LucideIcon;
  side: "left" | "right";
  /** Position (viewBox 100×60) */
  x: number;
  y: number;
  endX: number;
  endY: number;
  rotate: number;
  pathDelay: number;
  staggerDelay: number;
  driftDuration: number;
  floatDuration: number;
  tone: "blue" | "violet" | "indigo" | "sky" | "emerald" | "amber" | "slate" | "cyan";
};

export const FLOW_VIEW_HEIGHT = 60;

/** Entrées du dossier — bords gauche / droit (viewBox) */
export const FOLDER_MOUTH_LEFT = { x: 40, y: 30 };
export const FOLDER_MOUTH_RIGHT = { x: 60, y: 30 };

/** 4 features à gauche, 4 à droite — dossier au centre */
export const FLOW_SOURCES: FlowSourceDef[] = [
  {
    id: "membres",
    icon: landingModuleIcons.membres,
    side: "left",
    x: 14,
    y: 10,
    endX: 39,
    endY: 12,
    rotate: -8,
    pathDelay: 0.15,
    staggerDelay: 0,
    driftDuration: 9,
    floatDuration: 4.2,
    tone: "blue",
  },
  {
    id: "cotisations",
    icon: landingModuleIcons.cotisations,
    side: "left",
    x: 12,
    y: 18,
    endX: 38,
    endY: 18,
    rotate: 6,
    pathDelay: 0.28,
    staggerDelay: 0.08,
    driftDuration: 9.5,
    floatDuration: 4.5,
    tone: "violet",
  },
  {
    id: "factures",
    icon: landingModuleIcons.factures,
    side: "left",
    x: 16,
    y: 26,
    endX: 40,
    endY: 24,
    rotate: -5,
    pathDelay: 0.4,
    staggerDelay: 0.16,
    driftDuration: 10,
    floatDuration: 4.8,
    tone: "indigo",
  },
  {
    id: "evenements",
    icon: landingModuleIcons.evenements,
    side: "left",
    x: 13,
    y: 34,
    endX: 39,
    endY: 30,
    rotate: 7,
    pathDelay: 0.52,
    staggerDelay: 0.24,
    driftDuration: 10.2,
    floatDuration: 5,
    tone: "sky",
  },
  {
    id: "paiements",
    icon: landingModuleIcons.paiements,
    side: "right",
    x: 86,
    y: 10,
    endX: 61,
    endY: 12,
    rotate: 8,
    pathDelay: 0.2,
    staggerDelay: 0.1,
    driftDuration: 9.2,
    floatDuration: 4.3,
    tone: "emerald",
  },
  {
    id: "depenses",
    icon: landingModuleIcons.depenses,
    side: "right",
    x: 84,
    y: 18,
    endX: 60,
    endY: 18,
    rotate: -6,
    pathDelay: 0.35,
    staggerDelay: 0.18,
    driftDuration: 9.8,
    floatDuration: 4.6,
    tone: "amber",
  },
  {
    id: "buvette",
    icon: landingModuleIcons.buvette,
    side: "right",
    x: 87,
    y: 26,
    endX: 62,
    endY: 24,
    rotate: 5,
    pathDelay: 0.48,
    staggerDelay: 0.26,
    driftDuration: 10.4,
    floatDuration: 4.9,
    tone: "cyan",
  },
  {
    id: "page-publique",
    icon: landingModuleIcons["page-publique"],
    side: "right",
    x: 85,
    y: 34,
    endX: 61,
    endY: 30,
    rotate: -7,
    pathDelay: 0.6,
    staggerDelay: 0.34,
    driftDuration: 10.6,
    floatDuration: 5.1,
    tone: "slate",
  },
];

export const MOBILE_FLOW_SOURCE_IDS: FlowSourceId[] = [
  "membres",
  "cotisations",
  "factures",
  "paiements",
  "depenses",
  "buvette",
];

export const FLOW_HUB_MODULES = LANDING_MODULE_IDS.map((id) => ({
  id,
  icon: landingModuleIcons[id],
}));

export type FlowStreamPath = {
  id: FlowSourceId;
  d: string;
  delay: number;
};

function organicCurve(x1: number, y1: number, x2: number, y2: number) {
  const t = 0.52;
  const cx = x1 + (x2 - x1) * t;
  const cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.06;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export function buildFlowStreamPaths(sources: FlowSourceDef[]): FlowStreamPath[] {
  return sources.map((source) => ({
    id: source.id,
    d: organicCurve(source.x, source.y, source.endX, source.endY),
    delay: source.pathDelay,
  }));
}

export const flowSourceToneClass: Record<FlowSourceDef["tone"], string> = {
  blue: "bg-[#1A23FF]/28 text-blue-300 shadow-[0_0_18px_rgba(26,35,255,0.3)] ring-[#1A23FF]/45",
  violet: "bg-violet-500/22 text-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.28)] ring-violet-400/38",
  indigo: "bg-indigo-500/22 text-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.28)] ring-indigo-400/35",
  sky: "bg-sky-500/20 text-sky-300 shadow-[0_0_16px_rgba(56,189,248,0.22)] ring-sky-400/32",
  emerald: "bg-emerald-500/22 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.25)] ring-emerald-400/35",
  amber: "bg-amber-500/20 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.22)] ring-amber-400/32",
  slate: "bg-slate-500/18 text-slate-300 shadow-[0_0_14px_rgba(148,163,184,0.18)] ring-slate-400/28",
  cyan: "bg-cyan-500/18 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.2)] ring-cyan-400/30",
};

export { ChevronRight };
