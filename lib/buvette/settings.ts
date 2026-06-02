import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeHexColor, OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";
import {
  getBuvettePublicUrlPath,
  isValidBuvetteSlug,
  normalizeBuvetteSlug,
  suggestBuvetteSlug,
} from "@/lib/buvette/slug";

export const BUVETTE_PUBLIC_DEFAULT_TITLE = "Réservation de buvette";

export type BuvettePublicSettings = {
  slug: string | null;
  suggestedSlug: string;
  publicUrlPath: string | null;
  title: string | null;
  description: string | null;
  primaryColor: string;
  accentColor: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  companyName: string;
};

const PROFILE_SELECT =
  "company_name, logo_url, primary_color, buvette_slug, buvette_public_title, buvette_public_description, buvette_public_primary_color, buvette_public_accent_color, buvette_public_banner_url";

type ProfileRow = {
  company_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  buvette_slug?: string | null;
  buvette_public_title?: string | null;
  buvette_public_description?: string | null;
  buvette_public_primary_color?: string | null;
  buvette_public_accent_color?: string | null;
  buvette_public_banner_url?: string | null;
};

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function validateHexColor(value: string | null | undefined): string | null {
  const raw = trimOrNull(value ?? "");
  if (!raw) return null;
  const normalized = normalizeHexColor(raw, "");
  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return null;
  return normalized;
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
    title: trimOrNull(profile.buvette_public_title),
    description: trimOrNull(profile.buvette_public_description),
    primaryColor: normalizeHexColor(
      profile.buvette_public_primary_color || profile.primary_color,
      OBILLZ_BRAND_PRIMARY
    ),
    accentColor: validateHexColor(profile.buvette_public_accent_color),
    bannerUrl: trimOrNull(profile.buvette_public_banner_url),
    logoUrl: trimOrNull(profile.logo_url),
    companyName,
  };
}

export type BuvetteSettingsUpdateInput = {
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  bannerUrl?: string | null;
};

export async function updateBuvettePublicSettings(
  supabase: SupabaseClient,
  clubId: string,
  input: BuvetteSettingsUpdateInput
): Promise<{ settings?: BuvettePublicSettings; error?: string; status?: number }> {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message, status: 500 };
  }

  const profile = (existing || {}) as ProfileRow;
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

  if (input.primaryColor !== undefined && input.primaryColor !== null) {
    const hex = validateHexColor(input.primaryColor);
    if (input.primaryColor.trim() && !hex) {
      return { error: "Couleur principale invalide (format #RRGGBB attendu).", status: 400 };
    }
  }

  if (input.accentColor !== undefined && input.accentColor !== null) {
    const hex = validateHexColor(input.accentColor);
    if (input.accentColor.trim() && !hex) {
      return { error: "Couleur d'accent invalide (format #RRGGBB attendu).", status: 400 };
    }
  }

  const bannerUrl =
    input.bannerUrl !== undefined ? trimOrNull(input.bannerUrl) : trimOrNull(profile.buvette_public_banner_url);

  if (bannerUrl && !/^https?:\/\/.+/i.test(bannerUrl)) {
    return { error: "L'URL de bannière doit commencer par http:// ou https://", status: 400 };
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
    buvette_public_banner_url: bannerUrl,
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(payload)
    .eq("user_id", clubId);

  if (updateError) {
    return { error: updateError.message, status: 500 };
  }

  const { data: updated } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  return { settings: mapProfileToBuvetteSettings((updated || profile) as ProfileRow, clubId) };
}

export { PROFILE_SELECT as BUVETTE_SETTINGS_PROFILE_SELECT };
