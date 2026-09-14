import type { CSSProperties } from "react";
import {
  getClubBrandPalette,
  getContrastTextColor,
  isLightColor,
  type ClubBrandPalette,
} from "@/lib/public-page/colors";
import type { PublicSupportersTheme, SupportersBackgroundMode } from "./types";

export function supportersPalette(theme: Pick<PublicSupportersTheme, "primaryColor" | "secondaryColor">) {
  return getClubBrandPalette(theme.primaryColor, theme.secondaryColor);
}

export function heroUsesDarkText(
  primaryColor: string,
  backgroundMode: SupportersBackgroundMode,
  hasBanner: boolean
): boolean {
  if (hasBanner || backgroundMode === "image") return false;
  if (backgroundMode === "solid") return isLightColor(primaryColor);
  return isLightColor(primaryColor);
}

export function heroTextColors(
  primaryColor: string,
  backgroundMode: SupportersBackgroundMode,
  hasBanner: boolean
) {
  const dark = heroUsesDarkText(primaryColor, backgroundMode, hasBanner);
  return {
    text: dark ? "#0f172a" : "#ffffff",
    muted: dark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.86)",
    faint: dark ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.68)",
    onDark: !dark,
  };
}

export function ctaColors(backgroundHex: string) {
  return {
    background: backgroundHex,
    color: getContrastTextColor(backgroundHex),
  };
}

export function pageSurfaceStyle(
  palette: ClubBrandPalette,
  bgImageUrl: string | null
): CSSProperties {
  if (bgImageUrl) {
    return {
      backgroundColor: "#0b1220",
      backgroundImage: `linear-gradient(180deg, rgba(248,250,252,0.94) 0%, rgba(255,255,255,0.97) 100%), url("${bgImageUrl}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "scroll",
    };
  }
  return { background: palette.pageBackground };
}
