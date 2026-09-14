import type { SupabaseClient } from "@supabase/supabase-js";
import {
  darkenHex,
  normalizeHexColor,
  OBILLZ_BRAND_PRIMARY,
} from "@/lib/public-page/colors";

export const SUPPORTERS_BACKGROUND_MODES = ["solid", "gradient", "image"] as const;
export type SupportersBackgroundMode = (typeof SUPPORTERS_BACKGROUND_MODES)[number];

export const DEFAULT_SUPPORTERS_SUBTITLE =
  "Rejoignez les supporters du club et participez directement à son développement.";

export function defaultSupportersTitle(clubName: string): string {
  return `Soutenez le ${clubName}`;
}

export type SupportersPageSettings = {
  clubName: string;
  logoUrl: string | null;
  title: string | null;
  subtitle: string | null;
  message: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  backgroundMode: SupportersBackgroundMode;
  bannerUrl: string | null;
  bgImageUrl: string | null;
  showStats: boolean;
  publicPath: string | null;
};

export type SupportersPageSettingsUpdate = {
  title?: string | null;
  subtitle?: string | null;
  message?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  backgroundMode?: SupportersBackgroundMode | null;
  showStats?: boolean;
};

export const SUPPORTERS_SETTINGS_PROFILE_SELECT =
  "company_name, logo_url, primary_color, public_page_primary_color, supporters_public_title, supporters_public_subtitle, supporters_public_message, supporters_public_primary_color, supporters_public_secondary_color, supporters_public_background_mode, supporters_public_banner_url, supporters_public_bg_image_url, supporters_public_show_stats";

export type SupportersSettingsProfileRow = {
  company_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  public_page_primary_color?: string | null;
  supporters_public_title?: string | null;
  supporters_public_subtitle?: string | null;
  supporters_public_message?: string | null;
  supporters_public_primary_color?: string | null;
  supporters_public_secondary_color?: string | null;
  supporters_public_background_mode?: string | null;
  supporters_public_banner_url?: string | null;
  supporters_public_banner_path?: string | null;
  supporters_public_bg_image_url?: string | null;
  supporters_public_bg_image_path?: string | null;
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

export function parseBackgroundMode(
  value: string | null | undefined
): SupportersBackgroundMode {
  if (value === "solid" || value === "gradient" || value === "image") return value;
  return "gradient";
}

export function mapProfileToSupportersSettings(
  profile: SupportersSettingsProfileRow,
  publicPath: string | null = null
): SupportersPageSettings {
  const clubName = profile.company_name?.trim() || "Club";
  return {
    clubName,
    logoUrl: trimOrNull(profile.logo_url),
    title: trimOrNull(profile.supporters_public_title),
    subtitle: trimOrNull(profile.supporters_public_subtitle),
    message: trimOrNull(profile.supporters_public_message),
    primaryColor: normalizeHexColor(
      profile.supporters_public_primary_color ||
        profile.public_page_primary_color ||
        profile.primary_color,
      OBILLZ_BRAND_PRIMARY
    ),
    secondaryColor: validateHexColor(profile.supporters_public_secondary_color),
    backgroundMode: parseBackgroundMode(profile.supporters_public_background_mode),
    bannerUrl: trimOrNull(profile.supporters_public_banner_url),
    bgImageUrl: trimOrNull(profile.supporters_public_bg_image_url),
    showStats: profile.supporters_public_show_stats !== false,
    publicPath,
  };
}

export function resolvedSupportersCopy(settings: {
  clubName: string;
  title: string | null;
  subtitle: string | null;
  message: string | null;
}) {
  return {
    title: settings.title?.trim() || defaultSupportersTitle(settings.clubName),
    subtitle: settings.subtitle?.trim() || DEFAULT_SUPPORTERS_SUBTITLE,
    message: settings.message?.trim() || null,
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
  if (
    input.backgroundMode !== undefined &&
    input.backgroundMode !== null &&
    !SUPPORTERS_BACKGROUND_MODES.includes(input.backgroundMode)
  ) {
    return { error: "Mode de fond invalide.", status: 400 };
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    supporters_public_title:
      input.title !== undefined ? trimOrNull(input.title) : trimOrNull(profile.supporters_public_title),
    supporters_public_subtitle:
      input.subtitle !== undefined
        ? trimOrNull(input.subtitle)
        : trimOrNull(profile.supporters_public_subtitle),
    supporters_public_message:
      input.message !== undefined
        ? trimOrNull(input.message)
        : trimOrNull(profile.supporters_public_message),
    supporters_public_primary_color:
      input.primaryColor !== undefined
        ? validateHexColor(input.primaryColor)
        : validateHexColor(profile.supporters_public_primary_color),
    supporters_public_secondary_color:
      input.secondaryColor !== undefined
        ? validateHexColor(input.secondaryColor)
        : validateHexColor(profile.supporters_public_secondary_color),
    supporters_public_background_mode:
      input.backgroundMode !== undefined
        ? parseBackgroundMode(input.backgroundMode)
        : parseBackgroundMode(profile.supporters_public_background_mode),
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
