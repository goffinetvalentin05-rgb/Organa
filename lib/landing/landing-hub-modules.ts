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

export const LANDING_HUB_MODULE_IDS = [
  "membres",
  "cotisations",
  "factures",
  "paiements",
  "evenements",
  "campagnes",
  "page-publique",
] as const;

export type LandingHubModuleId = (typeof LANDING_HUB_MODULE_IDS)[number];

export const landingHubModuleIcons: Record<LandingHubModuleId, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  factures: Receipt,
  paiements: CreditCard,
  evenements: CalendarDays,
  campagnes: Megaphone,
  "page-publique": Globe,
};

export const HUB_CENTER = 50;
export const HUB_RADIUS = 36;
const HUB_EDGE = 14;
const NODE_INSET = 5;

export type HubModuleBase = {
  id: LandingHubModuleId;
  icon: LucideIcon;
  label: string;
};

export type HubNode = HubModuleBase & {
  x: number;
  y: number;
  delay: number;
  floatDuration: number;
  floatDelay: number;
};

export type HubLine = {
  id: LandingHubModuleId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  delay: number;
  pulseDelay: number;
};

function lineEndpoints(x: number, y: number) {
  const dx = x - HUB_CENTER;
  const dy = y - HUB_CENTER;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    x1: HUB_CENTER + ux * HUB_EDGE,
    y1: HUB_CENTER + uy * HUB_EDGE,
    x2: x - ux * NODE_INSET,
    y2: y - uy * NODE_INSET,
  };
}

export function buildHubNodes(modules: HubModuleBase[]): HubNode[] {
  return modules.map((mod, i) => {
    const angle = (i / modules.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...mod,
      x: HUB_CENTER + HUB_RADIUS * Math.cos(angle),
      y: HUB_CENTER + HUB_RADIUS * Math.sin(angle),
      delay: 0.12 + i * 0.09,
      floatDuration: 3.8 + (i % 4) * 0.55,
      floatDelay: i * 0.35,
    };
  });
}

export function buildHubLines(nodes: HubNode[]): HubLine[] {
  return nodes.map((node, i) => {
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
}
