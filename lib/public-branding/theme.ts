import type { CSSProperties } from "react";
import {
  darkenHex,
  getClubBrandPalette,
  getContrastTextColor,
  isLightColor,
  type ClubBrandPalette,
} from "@/lib/public-page/colors";
import type {
  PublicImagePosition,
  PublicOverlayIntensity,
  PublicPageStyle,
  PublicVisualTheme,
} from "./types";

export function brandPalette(theme: Pick<PublicVisualTheme, "primaryColor" | "secondaryColor">) {
  return getClubBrandPalette(theme.primaryColor, theme.secondaryColor);
}

export function effectivePageStyle(
  style: PublicPageStyle,
  bannerUrl: string | null
): PublicPageStyle {
  if ((style === "banner" || style === "fullscreen") && !bannerUrl) return "colors";
  return style;
}

export function imageObjectPosition(position: PublicImagePosition): string {
  if (position === "top") return "center top";
  if (position === "bottom") return "center bottom";
  return "center center";
}

export function heroTextColors(primaryColor: string, style: PublicPageStyle) {
  const darkText = style === "colors" && isLightColor(primaryColor);
  return {
    text: darkText ? "#0f172a" : "#ffffff",
    muted: darkText ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)",
    faint: darkText ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.7)",
    onDark: !darkText,
  };
}

export function ctaColors(primaryHex: string, secondaryHex?: string, accentHex?: string) {
  const preferred =
    accentHex && !isLightColor(accentHex)
      ? accentHex
      : primaryHex;
  let background = preferred;
  if (isLightColor(preferred)) {
    background =
      secondaryHex && !isLightColor(secondaryHex) ? secondaryHex : darkenHex(preferred, 0.48);
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
  intensity: PublicOverlayIntensity
): string {
  if (intensity === "light") {
    return `linear-gradient(180deg, ${primary}55 0%, ${secondary}77 46%, #0b1220c4 100%)`;
  }
  if (intensity === "dark") {
    return `linear-gradient(185deg, ${primary}99 0%, #0b1220f2 100%)`;
  }
  return `linear-gradient(180deg, ${primary}88 0%, ${secondary}aa 48%, #0b1220ee 100%)`;
}

export function fullscreenOverlay(primary: string, intensity: PublicOverlayIntensity): string {
  if (intensity === "light") {
    return `linear-gradient(180deg, rgba(11,18,32,0.32) 0%, ${primary}40 42%, rgba(11,18,32,0.58) 100%)`;
  }
  if (intensity === "dark") {
    return `linear-gradient(180deg, rgba(11,18,32,0.58) 0%, ${primary}66 40%, rgba(11,18,32,0.86) 100%)`;
  }
  return `linear-gradient(180deg, rgba(11,18,32,0.45) 0%, ${primary}55 44%, rgba(11,18,32,0.76) 100%)`;
}

export function pageSurfaceStyle(palette: ClubBrandPalette, immersive: boolean): CSSProperties {
  if (immersive) return { background: "transparent" };
  return { background: palette.pageBackground };
}

export function productGridClass(): string {
  return "flex flex-wrap justify-center gap-3 sm:gap-5";
}

export function productCardClass(count: number): string {
  if (count <= 1) return "w-full max-w-sm";
  if (count === 2) return "w-full max-w-sm sm:w-[calc(50%-0.625rem)]";
  if (count === 3) return "w-full max-w-sm sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.875rem)]";
  return "w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.875rem)] lg:w-[calc(25%-1.125rem)]";
}

export function publicSurfaceClass(immersive: boolean): string {
  return immersive
    ? "border border-white/25 bg-white/92 shadow-[0_8px_30px_rgba(15,23,42,0.16)] backdrop-blur-[8px]"
    : "border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.07)]";
}

export const shopSurfaceClass = publicSurfaceClass;

export function resolvedBrandColors(
  primaryColor: string,
  secondaryColor?: string | null,
  accentColor?: string | null
) {
  const primary = primaryColor;
  const secondary = validateHex(secondaryColor) || darkenHex(primary, 0.32);
  const accent = validateHex(accentColor) || primary;
  return { primary, secondary, accent };
}

function validateHex(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : null;
}

export function resolvePublicLayout(theme: PublicVisualTheme) {
  const style = effectivePageStyle(theme.pageStyle, theme.bannerUrl);
  const immersive = style === "fullscreen";
  const palette = brandPalette(theme);
  return {
    style,
    immersive,
    palette,
    heroText: heroTextColors(theme.primaryColor, style),
    cta: ctaColors(theme.primaryColor, theme.secondaryColor, theme.accentColor),
    objectPosition: imageObjectPosition(theme.imagePosition),
    surfaceClass: publicSurfaceClass(immersive),
  };
}
