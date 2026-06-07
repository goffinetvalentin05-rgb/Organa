import { shiftIsoDateByCalendarDays } from "@/lib/planning/isoCalendarDate";

/** Normalise une heure créneau en HH:mm:ss pour comparaison. */
export function normalizeSlotTimeHm(time: string): string {
  const s = time.trim();
  if (s.length >= 8) return s.slice(0, 8);
  if (s.length === 5) return `${s}:00`;
  return s;
}

export function compareSlotTimes(a: string, b: string): number {
  return normalizeSlotTimeHm(a).localeCompare(normalizeSlotTimeHm(b));
}

/** Créneau dont la fin est le lendemain (ex. 23:00 → 01:00). */
export function isOvernightSlot(startTime: string, endTime: string): boolean {
  return compareSlotTimes(startTime, endTime) > 0;
}

export function isValidSlotTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime?.trim() || !endTime?.trim()) return false;
  return compareSlotTimes(startTime, endTime) !== 0;
}

export function getSlotTimeRangeError(startTime: string, endTime: string): string | null {
  if (!startTime?.trim() || !endTime?.trim()) {
    return "Les heures de début et fin sont requises";
  }
  if (compareSlotTimes(startTime, endTime) === 0) {
    return "L'heure de fin doit être différente de l'heure de début";
  }
  return null;
}

/** Date calendaire de fin (lendemain si le créneau passe après minuit). */
export function getSlotEndDateYmd(
  slotDateYmd: string,
  startTime: string,
  endTime: string
): string {
  if (isOvernightSlot(startTime, endTime)) {
    return shiftIsoDateByCalendarDays(slotDateYmd, 1);
  }
  return slotDateYmd;
}
