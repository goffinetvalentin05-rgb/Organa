import type { SupabaseClient } from "@supabase/supabase-js";
import { darkenHex, normalizeHexColor, OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";
import {
  parseImagePosition,
  parseOverlayIntensity,
  parsePageStyle,
  trimOrNull,
  validateHexColor,
} from "@/lib/public-branding/parse";
import type {
  PublicImagePosition,
  PublicOverlayIntensity,
  PublicPageStyle,
  PublicVisualTheme,
} from "@/lib/public-branding/types";
import {
  getBuvettePublicUrlPath,
  isValidBuvetteSlug,
  normalizeBuvetteSlug,
  suggestBuvetteSlug,
} from "@/lib/buvette/slug";

export const BUVETTE_PUBLIC_DEFAULT_TITLE = "Réservation de buvette";
export const DEFAULT_BUVETTE_LABEL = "Buvette";
export const DEFAULT_BUVETTE_SUBTITLE =
  "Consultez les disponibilités et réservez directement une date.";

export function defaultBuvetteTitle(clubName: string): string {
  return `Réservez la buvette du ${clubName}`;
}

export type BuvettePublicSettings = {
  slug: string | null;
  suggestedSlug: string;
  publicUrlPath: string | null;
  label: string | null;
  title: string | null;
  description: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  pageStyle: PublicPageStyle;
  imagePosition: PublicImagePosition;
  overlayIntensity: PublicOverlayIntensity;
  bannerUrl: string | null;
  logoUrl: string | null;
  companyName: string;
};

const PROFILE_SELECT_CORE =
  "company_name, logo_url, primary_color, public_page_primary_color, buvette_slug, buvette_public_title, buvette_public_description, buvette_public_primary_color, buvette_public_accent_color, buvette_public_banner_url";

const PROFILE_SELECT_BRANDING = `${PROFILE_SELECT_CORE}, buvette_public_label, buvette_public_secondary_color, buvette_public_page_style, buvette_public_image_position, buvette_public_overlay_intensity`;

type ProfileRow = {
  company_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  public_page_primary_color?: string | null;
  buvette_slug?: string | null;
  buvette_public_title?: string | null;
  buvette_public_description?: string | null;
  buvette_public_primary_color?: string | null;
  buvette_public_secondary_color?: string | null;
  buvette_public_accent_color?: string | null;
  buvette_public_banner_url?: string | null;
  buvette_public_label?: string | null;
  buvette_public_page_style?: string | null;
  buvette_public_image_position?: string | null;
  buvette_public_overlay_intensity?: string | null;
};

export async function selectBuvetteProfile(
  supabase: SupabaseClient,
  column: string,
  value: string
): Promise<ProfileRow | null> {
  const full = await supabase.from("profiles").select(PROFILE_SELECT_BRANDING).eq(column, value).maybeSingle();
  if (!full.error) return (full.data as ProfileRow | null) ?? null;
  const core = await supabase.from("profiles").select(PROFILE_SELECT_CORE).eq(column, value).maybeSingle();
  if (core.error) throw core.error;
  return (core.data as ProfileRow | null) ?? null;
}

export function mapProfileToBuvetteSettings(
  profile: ProfileRow,
  clubId: string
): BuvettePublicSettings {
  const companyName = profile.company_name?.trim() || "Club";
  const slug = profile.buvette_slug?.trim() || null;
  const suggestedSlug = suggestBuvetteSlug(companyName, clubId);

  return {
    slug,
    suggestedSlug,
    publicUrlPath: slug ? getBuvettePublicUrlPath(slug) : null,
    label: trimOrNull(profile.buvette_public_label),
    title: trimOrNull(profile.buvette_public_title),
    description: trimOrNull(profile.buvette_public_description),
    primaryColor: normalizeHexColor(
      profile.buvette_public_primary_color ||
        profile.public_page_primary_color ||
        profile.primary_color,
      OBILLZ_BRAND_PRIMARY
    ),
    secondaryColor: validateHexColor(profile.buvette_public_secondary_color),
    accentColor: validateHexColor(profile.buvette_public_accent_color),
    pageStyle: parsePageStyle(profile.buvette_public_page_style),
    imagePosition: parseImagePosition(profile.buvette_public_image_position),
    overlayIntensity: parseOverlayIntensity(profile.buvette_public_overlay_intensity),
    bannerUrl: trimOrNull(profile.buvette_public_banner_url),
    logoUrl: trimOrNull(profile.logo_url),
    companyName,
  };
}

export function resolvedBuvetteCopy(settings: {
  clubName: string;
  label: string | null;
  title: string | null;
  description: string | null;
}) {
  return {
    label: settings.label?.trim() || DEFAULT_BUVETTE_LABEL,
    title: settings.title?.trim() || defaultBuvetteTitle(settings.clubName),
    subtitle: settings.description?.trim() || DEFAULT_BUVETTE_SUBTITLE,
  };
}

export function buildBuvettePublicTheme(settings: BuvettePublicSettings): PublicVisualTheme {
  const copy = resolvedBuvetteCopy({
    clubName: settings.companyName,
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
    pageStyle: settings.pageStyle,
    imagePosition: settings.imagePosition,
    overlayIntensity: settings.overlayIntensity,
    bannerUrl: settings.bannerUrl,
  };
}

export type BuvetteSettingsUpdateInput = {
  slug?: string | null;
  label?: string | null;
  title?: string | null;
  description?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  pageStyle?: PublicPageStyle | null;
  imagePosition?: PublicImagePosition | null;
  overlayIntensity?: PublicOverlayIntensity | null;
};

export async function updateBuvettePublicSettings(
  supabase: SupabaseClient,
  clubId: string,
  input: BuvetteSettingsUpdateInput
): Promise<{ settings?: BuvettePublicSettings; error?: string; status?: number }> {
  let profile: ProfileRow;
  try {
    profile = (await selectBuvetteProfile(supabase, "user_id", clubId)) || {};
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Erreur serveur", status: 500 };
  }

  const companyName = profile.company_name?.trim() || "Club";

  let slug =
    input.slug !== undefined
      ? input.slug
        ? normalizeBuvetteSlug(input.slug)
        : null
      : profile.buvette_slug?.trim() || null;

  if (!slug) {
    slug = suggestBuvetteSlug(companyName, clubId);
  }

  if (!isValidBuvetteSlug(slug)) {
    return {
      error: "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.",
      status: 400,
    };
  }

  const { data: conflict } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("buvette_slug", slug)
    .neq("user_id", clubId)
    .maybeSingle();

  if (conflict) {
    return { error: "Ce slug est déjà utilisé par un autre club.", status: 409 };
  }

  for (const [key, label] of [
    ["primaryColor", "Couleur principale"],
    ["secondaryColor", "Couleur secondaire"],
    ["accentColor", "Couleur d’accent"],
  ] as const) {
    const value = input[key];
    if (value !== undefined && value !== null && value.trim() && !validateHexColor(value)) {
      return { error: `${label} invalide (format #RRGGBB attendu).`, status: 400 };
    }
  }

  if (
    input.pageStyle !== undefined &&
    input.pageStyle !== null &&
    input.pageStyle !== "colors" &&
    input.pageStyle !== "banner" &&
    input.pageStyle !== "fullscreen"
  ) {
    return { error: "Style de page invalide.", status: 400 };
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    buvette_slug: slug,
    buvette_public_title:
      input.title !== undefined ? trimOrNull(input.title) : trimOrNull(profile.buvette_public_title),
    buvette_public_description:
      input.description !== undefined
        ? trimOrNull(input.description)
        : trimOrNull(profile.buvette_public_description),
    buvette_public_primary_color:
      input.primaryColor !== undefined
        ? validateHexColor(input.primaryColor)
        : validateHexColor(profile.buvette_public_primary_color),
    buvette_public_accent_color:
      input.accentColor !== undefined
        ? validateHexColor(input.accentColor)
        : validateHexColor(profile.buvette_public_accent_color),
  };

  if (input.label !== undefined) payload.buvette_public_label = trimOrNull(input.label)?.slice(0, 40) ?? null;
  if (input.secondaryColor !== undefined) {
    payload.buvette_public_secondary_color = validateHexColor(input.secondaryColor);
  }
  if (input.pageStyle !== undefined) payload.buvette_public_page_style = parsePageStyle(input.pageStyle);
  if (input.imagePosition !== undefined) {
    payload.buvette_public_image_position = parseImagePosition(input.imagePosition);
  }
  if (input.overlayIntensity !== undefined) {
    payload.buvette_public_overlay_intensity = parseOverlayIntensity(input.overlayIntensity);
  }

  const { error: updateError } = await supabase.from("profiles").update(payload).eq("user_id", clubId);

  if (updateError) {
    if (Object.keys(payload).some((key) => key.includes("page_style") || key.includes("label") || key.includes("secondary"))) {
      return {
        error:
          "Les colonnes de personnalisation buvette sont absentes. Appliquez la migration 084_buvette_page_styles.sql.",
        status: 500,
      };
    }
    return { error: updateError.message, status: 500 };
  }

  const updated = await selectBuvetteProfile(supabase, "user_id", clubId);
  return { settings: mapProfileToBuvetteSettings((updated || profile) as ProfileRow, clubId) };
}

export { PROFILE_SELECT_BRANDING as BUVETTE_SETTINGS_PROFILE_SELECT };
