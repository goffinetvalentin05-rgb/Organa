import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  ListChecks,
  Receipt,
  UserPlus,
  Users,
} from "lucide-react";

export type HeroFragmentId =
  | "invoice"
  | "calendar"
  | "members"
  | "payment"
  | "registration"
  | "list"
  | "document"
  | "planning";

export type HeroFragment = {
  id: HeroFragmentId;
  icon: LucideIcon;
  x: number;
  y: number;
  /** Dérive vers le centre (unités viewBox %) */
  driftX: number;
  driftY: number;
  floatY: number;
  floatX: number;
  duration: number;
  delay: number;
  pathDelay: number;
  rotate: number;
};

export const HERO_CENTER = { x: 50, y: 50 };
const HUB_EDGE = 11;

/** Fragments dispersés — tâches club, pas cartes features */
export const HERO_FRAGMENTS: HeroFragment[] = [
  {
    id: "invoice",
    icon: Receipt,
    x: 7,
    y: 18,
    driftX: 9,
    driftY: 5,
    floatY: 7,
    floatX: 4,
    duration: 5.8,
    delay: 0,
    pathDelay: 0,
    rotate: -8,
  },
  {
    id: "calendar",
    icon: CalendarDays,
    x: 91,
    y: 16,
    driftX: -9,
    driftY: 4,
    floatY: 6,
    floatX: 3,
    duration: 6.2,
    delay: 0.35,
    pathDelay: 0.2,
    rotate: 6,
  },
  {
    id: "members",
    icon: Users,
    x: 5,
    y: 48,
    driftX: 10,
    driftY: 0,
    floatY: 8,
    floatX: 5,
    duration: 5.4,
    delay: 0.7,
    pathDelay: 0.45,
    rotate: -5,
  },
  {
    id: "payment",
    icon: CreditCard,
    x: 93,
    y: 44,
    driftX: -10,
    driftY: 1,
    floatY: 7,
    floatX: 4,
    duration: 5.6,
    delay: 0.5,
    pathDelay: 0.35,
    rotate: 7,
  },
  {
    id: "registration",
    icon: UserPlus,
    x: 12,
    y: 78,
    driftX: 7,
    driftY: -6,
    floatY: 9,
    floatX: 3,
    duration: 6.4,
    delay: 1,
    pathDelay: 0.6,
    rotate: -6,
  },
  {
    id: "list",
    icon: ListChecks,
    x: 88,
    y: 76,
    driftX: -8,
    driftY: -5,
    floatY: 8,
    floatX: 4,
    duration: 5.9,
    delay: 0.85,
    pathDelay: 0.55,
    rotate: 5,
  },
  {
    id: "document",
    icon: FileText,
    x: 22,
    y: 10,
    driftX: 6,
    driftY: 7,
    floatY: 6,
    floatX: 3,
    duration: 6.6,
    delay: 0.2,
    pathDelay: 0.15,
    rotate: -4,
  },
  {
    id: "planning",
    icon: ClipboardList,
    x: 78,
    y: 82,
    driftX: -7,
    driftY: -7,
    floatY: 7,
    floatX: 3,
    duration: 6.1,
    delay: 1.15,
    pathDelay: 0.7,
    rotate: 4,
  },
];

export type ConvergencePath = {
  id: HeroFragmentId;
  d: string;
  length: number;
  delay: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function fragmentAnchor(x: number, y: number) {
  const dx = HERO_CENTER.x - x;
  const dy = HERO_CENTER.y - y;
  const dist = Math.hypot(dx, dy) || 1;
  return {
    x2: x + (dx / dist) * 5,
    y2: y + (dy / dist) * 5,
  };
}

function hubAnchor(x: number, y: number) {
  const dx = x - HERO_CENTER.x;
  const dy = y - HERO_CENTER.y;
  const dist = Math.hypot(dx, dy) || 1;
  return {
    x1: HERO_CENTER.x + (dx / dist) * HUB_EDGE,
    y1: HERO_CENTER.y + (dy / dist) * HUB_EDGE,
  };
}

function curveControl(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  return { cx: mx - dy * 0.12, cy: my + dx * 0.12 };
}

function pathLength(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) {
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

export function buildConvergencePaths(fragments: HeroFragment[]): ConvergencePath[] {
  return fragments.map((f) => {
    const end = fragmentAnchor(f.x, f.y);
    const start = hubAnchor(f.x, f.y);
    const { cx, cy } = curveControl(start.x1, start.y1, end.x2, end.y2);
    /** Sens fragment → hub (convergence) */
    const d = `M ${end.x2} ${end.y2} Q ${cx} ${cy} ${start.x1} ${start.y1}`;
    return {
      id: f.id,
      d,
      length: pathLength(start.x1, start.y1, cx, cy, end.x2, end.y2),
      delay: 0.2 + f.pathDelay,
      x1: start.x1,
      y1: start.y1,
      x2: end.x2,
      y2: end.y2,
    };
  });
}
