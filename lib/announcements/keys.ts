const KEY_MAX_LENGTH = 80;
const KEYS_MAX_COUNT = 20;

export function parseAnnouncementKeysParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const key = part.trim();
    if (!key || key.length > KEY_MAX_LENGTH || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= KEYS_MAX_COUNT) break;
  }
  return out;
}

export function normalizeAnnouncementKeysFromBody(
  body: unknown,
  fallback: string
): string[] {
  if (!body || typeof body !== "object") return [fallback];
  const record = body as { key?: unknown; keys?: unknown };
  const collected: string[] = [];
  if (typeof record.key === "string") collected.push(record.key);
  if (Array.isArray(record.keys)) {
    for (const item of record.keys) {
      if (typeof item === "string") collected.push(item);
    }
  }
  const unique = parseAnnouncementKeysParam(collected.join(","));
  return unique.length > 0 ? unique : [fallback];
}
