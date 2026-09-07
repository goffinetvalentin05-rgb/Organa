import { getVisualTemplateMeta } from "./catalog";
import {
  deriveAccentFromPrimary,
  deriveSecondaryFromPrimary,
  normalizeHexColor,
} from "./colors";
import {
  DEFAULT_IMAGE_FIT,
  VISUAL_CATEGORIES,
  VISUAL_FORMATS,
  type VisualCategory,
  type VisualClubContext,
  type VisualData,
  type VisualFormat,
  type VisualImageFit,
} from "./types";

const MAX_TEXT = 120;
const MAX_EXTRA = 240;
const MAX_URL = 2000;

export const BASE_VISUAL_DATA: VisualData = {
  title: "",
  subtitle: "",
  competition: "",
  homeTeam: "",
  awayTeam: "",
  homeScore: "0",
  awayScore: "0",
  resultLabel: "",
  date: "",
  time: "",
  venue: "",
  extraText: "",
  primaryColor: "#1A23FF",
  secondaryColor: "#071634",
  accentColor: "#F8FAFC",
  textColor: "#FFFFFF",
  clubLogoUrl: null,
  opponentLogoUrl: null,
  eventLogoUrl: null,
  playerImageUrl: null,
  teamImageUrl: null,
  backgroundImageUrl: null,
  eventImageUrl: null,
  playerImageFit: { ...DEFAULT_IMAGE_FIT },
  teamImageFit: { ...DEFAULT_IMAGE_FIT },
  backgroundImageFit: { ...DEFAULT_IMAGE_FIT },
  eventImageFit: { ...DEFAULT_IMAGE_FIT },
};

export const TEMPLATE_DEFAULTS: Record<string, Partial<VisualData>> = {
  "match-poster-01": {
    title: "Prochain match",
    competition: "Championnat",
    homeTeam: "Domicile",
    awayTeam: "Extérieur",
    date: "Samedi 12 septembre",
    time: "20h00",
    venue: "Stade du club",
    primaryColor: "#1A23FF",
    secondaryColor: "#07101F",
    accentColor: "#F8FAFC",
    textColor: "#FFFFFF",
  },
  "match-result-01": {
    title: "Résultat",
    homeTeam: "Domicile",
    awayTeam: "Extérieur",
    homeScore: "2",
    awayScore: "0",
    resultLabel: "Victoire",
    primaryColor: "#1A23FF",
    secondaryColor: "#050816",
    accentColor: "#F8FAFC",
    textColor: "#FFFFFF",
  },
  "club-event-01": {
    title: "Soirée du club",
    subtitle: "Foot & grillades",
    date: "Samedi 20 septembre",
    time: "18h00",
    venue: "Maison du club",
    extraText: "Ouvert à tous les membres et supporters.",
    primaryColor: "#1A23FF",
    secondaryColor: "#0B1220",
    accentColor: "#F59E0B",
    textColor: "#FFFFFF",
  },
};

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s || s.length > MAX_URL) return null;
  if (s.startsWith("blob:") || s.startsWith("data:")) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

function sanitizeFit(value: unknown): VisualImageFit {
  const src = value && typeof value === "object" ? (value as VisualImageFit) : null;
  const y = Number(src?.objectPositionY);
  const scale = Number(src?.scale);
  return {
    objectPositionY: Number.isFinite(y) ? Math.max(0, Math.min(100, y)) : 50,
    scale: Number.isFinite(scale) ? Math.max(1, Math.min(1.45, scale)) : 1,
  };
}

export function mergeVisualData(
  ...parts: Array<Partial<VisualData> | null | undefined>
): VisualData {
  const out: VisualData = {
    ...BASE_VISUAL_DATA,
    playerImageFit: { ...DEFAULT_IMAGE_FIT },
    teamImageFit: { ...DEFAULT_IMAGE_FIT },
    backgroundImageFit: { ...DEFAULT_IMAGE_FIT },
    eventImageFit: { ...DEFAULT_IMAGE_FIT },
  };
  for (const part of parts) {
    if (!part) continue;
    Object.assign(out, part);
    if (part.playerImageFit) out.playerImageFit = { ...out.playerImageFit, ...part.playerImageFit };
    if (part.teamImageFit) out.teamImageFit = { ...out.teamImageFit, ...part.teamImageFit };
    if (part.backgroundImageFit) {
      out.backgroundImageFit = { ...out.backgroundImageFit, ...part.backgroundImageFit };
    }
    if (part.eventImageFit) out.eventImageFit = { ...out.eventImageFit, ...part.eventImageFit };
  }
  return out;
}

