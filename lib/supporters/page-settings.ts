import type { SupabaseClient } from "@supabase/supabase-js";
import {
  darkenHex,
  normalizeHexColor,
  OBILLZ_BRAND_PRIMARY,
} from "@/lib/public-page/colors";

export const SUPPORTERS_PAGE_STYLES = ["colors", "banner", "fullscreen"] as const;
export type SupportersPageStyle = (typeof SUPPORTERS_PAGE_STYLES)[number];

export const SUPPORTERS_IMAGE_POSITIONS = ["top", "center", "bottom"] as const;
export type SupportersImagePosition = (typeof SUPPORTERS_IMAGE_POSITIONS)[number];

export const SUPPORTERS_OVERLAY_INTENSITIES = ["light", "normal", "dark"] as const;
export type SupportersOverlayIntensity = (typeof SUPPORTERS_OVERLAY_INTENSITIES)[number];

export const DEFAULT_SUPPORTERS_SUBTITLE =
  "Rejoignez les supporters du club et participez directement à son développement.";

export const DEFAULT_SUPPORTERS_LABEL = "Supporters";

export function defaultSupportersTitle(clubName: string): string {
  return `Soutenez le ${clubName}`;
}

export type SupportersPageSettings = {
  clubName: string;
  logoUrl: string | null;
  label: string | null;
  title: string | null;
  subtitle: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  pageStyle: SupportersPageStyle;
  imagePosition: SupportersImagePosition;
  overlayIntensity: SupportersOverlayIntensity;
  bannerUrl: string | null;
  showStats: boolean;
  publicPath: string | null;
};

export type SupportersPageSettingsUpdate = {
  label?: string | null;
  title?: string | null;
  subtitle?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  pageStyle?: SupportersPageStyle | null;
  imagePosition?: SupportersImagePosition | null;
  overlayIntensity?: SupportersOverlayIntensity | null;
  showStats?: boolean;
};

export const SUPPORTERS_SETTINGS_PROFILE_SELECT =
  "company_name, logo_url, primary_color, public_page_primary_color, supporters_public_title, supporters_public_subtitle, supporters_public_message, supporters_public_label, supporters_public_primary_color, supporters_public_secondary_color, supporters_public_background_mode, supporters_public_page_style, supporters_public_image_position, supporters_public_overlay_intensity, supporters_public_banner_url, supporters_public_show_stats";

export type SupportersSettingsProfileRow = {
  company_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  public_page_primary_color?: string | null;
  supporters_public_title?: string | null;
  supporters_public_subtitle?: string | null;
  supporters_public_message?: string | null;
  supporters_public_label?: string | null;
  supporters_public_primary_color?: string | null;
  supporters_public_secondary_color?: string | null;
  supporters_public_background_mode?: string | null;
  supporters_public_page_style?: string | null;
  supporters_public_image_position?: string | null;
  supporters_public_overlay_intensity?: string | null;
  supporters_public_banner_url?: string | null;
  supporters_public_show_stats?: boolean | null;
};

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function validateHexColor(value: string | null | undefined): string | null {
  const raw = trimOrNull(value ?? "");
  if (!raw) return null;
  const normalized = normalizeHexColor(raw, "");
  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return null;
  return normalized;
}

export function parsePageStyle(
  value: string | null | undefined,
  legacyBackgroundMode?: string | null
): SupportersPageStyle {
  if (value === "colors" || value === "banner" || value === "fullscreen") return value;
  if (legacyBackgroundMode === "image") return "banner";
  return "colors";
}

export function parseImagePosition(value: string | null | undefined): SupportersImagePosition {
  if (value === "top" || value === "center" || value === "bottom") return value;
  return "center";
}

export function parseOverlayIntensity(value: string | null | undefined): SupportersOverlayIntensity {
  if (value === "light" || value === "normal" || value === "dark") return value;
  return "normal";
}

export function mapProfileToSupportersSettings(
  profile: SupportersSettingsProfileRow,
  publicPath: string | null = null
): SupportersPageSettings {
  const clubName = profile.company_name?.trim() || "Club";
  return {
    clubName,
    logoUrl: trimOrNull(profile.logo_url),
    label: trimOrNull(profile.supporters_public_label),
    title: trimOrNull(profile.supporters_public_title),
    subtitle:
      trimOrNull(profile.supporters_public_subtitle) ||
      trimOrNull(profile.supporters_public_message),
    primaryColor: normalizeHexColor(
      profile.supporters_public_primary_color ||
        profile.public_page_primary_color ||
        profile.primary_color,
      OBILLZ_BRAND_PRIMARY
    ),
    secondaryColor: validateHexColor(profile.supporters_public_secondary_color),
    pageStyle: parsePageStyle(
      profile.supporters_public_page_style,
      profile.supporters_public_background_mode
    ),
    imagePosition: parseImagePosition(profile.supporters_public_image_position),
    overlayIntensity: parseOverlayIntensity(profile.supporters_public_overlay_intensity),
    bannerUrl: trimOrNull(profile.supporters_public_banner_url),
    showStats: profile.supporters_public_show_stats !== false,
    publicPath,
  };
}

