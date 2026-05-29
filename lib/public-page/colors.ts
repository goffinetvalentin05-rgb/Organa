/** Couleur principale Obillz (alignée sur le dashboard). */
export const OBILLZ_BRAND_PRIMARY = "#1A23FF";

const HEX_PATTERN = /^#?([0-9A-Fa-f]{6})$/;

export function normalizeHexColor(
  value: string | null | undefined,
  fallback: string = OBILLZ_BRAND_PRIMARY
): string {
  const raw = String(value || "").trim();
  const match = raw.match(HEX_PATTERN);
  if (match) return `#${match[1]}`;
  const fb = fallback.match(HEX_PATTERN);
  return fb ? `#${fb[1]}` : OBILLZ_BRAND_PRIMARY;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = normalizeHexColor(hex).match(HEX_PATTERN);
  if (!match) return null;
  const n = match[1];
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function isLightColor(hex: string): boolean {
  return getRelativeLuminance(hex) > 0.62;
}

export function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return OBILLZ_BRAND_PRIMARY;
  const factor = 1 - Math.max(0, Math.min(1, amount));
  return `#${[rgb.r * factor, rgb.g * factor, rgb.b * factor]
    .map((c) => clampChannel(c).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#f8fafc";
  const factor = Math.max(0, Math.min(1, amount));
  return `#${[rgb.r + (255 - rgb.r) * factor, rgb.g + (255 - rgb.g) * factor, rgb.b + (255 - rgb.b) * factor]
    .map((c) => clampChannel(c).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getContrastTextColor(backgroundHex: string): "#ffffff" | "#0f172a" {
  return isLightColor(backgroundHex) ? "#0f172a" : "#ffffff";
}

export interface ClubBrandPalette {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentText: "#ffffff" | "#0f172a";
  headerText: "#ffffff" | "#0f172a";
  headerTextMuted: string;
  pageBackground: string;
  headerGradient: string;
}

export function getClubBrandPalette(primaryRaw: string | null | undefined): ClubBrandPalette {
  const primary = normalizeHexColor(primaryRaw);
  const primaryDark = darkenHex(primary, 0.28);
  const primarySoft = lightenHex(primary, 0.94);
  const accent = isLightColor(primary) ? darkenHex(primary, 0.38) : primary;
  const accentText = getContrastTextColor(accent);
  const headerText = getContrastTextColor(primary);
  const headerTextMuted =
    headerText === "#ffffff" ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.78)";

  return {
    primary,
    primaryDark,
    primarySoft,
    accent,
    accentText,
    headerText,
    headerTextMuted,
    pageBackground: `linear-gradient(180deg, ${primarySoft} 0%, #f8fafc 42%, #ffffff 100%)`,
    headerGradient: `linear-gradient(165deg, ${primary} 0%, ${primaryDark} 48%, #0f172a 100%)`,
  };
}
