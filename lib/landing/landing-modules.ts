import {
  CalendarDays,
  Coffee,
  CreditCard,
  Globe,
  Receipt,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LANDING_MODULE_IDS = [
  "membres",
  "cotisations",
  "factures",
  "evenements",
  "paiements",
  "depenses",
  "buvette",
  "page-publique",
] as const;

export type LandingModuleId = (typeof LANDING_MODULE_IDS)[number];

export const landingModuleIcons: Record<LandingModuleId, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  factures: Receipt,
  evenements: CalendarDays,
  paiements: CreditCard,
  depenses: TrendingDown,
  buvette: Coffee,
  "page-publique": Globe,
};