export function resolvedSupportersCopy(settings: {
  clubName: string;
  label: string | null;
  title: string | null;
  subtitle: string | null;
}) {
  return {
    label: settings.label?.trim() || DEFAULT_SUPPORTERS_LABEL,
    title: settings.title?.trim() || defaultSupportersTitle(settings.clubName),
    subtitle: settings.subtitle?.trim() || DEFAULT_SUPPORTERS_SUBTITLE,
  };
}

export function resolvedSecondaryColor(
  primaryColor: string,
  secondaryColor: string | null | undefined
): string {
  return validateHexColor(secondaryColor) || darkenHex(primaryColor, 0.32);
}

export async function updateSupportersPageSettings(
  supabase: SupabaseClient,
  clubId: string,
  input: SupportersPageSettingsUpdate
): Promise<{ settings?: SupportersPageSettings; error?: string; status?: number }> {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select(SUPPORTERS_SETTINGS_PROFILE_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message, status: 500 };
  }

  const profile = (existing || {}) as SupportersSettingsProfileRow;

  if (input.primaryColor !== undefined && input.primaryColor !== null) {
    if (input.primaryColor.trim() && !validateHexColor(input.primaryColor)) {
      return { error: "Couleur principale invalide (format #RRGGBB attendu).", status: 400 };
    }
  }
  if (input.secondaryColor !== undefined && input.secondaryColor !== null) {
    if (input.secondaryColor.trim() && !validateHexColor(input.secondaryColor)) {
      return { error: "Couleur secondaire invalide (format #RRGGBB attendu).", status: 400 };
    }
  }
  if (input.pageStyle !== undefined && input.pageStyle !== null && !SUPPORTERS_PAGE_STYLES.includes(input.pageStyle)) {
    return { error: "Style de page invalide.", status: 400 };
  }
  if (
    input.imagePosition !== undefined &&
    input.imagePosition !== null &&
    !SUPPORTERS_IMAGE_POSITIONS.includes(input.imagePosition)
  ) {
    return { error: "Position d’image invalide.", status: 400 };
  }
  if (
    input.overlayIntensity !== undefined &&
    input.overlayIntensity !== null &&
    !SUPPORTERS_OVERLAY_INTENSITIES.includes(input.overlayIntensity)
  ) {
    return { error: "Intensité invalide.", status: 400 };
  }

  const pageStyle =
    input.pageStyle !== undefined
      ? parsePageStyle(input.pageStyle)
      : parsePageStyle(profile.supporters_public_page_style, profile.supporters_public_background_mode);

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    supporters_public_label:
      input.label !== undefined ? trimOrNull(input.label) : trimOrNull(profile.supporters_public_label),
    supporters_public_title:
      input.title !== undefined ? trimOrNull(input.title) : trimOrNull(profile.supporters_public_title),
    supporters_public_subtitle:
      input.subtitle !== undefined
        ? trimOrNull(input.subtitle)
        : trimOrNull(profile.supporters_public_subtitle),
    supporters_public_primary_color:
      input.primaryColor !== undefined
        ? validateHexColor(input.primaryColor)
        : validateHexColor(profile.supporters_public_primary_color),
    supporters_public_secondary_color:
      input.secondaryColor !== undefined
        ? validateHexColor(input.secondaryColor)
        : validateHexColor(profile.supporters_public_secondary_color),
    supporters_public_page_style: pageStyle,
    supporters_public_background_mode: pageStyle === "colors" ? "gradient" : "image",
    supporters_public_image_position:
      input.imagePosition !== undefined
        ? parseImagePosition(input.imagePosition)
        : parseImagePosition(profile.supporters_public_image_position),
    supporters_public_overlay_intensity:
      input.overlayIntensity !== undefined
        ? parseOverlayIntensity(input.overlayIntensity)
        : parseOverlayIntensity(profile.supporters_public_overlay_intensity),
    supporters_public_show_stats:
      input.showStats !== undefined
        ? Boolean(input.showStats)
        : profile.supporters_public_show_stats !== false,
  };

  const { error: updateError } = await supabase.from("profiles").update(payload).eq("user_id", clubId);
  if (updateError) {
    return { error: updateError.message, status: 500 };
  }

  const { data: updated } = await supabase
    .from("profiles")
    .select(SUPPORTERS_SETTINGS_PROFILE_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  return { settings: mapProfileToSupportersSettings((updated || profile) as SupportersSettingsProfileRow) };
}
