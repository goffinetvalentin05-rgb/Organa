import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  QrCode,
  Receipt,
  UserRound,
} from "lucide-react";

export type TransitSourceId =
  | "whatsapp"
  | "member"
  | "invoice"
  | "payment"
  | "calendar"
  | "qr"
  | "document";

export type TransitSource = {
  id: TransitSourceId;
  icon?: LucideIcon;
  brand?: "whatsapp";
  label: string;
  anchorX: number;
  anchorY: number;
  duration: number;
  delay: number;
};

export const TRANSIT_HUB = { x: 48, y: 50 };
export const TRANSIT_DEST = { x: 82, y: 50 };

/** Courbe organique : source → hub → dashboard */
export function transitCurvePath(sx: number, sy: number): string {
  const { x: hx, y: hy } = TRANSIT_HUB;
  const { x: dx, y: dy } = TRANSIT_DEST;
  const c1x = sx + (hx - sx) * 0.45;
  const c1y = sy + (hy - sy) * 0.15 - 4;
  const c2x = hx - 6;
  const c2y = hy - 5;
  const c3x = hx + 10;
  const c3y = hy + 3;
  const c4x = dx - 14;
  const c4y = dy - 2;
  return `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${hx} ${hy} C ${c3x} ${c3y} ${c4x} ${c4y} ${dx} ${dy}`;
}

export const TRANSIT_SOURCES: TransitSource[] = [
  { id: "whatsapp", brand: "whatsapp", label: "WhatsApp", anchorX: 11, anchorY: 22, duration: 8, delay: 0 },
  { id: "member", icon: UserRound, label: "Membres", anchorX: 13, anchorY: 36, duration: 8.2, delay: 0.7 },
  { id: "invoice", icon: Receipt, label: "Factures", anchorX: 9, anchorY: 50, duration: 8.4, delay: 1.4 },
  { id: "payment", icon: CreditCard, label: "Paiements", anchorX: 14, anchorY: 62, duration: 8.1, delay: 2.1 },
  { id: "calendar", icon: CalendarDays, label: "Événements", anchorX: 10, anchorY: 74, duration: 8.5, delay: 2.8 },
  { id: "qr", icon: QrCode, label: "Inscriptions", anchorX: 15, anchorY: 86, duration: 8.3, delay: 3.5 },
  { id: "document", icon: FileText, label: "Documents", anchorX: 12, anchorY: 58, duration: 8.6, delay: 4.2 },
];

export function buildTransitPaths(): { id: TransitSourceId; d: string; delay: number }[] {
  return TRANSIT_SOURCES.map((s) => ({
    id: s.id,
    d: transitCurvePath(s.anchorX, s.anchorY),
    delay: s.delay * 0.12,
  }));
}
