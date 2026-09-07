export const MEMBERSHIP_PAYMENT_METHODS = ["qr_invoice", "stripe"] as const;
export type MembershipPaymentMethod = (typeof MEMBERSHIP_PAYMENT_METHODS)[number];

export const MEMBERSHIP_STRIPE_PURPOSE = "club_membership";

export function parseMembershipPaymentMethod(
  value: unknown
): MembershipPaymentMethod | null {
  if (value === "qr_invoice" || value === "stripe") return value;
  return null;
}

export function resolveMembershipPaymentMethod(
  value: unknown
): MembershipPaymentMethod {
  return parseMembershipPaymentMethod(value) ?? "qr_invoice";
}

export function francsToStripeCents(amount: unknown): number | null {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function membershipPaymentLabel(
  method: MembershipPaymentMethod | null | undefined
): { short: string; detail: string } {
  if (method === "stripe") {
    return {
      short: "Paiement en ligne",
      detail: "Paiement en ligne via Stripe",
    };
  }
  return {
    short: "QR-facture",
    detail: "QR-facture suisse",
  };
}
