import { formatChf } from "@/lib/shop/money";
import type { SupporterDurationType } from "./types";
import { toYmd } from "./status";

export function formatSupporterNumber(n: number | null | undefined): string | null {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) return null;
  return String(n).padStart(4, "0");
}

export function formatSupporterNumberLabel(n: number | null | undefined): string | null {
  const formatted = formatSupporterNumber(n);
  return formatted ? `#${formatted}` : null;
}

export function publicDisplayName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (!first) return last ? `${last.charAt(0).toUpperCase()}.` : "";
  if (!last) return first;
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export function formatSwissDate(ymd: string | null | undefined, locale = "fr-CH"): string | null {
  const day = toYmd(ymd);
  if (!day) return null;
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatSwissDateLong(ymd: string | null | undefined, locale = "fr-CH"): string | null {
  const day = toYmd(ymd);
  if (!day) return null;
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function seasonLabel(startDate: string | null, endDate: string | null): string {
  const start = toYmd(startDate);
  const end = toYmd(endDate);
  if (!start || !end) return "Saison";
  const sy = start.slice(0, 4);
  const ey = end.slice(0, 4);
  if (sy !== ey) return `${sy}/${ey.slice(-2)}`;
  return sy;
}

export function durationLabel(params: {
  durationType: SupporterDurationType;
  startDate: string | null;
  endDate: string | null;
}): string {
  if (params.durationType === "year") return "1 année";
  if (params.durationType === "custom") {
    const from = formatSwissDate(params.startDate);
    const to = formatSwissDate(params.endDate);
    if (from && to) return `${from} – ${to}`;
    return "Période personnalisée";
  }
  return `Saison ${seasonLabel(params.startDate, params.endDate)}`;
}

export function durationShortLabel(params: {
  durationType: SupporterDurationType;
  startDate: string | null;
  endDate: string | null;
}): string {
  if (params.durationType === "year") return "par année";
  if (params.durationType === "custom") return "période définie";
  return "par saison";
}

export { formatChf };
