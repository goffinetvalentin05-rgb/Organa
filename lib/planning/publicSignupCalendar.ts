import { parseWallClockInEuropeZurich } from "@/lib/planning/zurichWallTime";

/** Bloc VTIMEZONE Europe/Zurich (règles fin XXe → aujourd’hui, usage courant ICS). */
export const ICAL_VTIMEZONE_EUROPE_ZURICH = `BEGIN:VTIMEZONE
TZID:Europe/Zurich
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19810329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19961027T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE`;

export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldIcsLine(line: string): string {
  if (line.length <= 73) return line;
  let out = "";
  let rest = line;
  while (rest.length > 73) {
    out += `${rest.slice(0, 73)}\r\n `;
    rest = rest.slice(73);
  }
  return out + rest;
}

function formatIcsDateTimeZurich(dateYmd: string, timeHm: string): string {
  const t = timeHm.length >= 8 ? timeHm.slice(0, 8) : `${timeHm.slice(0, 5)}:00`;
  const [hh, mm, ss] = t.split(":").map((x) => x.padStart(2, "0"));
  const compact = `${dateYmd.replace(/-/g, "")}T${hh}${mm}${ss}`;
  return compact;
}

export function buildGoogleCalendarUrl(input: {
  title: string;
  description: string;
  location?: string;
  dateYmd: string;
  startTimeHm: string;
  endTimeHm: string;
}): string {
  const start = parseWallClockInEuropeZurich(input.dateYmd, normalizeHms(input.startTimeHm));
  const end = parseWallClockInEuropeZurich(input.dateYmd, normalizeHms(input.endTimeHm));
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const dates = `${fmt(start)}/${fmt(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates,
    details: input.description,
  });
  if (input.location?.trim()) params.set("location", input.location.trim());
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function normalizeHms(hm: string): string {
  const s = hm.trim();
  if (s.length >= 8) return s.slice(0, 8);
  if (s.length === 5) return `${s}:00`;
  return `${s.slice(0, 5)}:00`;
}

export function buildPublicPlanningSignupIcs(input: {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  dateYmd: string;
  startTimeHm: string;
  endTimeHm: string;
}): string {
  const dtStart = formatIcsDateTimeZurich(input.dateYmd, input.startTimeHm);
  const dtEnd = formatIcsDateTimeZurich(input.dateYmd, input.endTimeHm);
  const dtStamp = (() => {
    const d = new Date();
    return d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  })();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Obillz//Planning public//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ICAL_VTIMEZONE_EUROPE_ZURICH,
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(input.uid)}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Europe/Zurich:${dtStart}`,
    `DTEND;TZID=Europe/Zurich:${dtEnd}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(input.summary)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(input.description)}`),
  ];
  if (input.location?.trim()) {
    lines.push(foldIcsLine(`LOCATION:${escapeIcsText(input.location.trim())}`));
  }
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n") + "\r\n";
}
