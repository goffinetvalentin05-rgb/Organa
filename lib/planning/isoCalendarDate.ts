/**
 * Manipulation de dates calendaires au format ISO YYYY-MM-DD (UTC, sans heure).
 */

export function isValidIsoDateOnly(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function calendarDayDeltaIso(oldIso: string, newIso: string): number {
  const parse = (iso: string) => {
    const [y, m, d] = iso.trim().split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(newIso) - parse(oldIso)) / 86400000);
}

export function shiftIsoDateByCalendarDays(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.trim().split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
