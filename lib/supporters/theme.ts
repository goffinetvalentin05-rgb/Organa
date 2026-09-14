import type { CSSProperties } from "react";
import {
  darkenHex,
  getClubBrandPalette,
  getContrastTextColor,
  isLightColor,
  type ClubBrandPalette,
} from "@/lib/public-page/colors";
import type {
  PublicSupportersTheme,
  SupportersImagePosition,
  SupportersOverlayIntensity,
  SupportersPageStyle,
} from "./types";

export function supportersPalette(theme: Pick<PublicSupportersTheme, "primaryColor" | "secondaryColor">) {
  return getClubBrandPalette(theme.primaryColor, theme.secondaryColor);
}

export function effectivePageStyle(
  style: SupportersPageStyle,
  bannerUrl: string | null
): SupportersPageStyle {
  if ((style === "banner" || style === "fullscreen") && !bannerUrl) return "colors";
  return style;
}

export function imageObjectPosition(position: SupportersImagePosition): string {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  return "center center";
}

export function heroTextColors(primaryColor: string, style: SupportersPageStyle) {
  const darkText = style === "colors" && isLightColor(primaryColor);
  return {
    text: darkText ? "#0f172a" : "#ffffff",
    muted: darkText ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)",
    faint: darkText ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.7)",
    onDark: !darkText,
  };
}

export function ctaColors(primaryHex: string, secondaryHex?: string) {
  let background = primaryHex;
  if (isLightColor(primaryHex)) {
    background =
      secondaryHex && !isLightColor(secondaryHex) ? secondaryHex : darkenHex(primaryHex, 0.48);
  }
  return {
    background,
    color: getContrastTextColor(background),
  };
}

export function clubColorsHeroStyle(primary: string, secondary: string): CSSProperties {
  const deep = darkenHex(secondary, 0.22);
  return {
    background: `linear-gradient(160deg, ${primary} 0%, ${secondary} 55%, ${deep} 100%)`,
  };
}

export function bannerOverlay(
  primary: string,
  secondary: string,
  intensity: SupportersOverlayIntensity
): string {
  if (intensity === "light") {
    return `linear-gradient(180deg, ${primary}55 0%, ${secondary}77 46%, #0b1220c4 100%)`;
  }
  if (intensity === "dark") {
    return `linear-gradient(185deg, ${primary}99 0%, #0b1220f2 100%)`;
  }
  return `linear-gradient(180deg, ${primary}88 0%, ${secondary}aa 48%, #0b1220ee 100%)`;
}

export function fullscreenOverlay(
  primary: string,
  intensity: SupportersOverlayIntensity
): string {
  if (intensity === "light") {
    return `linear-gradient(180deg, rgba(11,18,32,0.32) 0%, ${primary}40 42%, rgba(11,18,32,0.58) 100%)`;
  }
  if (intensity === "dark") {
    return `linear-gradient(180deg, rgba(11,18,32,0.58) 0%, ${primary}66 40%, rgba(11,18,32,0.86) 100%)`;
  }
  return `linear-gradient(180deg, rgba(11,18,32,0.45) 0%, ${primary}55 44%, rgba(11,18,32,0.76) 100%)`;
}

export function pageSurfaceStyle(palette: ClubBrandPalette, immersive: boolean): CSSProperties {
  if (immersive) {
    return { background: "transparent" };
  }
  return { background: palette.pageBackground };
}
