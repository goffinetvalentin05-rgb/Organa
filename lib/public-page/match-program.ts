import type { MatchProgramType, PublicPageSettings } from "./types";

export const MATCH_PROGRAM_BUCKET = "club-public";

export function buildMatchProgramStoragePath(clubId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return `${clubId}/match-program/${Date.now()}-${safeName}`;
}

export function getMatchProgramPdfPublicUrl(
  supabaseUrl: string,
  pdfPath: string | null
): string | null {
  if (!pdfPath?.trim() || !supabaseUrl) return null;
  const base = supabaseUrl.replace(/\/$/, "");
  const encoded = pdfPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${MATCH_PROGRAM_BUCKET}/${encoded}`;
}

export function isMatchProgramConfigured(settings: {
  showMatchProgram: boolean;
  matchProgramType: MatchProgramType | null;
  matchProgramUrl: string | null;
  matchProgramPdfPath: string | null;
}): boolean {
  if (!settings.showMatchProgram) return false;
  if (settings.matchProgramType === "external_url") {
    return Boolean(settings.matchProgramUrl?.trim());
  }
  if (settings.matchProgramType === "pdf") {
    return Boolean(settings.matchProgramPdfPath?.trim());
  }
  return false;
}

export function resolveMatchProgramPublicHref(settings: PublicPageSettings): string | null {
  if (!isMatchProgramConfigured(settings)) return null;
  if (settings.matchProgramType === "external_url" && settings.matchProgramUrl) {
    return settings.matchProgramUrl;
  }
  if (settings.matchProgramType === "pdf" && settings.matchProgramPdfUrl) {
    return settings.matchProgramPdfUrl;
  }
  return null;
}
