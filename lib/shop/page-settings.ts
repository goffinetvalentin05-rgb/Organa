import type { SupabaseClient } from "@supabase/supabase-js";
import { darkenHex, normalizeHexColor, OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";
import type { PublicVisualTheme } from "@/lib/public-branding/types";
import {
  parseImagePosition,
  parseOverlayIntensity,
  parsePageStyle,
  trimOrNull,
  validateHexColor,
} from "@/lib/public-branding/parse";
import type { PublicImagePosition, PublicOverlayIntensity, PublicPageStyle } from "@/lib/public-branding/types";

export const DEFAULT_SHOP_LABEL = "Boutique";
export const DEFAULT_SHOP_SUBTITLE =
  "Retrouvez les produits du club et soutenez-le à travers vos achats.";

export function defaultShopTitle(clubName: string): string {
  return `Boutique officielle du ${clubName}`;
}

export const SHOP_SETTINGS_SELECT_CORE =
  "club_id, slug, is_enabled, display_name, intro_text, pickup_info, orders_email, track_stock_default, currency";

export const SHOP_SETTINGS_SELECT_BRANDING = `${SHOP_SETTINGS_SELECT_CORE}, public_label, public_title, public_subtitle, public_primary_color, public_secondary_color, public_accent_color, public_page_style, public_banner_url, public_banner_path, public_image_position, public_overlay_intensity`;

export type ShopSettingsBrandingRow = {
  club_id: string;
  slug: string | null;
  is_enabled: boolean;
  display_name: string | null;
  intro_text: string | null;
  pickup_info: string | null;
  orders_email: string | null;
  track_stock_default: boolean;
  currency: string;
  public_label?: string | null;
  public_title?: string | null;
  public_subtitle?: string | null;
  public_primary_color?: string | null;
  public_secondary_color?: string | null;
  public_accent_color?: string | null;
  public_page_style?: string | null;
  public_banner_url?: string | null;
  public_banner_path?: string | null;
  public_image_position?: string | null;
  public_overlay_intensity?: string | null;
};

export type ShopAppearanceSettings = {
  clubName: string;
  logoUrl: string | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  introText: string;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  pageStyle: PublicPageStyle;
  imagePosition: PublicImagePosition;
  overlayIntensity: PublicOverlayIntensity;
  bannerUrl: string | null;
  publicPath: string | null;
};

export type ShopAppearanceUpdate = {
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  introText?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  pageStyle?: PublicPageStyle | null;
  imagePosition?: PublicImagePosition | null;
  overlayIntensity?: PublicOverlayIntensity | null;
};

export async function selectShopSettingsRow(
  supabase: SupabaseClient,
  clubId: string
): Promise<ShopSettingsBrandingRow | null> {
  const full = await supabase
    .from("shop_settings")
    .select(SHOP_SETTINGS_SELECT_BRANDING)
    .eq("club_id", clubId)
    .maybeSingle();

  if (!full.error) return (full.data as ShopSettingsBrandingRow | null) ?? null;

  const core = await supabase
    .from("shop_settings")
    .select(SHOP_SETTINGS_SELECT_CORE)
    .eq("club_id", clubId)
    .maybeSingle();

  if (core.error) throw core.error;
  return (core.data as ShopSettingsBrandingRow | null) ?? null;
}

export function mapAppearanceFromRow(
  row: ShopSettingsBrandingRow,
  extras: {
    clubName: string;
    logoUrl: string | null;
    fallbackPrimary: string | null;
    publicPath: string | null;
  }
): ShopAppearanceSettings {
  const clubName = extras.clubName;
  return {
    clubName,
    logoUrl: extras.logoUrl,
    label: trimOrNull(row.public_label),
    title: trimOrNull(row.public_title),
    subtitle: trimOrNull(row.public_subtitle),
    introText: row.intro_text?.trim() || "",
    primaryColor: normalizeHexColor(
      row.public_primary_color || extras.fallbackPrimary,
      OBILLZ_BRAND_PRIMARY
    ),
    secondaryColor: validateHexColor(row.public_secondary_color),
    accentColor: validateHexColor(row.public_accent_color),
    pageStyle: parsePageStyle(row.public_page_style),
    imagePosition: parseImagePosition(row.public_image_position),
    overlayIntensity: parseOverlayIntensity(row.public_overlay_intensity),
    bannerUrl: trimOrNull(row.public_banner_url),
    publicPath: extras.publicPath,
  };
}

export function resolvedShopCopy(settings: {
  clubName: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  introText?: string | null;
}) {
  const subtitle =
    settings.subtitle?.trim() || settings.introText?.trim() || DEFAULT_SHOP_SUBTITLE;
  const intro =
    settings.introText?.trim() &&
    settings.subtitle?.trim() &&
    settings.introText.trim() !== settings.subtitle.trim()
      ? settings.introText.trim()
      : null;
  return {
    label: settings.label?.trim() || DEFAULT_SHOP_LABEL,
    title: settings.title?.trim() || defaultShopTitle(settings.clubName),
    subtitle,
    introText: intro,
  };
}

export function resolvedShopColors(
  primaryColor: string,
  secondaryColor: string | null | undefined,
  accentColor: string | null | undefined
) {
  const primary = normalizeHexColor(primaryColor, OBILLZ_BRAND_PRIMARY);
  const secondary = validateHexColor(secondaryColor) || darkenHex(primary, 0.32);
  const accent = validateHexColor(accentColor) || primary;
  return { primary, secondary, accent };
}

export function buildPublicShopTheme(input: {
  clubName: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  introText: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  pageStyle: PublicPageStyle | string | null;
  imagePosition: PublicImagePosition | string | null;
  overlayIntensity: PublicOverlayIntensity | string | null;
  bannerUrl: string | null;
}): PublicVisualTheme {
  const colors = resolvedShopColors(input.primaryColor, input.secondaryColor, input.accentColor);
  const copy = resolvedShopCopy(input);
  return {
    label: copy.label,
    title: copy.title,
    subtitle: copy.subtitle,
    introText: copy.introText,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    pageStyle: parsePageStyle(input.pageStyle),
    imagePosition: parseImagePosition(input.imagePosition),
    overlayIntensity: parseOverlayIntensity(input.overlayIntensity),
    bannerUrl: trimOrNull(input.bannerUrl),
  };
}

export function fallbackPublicShopTheme(catalog: {
  clubName: string;
  primaryColor: string;
  introText?: string | null;
  theme?: PublicVisualTheme | null;
}): PublicVisualTheme {
  if (catalog.theme?.primaryColor) return catalog.theme;
  return buildPublicShopTheme({
    clubName: catalog.clubName,
    label: null,
    title: null,
    subtitle: null,
    introText: catalog.introText || null,
    primaryColor: catalog.primaryColor,
    secondaryColor: null,
    accentColor: null,
    pageStyle: "colors",
    imagePosition: "center",
    overlayIntensity: "normal",
    bannerUrl: null,
  });
}

export function brandingUpdatesFromPatch(patch: ShopAppearanceUpdate): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (patch.label !== undefined) updates.public_label = trimOrNull(patch.label)?.slice(0, 40) ?? null;
  if (patch.title !== undefined) updates.public_title = trimOrNull(patch.title)?.slice(0, 120) ?? null;
  if (patch.subtitle !== undefined) {
    updates.public_subtitle = trimOrNull(patch.subtitle)?.slice(0, 400) ?? null;
  }
  if (patch.introText !== undefined) {
    updates.intro_text = typeof patch.introText === "string" ? patch.introText.trim().slice(0, 2000) : null;
  }
  if (patch.primaryColor !== undefined) {
    updates.public_primary_color = validateHexColor(patch.primaryColor);
  }
  if (patch.secondaryColor !== undefined) {
    updates.public_secondary_color = validateHexColor(patch.secondaryColor);
  }
  if (patch.accentColor !== undefined) {
    updates.public_accent_color = validateHexColor(patch.accentColor);
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

export function validateAppearancePatch(patch: ShopAppearanceUpdate): string | null {
  if (patch.primaryColor !== undefined && patch.primaryColor !== null && patch.primaryColor.trim()) {
    if (!validateHexColor(patch.primaryColor)) {
      return "Couleur principale invalide (format #RRGGBB attendu).";
    }
  }
  if (patch.secondaryColor !== undefined && patch.secondaryColor !== null && patch.secondaryColor.trim()) {
    if (!validateHexColor(patch.secondaryColor)) {
      return "Couleur secondaire invalide (format #RRGGBB attendu).";
    }
  }
  if (patch.accentColor !== undefined && patch.accentColor !== null && patch.accentColor.trim()) {
    if (!validateHexColor(patch.accentColor)) {
      return "Couleur d’accent invalide (format #RRGGBB attendu).";
    }
  }
  if (
    patch.pageStyle !== undefined &&
    patch.pageStyle !== null &&
    patch.pageStyle !== "colors" &&
    patch.pageStyle !== "banner" &&
    patch.pageStyle !== "fullscreen"
  ) {
    return "Style de page invalide.";
  }
  return null;
}
