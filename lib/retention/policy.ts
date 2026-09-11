/** Durées réellement appliquées par `purge_operational_data()`. */

export const RETENTION_DAYS = {
  invitationsAfterExpiry: 90,
  idempotencyKeys: 30,
  auditLogsMonths: 12,
  softDeletedSafe: 30,
  planningTokensAfterEvent: 90,
} as const;

const MS_DAY = 24 * 60 * 60 * 1000;

function daysBetween(then: Date, now: Date): number {
  return (now.getTime() - then.getTime()) / MS_DAY;
}

export function shouldDeleteExpiredInvitation(
  status: string,
  expiresAt: Date,
  now: Date
): boolean {
  return status === "expired" && daysBetween(expiresAt, now) > RETENTION_DAYS.invitationsAfterExpiry;
}

export function shouldDeleteCancelledInvitation(
  status: string,
  cancelledAt: Date | null,
  now: Date
): boolean {
  if (status !== "cancelled" || !cancelledAt) return false;
  return daysBetween(cancelledAt, now) > RETENTION_DAYS.invitationsAfterExpiry;
}

export function shouldDeleteIdempotencyKey(createdAt: Date, now: Date): boolean {
  return daysBetween(createdAt, now) > RETENTION_DAYS.idempotencyKeys;
}

export function shouldDeleteAuditLog(createdAt: Date, now: Date): boolean {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - RETENTION_DAYS.auditLogsMonths);
  return createdAt < cutoff;
}

export function shouldPurgeSoftDeletedSafe(deletedAt: Date | null, now: Date): boolean {
  if (!deletedAt) return false;
  return daysBetween(deletedAt, now) > RETENTION_DAYS.softDeletedSafe;
}

export function shouldDeactivatePlanningToken(planningDate: Date, now: Date): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const event = new Date(
    planningDate.getFullYear(),
    planningDate.getMonth(),
    planningDate.getDate()
  );
  return event < today;
}

export function shouldDeletePlanningTokenAfterEvent(planningDate: Date, now: Date): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS.planningTokensAfterEvent);
  const event = new Date(
    planningDate.getFullYear(),
    planningDate.getMonth(),
    planningDate.getDate()
  );
  return event < cutoff;
}

/** Catégories jamais purgées par le job automatique. */
export const NEVER_AUTO_PURGED_TABLES = [
  "documents",
  "clients",
  "shop_orders",
  "shop_products",
  "shop_order_items",
  "expenses",
  "depenses",
  "club_revenues",
  "profiles",
  "registrations",
  "marketing_contacts",
  "marketing_campaigns",
] as const;