export function applyClubContext(
  data: VisualData,
  club: VisualClubContext | null | undefined,
  options: { overwriteTeams?: boolean } = {}
): VisualData {
  if (!club) return data;
  const next = { ...data };
  if (club.clubName) {
    if (options.overwriteTeams || !next.homeTeam || next.homeTeam === "Domicile") {
      next.homeTeam = club.clubName;
    }
  }
  if (club.logoUrl && !next.clubLogoUrl) {
    next.clubLogoUrl = club.logoUrl;
  }
  const primary = normalizeHexColor(club.primaryColor);
  if (primary) {
    next.primaryColor = primary;
    next.secondaryColor = deriveSecondaryFromPrimary(primary);
    next.accentColor = deriveAccentFromPrimary(primary);
  }
  if (club.venue && (!next.venue || next.venue === "Stade du club" || next.venue === "Maison du club")) {
    next.venue = club.venue;
  }
  return next;
}

export function buildNewVisualData(
  templateId: string,
  club: VisualClubContext | null
): VisualData {
  return applyClubContext(
    mergeVisualData(BASE_VISUAL_DATA, TEMPLATE_DEFAULTS[templateId]),
    club,
    { overwriteTeams: true }
  );
}

export function sanitizeVisualData(input: unknown): VisualData {
  const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const primary =
    normalizeHexColor(src.primaryColor) ?? BASE_VISUAL_DATA.primaryColor;
  return {
    title: clip(src.title, MAX_TEXT),
    subtitle: clip(src.subtitle, MAX_TEXT),
    competition: clip(src.competition, MAX_TEXT),
    homeTeam: clip(src.homeTeam, MAX_TEXT),
    awayTeam: clip(src.awayTeam, MAX_TEXT),
    homeScore: clip(src.homeScore, 4) || "0",
    awayScore: clip(src.awayScore, 4) || "0",
    resultLabel: clip(src.resultLabel, 40),
    date: clip(src.date, MAX_TEXT),
    time: clip(src.time, 40),
    venue: clip(src.venue, MAX_TEXT),
    extraText: clip(src.extraText, MAX_EXTRA),
    primaryColor: primary,
    secondaryColor:
      normalizeHexColor(src.secondaryColor) ?? deriveSecondaryFromPrimary(primary),
    accentColor: normalizeHexColor(src.accentColor) ?? BASE_VISUAL_DATA.accentColor,
    textColor: normalizeHexColor(src.textColor) ?? BASE_VISUAL_DATA.textColor,
    clubLogoUrl: sanitizeUrl(src.clubLogoUrl),
    opponentLogoUrl: sanitizeUrl(src.opponentLogoUrl),
    eventLogoUrl: sanitizeUrl(src.eventLogoUrl),
    playerImageUrl: sanitizeUrl(src.playerImageUrl),
    teamImageUrl: sanitizeUrl(src.teamImageUrl),
    backgroundImageUrl: sanitizeUrl(src.backgroundImageUrl),
    eventImageUrl: sanitizeUrl(src.eventImageUrl),
    playerImageFit: sanitizeFit(src.playerImageFit),
    teamImageFit: sanitizeFit(src.teamImageFit),
    backgroundImageFit: sanitizeFit(src.backgroundImageFit),
    eventImageFit: sanitizeFit(src.eventImageFit),
  };
}

export function parseVisualFormat(value: unknown): VisualFormat | null {
  if (typeof value !== "string") return null;
  return VISUAL_FORMATS.includes(value as VisualFormat)
    ? (value as VisualFormat)
    : null;
}

export function parseVisualCategory(value: unknown): VisualCategory | null {
  if (typeof value !== "string") return null;
  return VISUAL_CATEGORIES.includes(value as VisualCategory)
    ? (value as VisualCategory)
    : null;
}

export function slugifyVisualPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function visualDownloadFilename(input: {
  templateId: string;
  data: VisualData;
}): string {
  const meta = getVisualTemplateMeta(input.templateId);
  const category = meta?.category ?? "visual";
  if (category === "club_event") {
    const title = slugifyVisualPart(input.data.title) || "evenement";
    return `obillz-evenement-${title}.png`;
  }
  const home = slugifyVisualPart(input.data.homeTeam) || "domicile";
  const away = slugifyVisualPart(input.data.awayTeam) || "exterieur";
  const kind = category === "match_result" ? "resultat" : "match";
  return `obillz-${kind}-${home}-vs-${away}.png`;
}

export function defaultVisualTitle(templateId: string, data: VisualData): string {
  if (data.title.trim()) return data.title.trim().slice(0, MAX_TEXT);
  const meta = getVisualTemplateMeta(templateId);
  if (meta?.category === "club_event") return "Événement du club";
  if (data.homeTeam && data.awayTeam) return `${data.homeTeam} vs ${data.awayTeam}`;
  return meta?.name ?? "Visuel";
}
