import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  MessageCircle,
  QrCode,
  Receipt,
  UserRound,
  Wallet,
} from "lucide-react";

export type FlowFragmentId =
  | "member"
  | "invoice"
  | "payment"
  | "cotisation"
  | "calendar"
  | "qr"
  | "whatsapp"
  | "document";

export type FlowFragment = {
  id: FlowFragmentId;
  icon: LucideIcon;
  /** Position de départ (viewBox %) */
  x: number;
  y: number;
  /** Amplitude convergence vers le centre */
  pullX: number;
  pullY: number;
  floatY: number;
  duration: number;
  delay: number;
  pathDelay: number;
  rotate: number;
  tone: "blue" | "emerald" | "sky" | "violet" | "amber" | "green" | "slate";
};

export const FLOW_CENTER = { x: 50, y: 54 };
const HUB_EDGE = 14;

export const FLOW_FRAGMENTS: FlowFragment[] = [
  { id: "whatsapp", icon: MessageCircle, x: 7, y: 22, pullX: 14, pullY: 10, floatY: 6, duration: 7.2, delay: 0, pathDelay: 0, rotate: -6, tone: "green" },
  { id: "invoice", icon: Receipt, x: 10, y: 48, pullX: 13, pullY: 3, floatY: 7, duration: 6.8, delay: 0.6, pathDelay: 0.25, rotate: -4, tone: "amber" },
  { id: "document", icon: FileText, x: 14, y: 78, pullX: 11, pullY: -8, floatY: 8, duration: 7.5, delay: 1.2, pathDelay: 0.5, rotate: -5, tone: "slate" },
  { id: "member", icon: UserRound, x: 22, y: 12, pullX: 9, pullY: 12, floatY: 5, duration: 6.5, delay: 0.35, pathDelay: 0.15, rotate: 3, tone: "blue" },
  { id: "calendar", icon: CalendarDays, x: 86, y: 14, pullX: -12, pullY: 11, floatY: 6, duration: 7, delay: 0.5, pathDelay: 0.35, rotate: 5, tone: "sky" },
  { id: "payment", icon: CreditCard, x: 90, y: 40, pullX: -13, pullY: 4, floatY: 7, duration: 6.6, delay: 0.9, pathDelay: 0.45, rotate: 4, tone: "emerald" },
  { id: "cotisation", icon: Wallet, x: 88, y: 68, pullX: -12, pullY: -5, floatY: 8, duration: 7.3, delay: 1.4, pathDelay: 0.65, rotate: 6, tone: "violet" },
  { id: "qr", icon: QrCode, x: 80, y: 86, pullX: -10, pullY: -10, floatY: 6, duration: 6.9, delay: 1.8, pathDelay: 0.8, rotate: -3, tone: "blue" },
];

export type FlowPath = {
  id: FlowFragmentId;
  d: string;
  length: number;
  delay: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function fragmentAnchor(x: number, y: number) {
  const dx = FLOW_CENTER.x - x;
  const dy = FLOW_CENTER.y - y;
  const dist = Math.hypot(dx, dy) || 1;
  return { x2: x + (dx / dist) * 4.5, y2: y + (dy / dist) * 4.5 };
}

function hubAnchor(x: number, y: number) {
  const dx = x - FLOW_CENTER.x;
  const dy = y - FLOW_CENTER.y;
  const dist = Math.hypot(dx, dy) || 1;
  return {
    x1: FLOW_CENTER.x + (dx / dist) * HUB_EDGE,
    y1: FLOW_CENTER.y + (dy / dist) * HUB_EDGE,
  };
}

function curveControl(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  return { cx: mx - dy * 0.14, cy: my + dx * 0.14 };
}

function quadLength(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) {
  let len = 0;
  let px = x1;
  let py = y1;
  for (let t = 0.1; t <= 1.001; t += 0.1) {
    const o = 1 - t;
    const xt = o * o * x1 + 2 * o * t * cx + t * t * x2;
    const yt = o * o * y1 + 2 * o * t * cy + t * t * y2;
    len += Math.hypot(xt - px, yt - py);
    px = xt;
    py = yt;
  }
  return len;
}

export function buildFlowPaths(): FlowPath[] {
  return FLOW_FRAGMENTS.map((f) => {
    const end = fragmentAnchor(f.x, f.y);
    const start = hubAnchor(f.x, f.y);
    const { cx, cy } = curveControl(start.x1, start.y1, end.x2, end.y2);
    const d = `M ${end.x2} ${end.y2} Q ${cx} ${cy} ${start.x1} ${start.y1}`;
    return {
      id: f.id,
      d,
      length: quadLength(end.x2, end.y2, cx, cy, start.x1, start.y1),
      delay: 0.15 + f.pathDelay,
      x1: start.x1,
      y1: start.y1,
      x2: end.x2,
      y2: end.y2,
    };
  });
}
