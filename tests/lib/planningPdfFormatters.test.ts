import { describe, it, expect } from "vitest";
import {
  formatPlanningPdfLongFr,
  formatPlanningPdfSlotDateShort,
  formatPlanningPdfTime,
} from "@/lib/pdf/planningPdfFormatters";

describe("planningPdfFormatters — PDF / slot_date", () => {
  it("affiche « — » si slotDate manquante (ne pas retomber sur la date générale ici)", () => {
    expect(formatPlanningPdfSlotDateShort(undefined)).toBe("—");
    expect(formatPlanningPdfSlotDateShort("")).toBe("—");
  });

  it("formate chaque slot_date de façon stable pour des jours différents", () => {
    const a = formatPlanningPdfSlotDateShort("2026-06-12");
    const b = formatPlanningPdfSlotDateShort("2026-07-01");
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(3);
    expect(b.length).toBeGreaterThan(3);
  });

  it("l’en-tête utilise la date générale (planning.date) via formatPlanningPdfLongFr", () => {
    const h = formatPlanningPdfLongFr("2026-06-12");
    expect(h).toContain("2026");
    expect(h).not.toBe("—");
  });

  it("tronque les heures HH:MM:SS pour le PDF", () => {
    expect(formatPlanningPdfTime("09:30:00")).toBe("09:30");
    expect(formatPlanningPdfTime("14:05")).toBe("14:05");
  });
});
