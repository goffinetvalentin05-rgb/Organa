import { describe, expect, it } from "vitest";
import {
  NEVER_AUTO_PURGED_TABLES,
  shouldDeactivatePlanningToken,
  shouldDeleteAuditLog,
  shouldDeleteCancelledInvitation,
  shouldDeleteExpiredInvitation,
  shouldDeleteIdempotencyKey,
  shouldDeletePlanningTokenAfterEvent,
  shouldPurgeSoftDeletedSafe,
} from "@/lib/retention/policy";

const now = new Date("2026-09-11T12:00:00.000Z");

function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
}

describe("politique de purge opérationnelle", () => {
  it("invitation expirée > 90 j : suppression", () => {
    expect(shouldDeleteExpiredInvitation("expired", daysAgo(91), now)).toBe(true);
  });

  it("invitation expirée récente : conservation", () => {
    expect(shouldDeleteExpiredInvitation("expired", daysAgo(10), now)).toBe(false);
    expect(shouldDeleteExpiredInvitation("pending", daysAgo(200), now)).toBe(false);
  });

  it("invitation annulée > 90 j : suppression", () => {
    expect(shouldDeleteCancelledInvitation("cancelled", daysAgo(91), now)).toBe(true);
    expect(shouldDeleteCancelledInvitation("cancelled", daysAgo(5), now)).toBe(false);
  });

  it("idempotency > 30 j : suppression ; récente : conservation", () => {
    expect(shouldDeleteIdempotencyKey(daysAgo(31), now)).toBe(true);
    expect(shouldDeleteIdempotencyKey(daysAgo(10), now)).toBe(false);
  });

  it("audit > 12 mois : suppression ; récent : conservation", () => {
    expect(shouldDeleteAuditLog(daysAgo(400), now)).toBe(true);
    expect(shouldDeleteAuditLog(daysAgo(30), now)).toBe(false);
  });

  it("soft-deleted sûr > 30 j ; non supprimé : conservation", () => {
    expect(shouldPurgeSoftDeletedSafe(daysAgo(31), now)).toBe(true);
    expect(shouldPurgeSoftDeletedSafe(daysAgo(5), now)).toBe(false);
    expect(shouldPurgeSoftDeletedSafe(null, now)).toBe(false);
  });

  it("token planning : désactivation après l’événement, suppression 90 j après", () => {
    expect(shouldDeactivatePlanningToken(daysAgo(1), now)).toBe(true);
    expect(shouldDeactivatePlanningToken(now, now)).toBe(false);
    expect(shouldDeletePlanningTokenAfterEvent(daysAgo(91), now)).toBe(true);
    expect(shouldDeletePlanningTokenAfterEvent(daysAgo(10), now)).toBe(false);
  });

  it("ne liste pas de purge auto comptable", () => {
    expect(NEVER_AUTO_PURGED_TABLES).toContain("documents");
    expect(NEVER_AUTO_PURGED_TABLES).toContain("clients");
    expect(NEVER_AUTO_PURGED_TABLES).toContain("shop_orders");
    expect(NEVER_AUTO_PURGED_TABLES).toContain("club_revenues");
  });
});
