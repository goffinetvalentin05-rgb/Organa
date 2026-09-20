import type { SupportSaleStatus } from "./types";

export function todayZurichDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });
}

export function saleAcceptsReservations(input: {
  status: SupportSaleStatus;
  reservationDeadline: string | null;
  remainingQuantity: number | null;
}): boolean {
  if (input.status !== "active") return false;
  if (input.reservationDeadline && input.reservationDeadline < todayZurichDate()) {
    return false;
  }
  if (input.remainingQuantity != null && input.remainingQuantity <= 0) {
    return false;
  }
  return true;
}

export function statusLabel(status: SupportSaleStatus): string {
  if (status === "active") return "Active";
  if (status === "ended") return "Terminée";
  return "Brouillon";
}

export function statusBadgeVariant(
  status: SupportSaleStatus
): "success" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "ended") return "neutral";
  return "warning";
}
