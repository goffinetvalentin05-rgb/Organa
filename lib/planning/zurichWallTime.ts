/**
 * Interprète une date et une heure « murales » en Europe/Zurich
 * et retourne l’instant UTC correspondant (sans dépendance date-fns).
 */
const ZONE = "Europe/Zurich";

function wallParts(utcMs: number) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = f.formatToParts(new Date(utcMs));
  const o: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") o[p.type] = Number(p.value);
  }
  return { y: o.year, mo: o.month, d: o.day, h: o.hour, mi: o.minute, s: o.second };
}

function compareWall(
  w: ReturnType<typeof wallParts>,
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  se: number
) {
  if (w.y !== y) return w.y - y;
  if (w.mo !== mo) return w.mo - mo;
  if (w.d !== d) return w.d - d;
  if (w.h !== h) return w.h - h;
  if (w.mi !== mi) return w.mi - mi;
  return w.s - se;
}

export function parseWallClockInEuropeZurich(dateYmd: string, timeHms: string): Date {
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const parts = timeHms.split(":").map((x) => Number(x));
  const h = parts[0] ?? 0;
  const mi = parts[1] ?? 0;
  const se = parts[2] ?? 0;

  const anchor = Date.UTC(y, mo - 1, d, 12, 0, 0);
  const start = anchor - 14 * 3600 * 1000;
  const end = anchor + 14 * 3600 * 1000;
  for (let ms = start; ms <= end; ms += 1000) {
    if (compareWall(wallParts(ms), y, mo, d, h, mi, se) === 0) {
      return new Date(ms);
    }
  }

  return new Date(anchor);
}
