import { darkenHex, normalizeHexColor, OBILLZ_BRAND_PRIMARY } from "./colors";
import {
  parseImagePosition,
  parseOverlayIntensity,
  parsePageStyle,
  trimOrNull,
  validateHexColor,
} from "@/lib/public-branding/parse";
import type { PublicVisualTheme } from "@/lib/public-branding/types";
import type { PublicPageSettings } from "./types";

export const DEFAULT_PUBLIC_PAGE_LABEL = "Club";
export const DEFAULT_PUBLIC_PAGE_SUBTITLE =
  "Bienvenue sur la page officielle du club.";

export const PUBLIC_PAGE_BRANDING_MIGRATION_HINT =
  "Les colonnes de personnalisation de la page publique sont absentes. Appliquez la migration 085_public_page_styles.sql.";

export function resolvedPublicPageCopy(settings: {
  clubName: string;
  label: string | null | undefined;
  title: string | null | undefined;
  description: string | null | undefined;
}) {
  const clubName = settings.clubName.trim() || "Club";
  return {
    label: settings.label?.trim() || DEFAULT_PUBLIC_PAGE_LABEL,
    title: settings.title?.trim() || clubName,
    subtitle: settings.description?.trim() || "",
  };
}

export function buildPublicClubTheme(
  settings: Pick<
    PublicPageSettings,
    | "title"
    | "description"
    | "primaryColor"
    | "label"
    | "secondaryColor"
    | "accentColor"
    | "pageStyle"
    | "imagePosition"
    | "overlayIntensity"
    | "bannerUrl"
  > & { clubName?: string }
): PublicVisualTheme {
  const copy = resolvedPublicPageCopy({
    clubName: settings.clubName || settings.title || "Club",
    label: settings.label,
    title: settings.title,
    description: settings.description,
  });
  const primary = normalizeHexColor(settings.primaryColor, OBILLZ_BRAND_PRIMARY);
  const secondary = validateHexColor(settings.secondaryColor) || darkenHex(primary, 0.32);
  const accent = validateHexColor(settings.accentColor) || primary;

  return {
    label: copy.label,
    title: copy.title,
    subtitle: copy.subtitle,
    introText: null,
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accent,
    pageStyle: parsePageStyle(settings.pageStyle),
    imagePosition: parseImagePosition(settings.imagePosition),
    overlayIntensity: parseOverlayIntensity(settings.overlayIntensity),
    bannerUrl: trimOrNull(settings.bannerUrl),
  };
}
