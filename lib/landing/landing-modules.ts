import {
  CalendarDays,
  CalendarRange,
  Coffee,
  CreditCard,
  Globe,
  Handshake,
  Receipt,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LANDING_MODULE_IDS = [
  "membres",
  "cotisations",
  "factures",
  "planning",
  "evenements",
  "buvette",
  "sponsors",
  "paiements",
  "utilisateurs",
  "page-publique",
] as const;

export type LandingModuleId = (typeof LANDING_MODULE_IDS)[number];

export const landingModuleIcons: Record<LandingModuleId, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  factures: Receipt,
  planning: CalendarRange,
  evenements: CalendarDays,
  buvette: Coffee,
  sponsors: Handshake,
  paiements: CreditCard,
  utilisateurs: UserCog,
  "page-publique": Globe,
};

export type OrbitLayout = {
  x: number;
  y: number;
  floatY: number;
  floatX: number;
  floatDuration: number;
  floatDelay: number;
};

/** Positions orbitales régulières autour d'un centre (viewBox 0–100). */
export function buildOrbitLayout(
  count: number,
  cx = 50,
  cy = 50,
  rx = 43,
  ry = 39,
  startAngle = -Math.PI / 2
): OrbitLayout[] {
  return Array.from({ length: count }, (_, i) => ({
    x: cx + rx * Math.cos(startAngle + (i / count) * 2 * Math.PI),
    y: cy + ry * Math.sin(startAngle + (i / count) * 2 * Math.PI),
    floatY: 9 + (i % 3) * 3,
    floatX: 4 + (i % 2) * 2,
    floatDuration: 4.2 + (i % 4) * 0.45,
    floatDelay: i * 0.28,
  }));
}

export const MODULE_ORBIT_LAYOUT = buildOrbitLayout(LANDING_MODULE_IDS.length);
