import type { SupporterDurationType, SupporterStatus } from "./types";

const ZURICH = "Europe/Zurich";

export function todayYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZURICH }).format(now);
}

export function toYmd(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }
  return todayYmd(value);
}

export function addCalendarYearsYmd(ymd: string, years: number): string {
  const parts = ymd.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return ymd;
  const next = new Date(Date.UTC(y + years, m - 1, d));
  return next.toISOString().slice(0, 10);
}

export type SupporterValidityInput = {
  status: SupporterStatus | string;
  startDate?: string | null;
  endDate?: string | null;
};

/**
 * Source de vérité unique : un supporter n’est valide que s’il est
 * `active`, que la période a commencé, et que la date de fin n’est pas dépassée.
 */
export function isSupporterActive(
  supporter: SupporterValidityInput,
  now: Date = new Date()
): boolean {
  if (supporter.status !== "active") return false;
  const today = todayYmd(now);
  const start = toYmd(supporter.startDate);
  const end = toYmd(supporter.endDate);
  if (start && start > today) return false;
  if (end && end < today) return false;
  return true;
}

export function supporterDisplayStatus(
  supporter: SupporterValidityInput,
  now: Date = new Date()
): "pending" | "active" | "expired" | "cancelled" {
  if (supporter.status === "pending") return "pending";
  if (supporter.status === "cancelled") return "cancelled";
  if (supporter.status === "expired") return "expired";
  if (supporter.status === "active") {
    return isSupporterActive(supporter, now) ? "active" : "expired";
  }
  return "cancelled";
}

export function computeValidityPeriod(params: {
  durationType: SupporterDurationType;
  offerStartDate: string | null;
  offerEndDate: string | null;
  paidAt?: Date;
}): { startDate: string; endDate: string } {
  const paidYmd = todayYmd(params.paidAt ?? new Date());

  if (params.durationType === "year") {
    return {
      startDate: paidYmd,
      endDate: addCalendarYearsYmd(paidYmd, 1),
    };
  }

  const offerStart = toYmd(params.offerStartDate) || paidYmd;
  const offerEnd = toYmd(params.offerEndDate) || addCalendarYearsYmd(paidYmd, 1);
  const startDate = offerStart > paidYmd ? offerStart : paidYmd;
  return { startDate, endDate: offerEnd };
}

export function offerAllowsCheckout(
  offer: {
    isActive: boolean;
    durationType: SupporterDurationType;
    startDate: string | null;
    endDate: string | null;
  },
  now: Date = new Date()
): { ok: true } | { ok: false; error: string } {
  if (!offer.isActive) {
    return { ok: false, error: "Cette offre n’est plus disponible." };
  }
  if (offer.durationType === "year") return { ok: true };
  const end = toYmd(offer.endDate);
  if (end && end < todayYmd(now)) {
    return { ok: false, error: "Cette offre n’est plus valable." };
  }
  return { ok: true };
}
