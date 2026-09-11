const TOKEN_PATHS: Array<{ prefix: string; replacement: string }> = [
  { prefix: "/cotisation/", replacement: "/cotisation/[token]" },
  { prefix: "/invitations/", replacement: "/invitations/[token]" },
  { prefix: "/desinscription/", replacement: "/desinscription/[token]" },
];

function redactPathname(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  for (const { prefix, replacement } of TOKEN_PATHS) {
    if (path === prefix.slice(0, -1) || path === prefix) {
      return replacement;
    }
    if (path.startsWith(prefix)) {
      const rest = path.slice(prefix.length);
      const slash = rest.indexOf("/");
      const tail = slash >= 0 ? rest.slice(slash) : "";
      return `${replacement}${tail}`;
    }
  }
  return path;
}

/**
 * Retourne un chemin Analytics sans secret (token d’URL).
 * Ex. /cotisation/abc123/succes → /cotisation/[token]/succes
 */
export function redactAnalyticsPath(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url, "https://obillz.invalid");
    const path = redactPathname(parsed.pathname);
    if (/^https?:\/\//i.test(url)) {
      return `${parsed.origin}${path}`;
    }
    return path;
  } catch {
    const q = url.indexOf("?");
    const h = url.indexOf("#");
    let path = url;
    if (q >= 0) path = path.slice(0, q);
    if (h >= 0) path = path.slice(0, h);
    return redactPathname(path);
  }
}

export function redactAnalyticsEvent<T extends { url?: string }>(
  event: T
): T {
  if (!event?.url) return event;
  return { ...event, url: redactAnalyticsPath(event.url) };
}
