import { darkenHex, normalizeHexColor, OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";
import {
  parseImagePosition,
  parseOverlayIntensity,
  parsePageStyle,
  trimOrNull,
  validateHexColor,
} from "@/lib/public-branding/parse";
import type { PublicVisualTheme } from "@/lib/public-branding/types";
import type { SupportSaleRow } from "./types";

export const DEFAULT_SUPPORT_SALE_LABEL = "Vente de soutien";
export const DEFAULT_SUPPORT_SALE_SUBTITLE =
  "Réservez simplement : indiquez votre prénom et la quantité.";

export function defaultSupportSaleTitle(saleName: string): string {
  return saleName.trim() || "Vente de soutien";
}

export const SUPPORT_SALE_APPEARANCE_SELECT =
  "public_label, public_title, public_subtitle, public_primary_color, public_secondary_color, public_page_style, public_banner_url, public_banner_path, public_image_position, public_overlay_intensity";

export type SupportSaleAppearanceForm = {
  clubName: string;
  logoUrl: string | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  pageStyle: PublicVisualTheme["pageStyle"];
  imagePosition: PublicVisualTheme["imagePosition"];
  overlayIntensity: PublicVisualTheme["overlayIntensity"];
  bannerUrl: string | null;
  publicPath: string | null;
};

export function mapAppearanceFromSale(
  row: SupportSaleRow,
  extras: {
    clubName: string;
    logoUrl: string | null;
    fallbackPrimary: string | null;
    publicPath: string | null;
  }
): SupportSaleAppearanceForm {
  return {
    clubName: extras.clubName,
    logoUrl: extras.logoUrl,
    label: trimOrNull(row.public_label),
    title: trimOrNull(row.public_title),
    subtitle: trimOrNull(row.public_subtitle),
    primaryColor: normalizeHexColor(
      row.public_primary_color || extras.fallbackPrimary,
      OBILLZ_BRAND_PRIMARY
    ),
    secondaryColor: validateHexColor(row.public_secondary_color),
    pageStyle: parsePageStyle(row.public_page_style),
    imagePosition: parseImagePosition(row.public_image_position),
    overlayIntensity: parseOverlayIntensity(row.public_overlay_intensity),
    bannerUrl: trimOrNull(row.public_banner_url),
    publicPath: extras.publicPath,
  };
}

export function buildPublicSupportSaleTheme(input: {
  saleName: string;
  productName: string;
  description: string | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  pageStyle: string | null;
  imagePosition: string | null;
  overlayIntensity: string | null;
  bannerUrl: string | null;
}): PublicVisualTheme {
  const primary = normalizeHexColor(input.primaryColor, OBILLZ_BRAND_PRIMARY);
  const secondary = validateHexColor(input.secondaryColor) || darkenHex(primary, 0.32);
  return {
    label: input.label?.trim() || DEFAULT_SUPPORT_SALE_LABEL,
    title: input.title?.trim() || defaultSupportSaleTitle(input.saleName),
    subtitle: input.subtitle?.trim() || input.productName || DEFAULT_SUPPORT_SALE_SUBTITLE,
    introText: input.description,
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: primary,
    pageStyle: parsePageStyle(input.pageStyle),
    imagePosition: parseImagePosition(input.imagePosition),
    overlayIntensity: parseOverlayIntensity(input.overlayIntensity),
    bannerUrl: trimOrNull(input.bannerUrl),
  };
}

export function brandingUpdatesFromPatch(patch: {
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  pageStyle?: string | null;
  imagePosition?: string | null;
  overlayIntensity?: string | null;
}): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (patch.label !== undefined) updates.public_label = trimOrNull(patch.label)?.slice(0, 40) ?? null;
  if (patch.title !== undefined) updates.public_title = trimOrNull(patch.title)?.slice(0, 120) ?? null;
  if (patch.subtitle !== undefined) {
    updates.public_subtitle = trimOrNull(patch.subtitle)?.slice(0, 400) ?? null;
  }
  if (patch.primaryColor !== undefined) {
    updates.public_primary_color = validateHexColor(patch.primaryColor);
  }
  if (patch.secondaryColor !== undefined) {
    updates.public_secondary_color = validateHexColor(patch.secondaryColor);
  }
  if (patch.pageStyle !== undefined) updates.public_page_style = parsePageStyle(patch.pageStyle);
  if (patch.imagePosition !== undefined) {
    updates.public_image_position = parseImagePosition(patch.imagePosition);
  }
  if (patch.overlayIntensity !== undefined) {
    updates.public_overlay_intensity = parseOverlayIntensity(patch.overlayIntensity);
  }
  return updates;
}
