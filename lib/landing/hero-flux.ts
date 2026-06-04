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

export type FluxItemId =
  | "whatsapp"
  | "member"
  | "invoice"
  | "payment"
  | "calendar"
  | "document"
  | "qr"
  | "cotisation";

export type FluxItem = {
  id: FluxItemId;
  icon: LucideIcon;
  /** Position de départ — colonne gauche (%) */
  startX: number;
  startY: number;
  /** Point d’arrivée vers le hub (%) */
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  pathDelay: number;
  tone: "green" | "blue" | "amber" | "emerald" | "sky" | "slate" | "violet";
};

/** Zone hub Obillz — côté droit */
export const FLUX_HUB = { x: 82, y: 50 };

export const FLUX_ITEMS: FluxItem[] = [
  { id: "whatsapp", icon: MessageCircle, startX: 6, startY: 14, endX: 68, endY: 22, duration: 5.5, delay: 0, pathDelay: 0, tone: "green" },
  { id: "member", icon: UserRound, startX: 10, startY: 30, endX: 70, endY: 36, duration: 5.8, delay: 0.45, pathDelay: 0.2, tone: "blue" },
  { id: "invoice", icon: Receipt, startX: 5, startY: 46, endX: 66, endY: 48, duration: 6, delay: 0.9, pathDelay: 0.4, tone: "amber" },
  { id: "payment", icon: CreditCard, startX: 12, startY: 58, endX: 72, endY: 54, duration: 5.6, delay: 1.35, pathDelay: 0.55, tone: "emerald" },
  { id: "calendar", icon: CalendarDays, startX: 7, startY: 72, endX: 68, endY: 66, duration: 6.2, delay: 1.8, pathDelay: 0.75, tone: "sky" },
  { id: "document", icon: FileText, startX: 14, startY: 84, endX: 74, endY: 78, duration: 5.9, delay: 2.25, pathDelay: 0.9, tone: "slate" },
  { id: "qr", icon: QrCode, startX: 4, startY: 62, endX: 64, endY: 60, duration: 6.4, delay: 2.7, pathDelay: 1.05, tone: "blue" },
  { id: "cotisation", icon: Wallet, startX: 11, startY: 40, endX: 71, endY: 42, duration: 5.7, delay: 3.15, pathDelay: 1.2, tone: "violet" },
];

export type FluxStreamPath = {
  id: FluxItemId;
  d: string;
  length: number;
  delay: number;
};

function streamCurve(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const bend = 8;
  return `M ${x1} ${y1} Q ${mx} ${my - bend} ${x2} ${y2}`;
}

function pathLen(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 8;
  let len = 0;
  let px = x1;
  let py = y1;
  for (let t = 0.1; t <= 1.001; t += 0.1) {
    const o = 1 - t;
    const xt = o * o * x1 + 2 * o * t * mx + t * t * x2;
    const yt = o * o * y1 + 2 * o * t * my + t * t * y2;
    len += Math.hypot(xt - px, yt - py);
    px = xt;
    py = yt;
  }
  return len;
}

export function buildFluxStreamPaths(): FluxStreamPath[] {
  return FLUX_ITEMS.map((item) => {
    const d = streamCurve(item.startX, item.startY, item.endX, item.endY);
    return {
      id: item.id,
      d,
      length: pathLen(item.startX, item.startY, item.endX, item.endY),
      delay: item.pathDelay,
    };
  });
}

/** Grand flux principal vers le hub */
export function mainFluxPath(): { d: string; length: number } {
  const d = "M 8 50 Q 42 38 72 50 T 78 50";
  return { d, length: 72 };
}
