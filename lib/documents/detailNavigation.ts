export function documentIdFromRoute(param: unknown, pathname: string | null, folder: string): string {
  const fromParam = typeof param === "string"
    ? param
    : Array.isArray(param) && typeof param[0] === "string"
      ? param[0]
      : "";
  const raw = fromParam || segmentAfter(pathname, folder);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function segmentAfter(pathname: string | null, folder: string): string {
  if (!pathname) return "";
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.lastIndexOf(folder);
  const next = index >= 0 ? parts[index + 1] || "" : "";
  if (!next || next === "nouveau" || next === "nouvelle") return "";
  return next;
}

export function documentDetailFailure(input: {
  ok: boolean;
  document: { type?: string | null } | null;
  expectedType: "quote" | "invoice";
  error?: string | null;
  fallback: string;
}): string | null {
  if (!input.ok || !input.document) return input.error?.trim() || input.fallback;
  if (input.document.type !== input.expectedType) {
    return input.expectedType === "quote"
      ? "Ce document n’est pas une cotisation."
      : "Ce document n’est pas une facture.";
  }
  return null;
}
