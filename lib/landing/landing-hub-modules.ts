import {
  CalendarDays,
  CreditCard,
  Globe,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LANDING_HUB_MODULE_IDS = [
  "membres",
  "cotisations",
  "factures",
  "paiements",
  "evenements",
  "page-publique",
] as const;

export type LandingHubModuleId = (typeof LANDING_HUB_MODULE_IDS)[number];

export const landingHubModuleIcons: Record<LandingHubModuleId, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  factures: Receipt,
  paiements: CreditCard,
  evenements: CalendarDays,
  "page-publique": Globe,
};

/** Positions organiques — légèrement décalées, pas en grille rigide */
const HUB_NODE_LAYOUT: Record<
  LandingHubModuleId,
  { x: number; y: number; floatY: number; floatX: number; floatDuration: number; floatDelay: number }
> = {
  membres: { x: 10.5, y: 20, floatY: 11, floatX: 4, floatDuration: 4.2, floatDelay: 0 },
  "page-publique": { x: 12, y: 51, floatY: 9, floatX: 5, floatDuration: 5.1, floatDelay: 0.55 },
  evenements: { x: 9.5, y: 79, floatY: 12, floatX: 3, floatDuration: 4.8, floatDelay: 1.1 },
  cotisations: { x: 89.5, y: 19, floatY: 10, floatX: 4, floatDuration: 4.5, floatDelay: 0.35 },
  factures: { x: 87.5, y: 52, floatY: 13, floatX: 5, floatDuration: 5.4, floatDelay: 0.9 },
  paiements: { x: 90, y: 78, floatY: 8, floatX: 3, floatDuration: 4.9, floatDelay: 1.45 },
};

export const HUB_CENTER = 50;
const CENTER_HALF_W = 13;
const CENTER_HALF_H = 11;
const NODE_INSET = 5;

export type HubModuleBase = {
  id: LandingHubModuleId;
  icon: LucideIcon;
  label: string;
  hint: string;
};

export type HubNode = HubModuleBase & {
  x: number;
  y: number;
  delay: number;
  floatY: number;
  floatX: number;
  floatDuration: number;
  floatDelay: number;
  side: "left" | "right";
};

export type HubPath = {
  id: LandingHubModuleId;
  d: string;
  length: number;
  delay: number;
  pulseDelay: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function hubEdgePoint(nodeX: number, nodeY: number) {
  const dx = nodeX - HUB_CENTER;
  const dy = nodeY - HUB_CENTER;

  if (Math.abs(dx) >= Math.abs(dy) * 0.8) {
    const edgeX = HUB_CENTER + (dx > 0 ? CENTER_HALF_W : -CENTER_HALF_W);
    const edgeY = HUB_CENTER + dy * 0.32;
    const endX = nodeX + (dx > 0 ? -NODE_INSET : NODE_INSET);
    return { x1: edgeX, y1: edgeY, x2: endX, y2: nodeY };
  }

  const edgeY = HUB_CENTER + (dy > 0 ? CENTER_HALF_H : -CENTER_HALF_H);
  const edgeX = HUB_CENTER + dx * 0.32;
  const endY = nodeY + (dy > 0 ? -NODE_INSET : NODE_INSET);
  return { x1: edgeX, y1: edgeY, x2: nodeX, y2: endY };
}

function curveControl(x1: number, y1: number, x2: number, y2: number, side: "left" | "right") {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const bend = side === "left" ? -0.22 : 0.22;
  return { cx: mx - dy * bend, cy: my + dx * bend };
}

function approximateQuadLength(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number
) {
  let length = 0;
  let px = x1;
  let py = y1;
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const omt = 1 - t;
    const xt = omt * omt * x1 + 2 * omt * t * cx + t * t * x2;
    const yt = omt * omt * y1 + 2 * omt * t * cy + t * t * y2;
    length += Math.hypot(xt - px, yt - py);
    px = xt;
    py = yt;
  }
  return length;
}

export function buildHubNodes(modules: HubModuleBase[]): HubNode[] {
  return modules.map((mod, i) => {
    const layout = HUB_NODE_LAYOUT[mod.id];
    return {
      ...mod,
      x: layout.x,
      y: layout.y,
      floatY: layout.floatY,
      floatX: layout.floatX,
      floatDuration: layout.floatDuration,
      floatDelay: layout.floatDelay,
      side: layout.x < HUB_CENTER ? "left" : "right",
      delay: 0.4 + i * 0.11,
    };
  });
}

export function buildHubPaths(nodes: HubNode[]): HubPath[] {
  return nodes.map((node, i) => {
    const { x1, y1, x2, y2 } = hubEdgePoint(node.x, node.y);
    const { cx, cy } = curveControl(x1, y1, x2, y2, node.side);
    const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    return {
      id: node.id,
      d,
      length: approximateQuadLength(x1, y1, cx, cy, x2, y2),
      delay: 0.25 + i * 0.09,
      pulseDelay: i * 0.38,
      x1,
      y1,
      x2,
      y2,
    };
  });
}

export function buildHubLines(nodes: HubNode[]): HubPath[] {
  return buildHubPaths(nodes);
}
