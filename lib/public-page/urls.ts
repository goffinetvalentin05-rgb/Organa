const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

export function normalizeAndValidatePublicUrl(
  raw: string,
  options?: { allowMailto?: boolean }
): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = String(raw || "").trim();
  if (!trimmed) {
    return { ok: false, error: "URL requise" };
  }

  if (BLOCKED_PROTOCOLS.test(trimmed)) {
    return { ok: false, error: "Protocole non autorisé" };
  }

  if (options?.allowMailto && trimmed.toLowerCase().startsWith("mailto:")) {
    const emailPart = trimmed.slice(7).split("?")[0];
    if (!emailPart.includes("@")) {
      return { ok: false, error: "Adresse e-mail invalide" };
    }
    return { ok: true, url: trimmed };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "URL invalide" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Seuls les liens http(s) sont autorisés" };
  }

  if (!parsed.hostname) {
    return { ok: false, error: "URL invalide" };
  }

  return { ok: true, url: parsed.toString() };
}

export function normalizePublicPathUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return `/${trimmed}`;
  return trimmed;
}
