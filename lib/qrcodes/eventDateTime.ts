type LocaleCode = "fr" | "de" | "en";

function resolveLocaleTag(locale: LocaleCode): string {
  if (locale === "fr") return "fr-FR";
  if (locale === "de") return "de-DE";
  return "en-US";
}

export function normalizeEventTimeForInput(eventTime?: string | null): string {
  if (!eventTime) return "";
  return eventTime.slice(0, 5);
}

export function normalizeEventTimeForApi(eventTime?: string | null): string | null {
  const trimmed = eventTime?.trim();
  if (!trimmed) return null;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
}

export function formatEventDate(
  eventDate: string | null | undefined,
  locale: LocaleCode,
  options?: Intl.DateTimeFormatOptions
): string | null {
  if (!eventDate) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    ? new Date(`${eventDate}T12:00:00`)
    : new Date(eventDate);
  return date.toLocaleDateString(resolveLocaleTag(locale), options);
}

export function formatEventTime(
  eventTime: string | null | undefined,
  locale: LocaleCode
): string | null {
  if (!eventTime) return null;
  const [hours, minutes] = eventTime.split(":");
  const h = Number(hours);
  const m = Number(minutes);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(resolveLocaleTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEventDateTime(
  eventDate: string | null | undefined,
  eventTime: string | null | undefined,
  locale: LocaleCode,
  dateOptions?: Intl.DateTimeFormatOptions
): string | null {
  const date = formatEventDate(eventDate, locale, dateOptions);
  const time = formatEventTime(eventTime, locale);
  if (date && time) return `${date} · ${time}`;
  return date || time;
}
