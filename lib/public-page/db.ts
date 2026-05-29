import type { SupabaseClient } from "@supabase/supabase-js";
import { suggestPublicPageSlug, normalizePublicPageSlug, isValidPublicPageSlug } from "./slug";
import type { PublicPageSettings } from "./types";

const SETTINGS_SELECT =
  "user_id, company_name, logo_url, primary_color, buvette_slug, public_page_enabled, public_page_slug, public_page_title, public_page_description, public_page_primary_color, public_page_instagram_url, public_page_facebook_url, public_page_website_url, public_page_contact_url, public_page_show_buvette, public_page_show_matches, public_page_show_contact";

export function mapProfileToSettings(profile: Record<string, unknown>): PublicPageSettings {
  const slug =
    typeof profile.public_page_slug === "string" && profile.public_page_slug.trim()
      ? profile.public_page_slug.trim()
      : null;

  const primaryColor =
    (typeof profile.public_page_primary_color === "string" &&
      profile.public_page_primary_color) ||
    (typeof profile.primary_color === "string" && profile.primary_color) ||
    "#1A23FF";

  const title =
    (typeof profile.public_page_title === "string" && profile.public_page_title) ||
    (typeof profile.company_name === "string" ? profile.company_name : "") ||
    "";

  return {
    enabled: profile.public_page_enabled === true,
    slug,
    title,
    description:
      typeof profile.public_page_description === "string" ? profile.public_page_description : "",
    primaryColor,
    logoUrl: typeof profile.logo_url === "string" ? profile.logo_url : null,
    instagramUrl:
      typeof profile.public_page_instagram_url === "string" ? profile.public_page_instagram_url : "",
    facebookUrl:
      typeof profile.public_page_facebook_url === "string" ? profile.public_page_facebook_url : "",
    websiteUrl:
      typeof profile.public_page_website_url === "string" ? profile.public_page_website_url : "",
    contactUrl:
      typeof profile.public_page_contact_url === "string" ? profile.public_page_contact_url : "",
    showBuvette: profile.public_page_show_buvette !== false,
    showMatches: profile.public_page_show_matches !== false,
    showContact: profile.public_page_show_contact !== false,
    publicUrlPath:
      profile.public_page_enabled === true && slug ? `/p/${slug}` : null,
    buvetteSlug:
      typeof profile.buvette_slug === "string" && profile.buvette_slug.trim()
        ? profile.buvette_slug.trim()
        : null,
  };
}

export async function fetchPublicPageSettings(
  supabase: SupabaseClient,
  clubId: string
): Promise<PublicPageSettings | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(SETTINGS_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfileToSettings(data as Record<string, unknown>);
}

export interface PublicPageUpdateInput {
  enabled?: boolean;
  slug?: string | null;
  title?: string;
  description?: string;
  primaryColor?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  contactUrl?: string;
  showBuvette?: boolean;
  showMatches?: boolean;
  showContact?: boolean;
}

function trimOrNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

export async function updatePublicPageSettings(
  supabase: SupabaseClient,
  clubId: string,
  input: PublicPageUpdateInput
): Promise<{ settings?: PublicPageSettings; error?: string; status?: number }> {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select(SETTINGS_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message, status: 500 };
  }

  const profile = (existing || {}) as Record<string, unknown>;
  const companyName = typeof profile.company_name === "string" ? profile.company_name : "Club";

  let slug =
    input.slug !== undefined
      ? input.slug
        ? normalizePublicPageSlug(input.slug)
        : null
      : typeof profile.public_page_slug === "string"
        ? profile.public_page_slug
        : null;

  if (input.enabled === true && !slug) {
    slug = suggestPublicPageSlug(companyName, clubId);
  }

  if (slug && !isValidPublicPageSlug(slug)) {
    return {
      error: "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.",
      status: 400,
    };
  }

  if (slug) {
    const { data: conflict } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("public_page_slug", slug)
      .neq("user_id", clubId)
      .maybeSingle();

    if (conflict) {
      return { error: "Ce slug est déjà utilisé par un autre club.", status: 409 };
    }
  }

  if (input.primaryColor !== undefined && input.primaryColor !== null) {
    const hex = String(input.primaryColor).trim();
    if (hex && !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return { error: "Couleur invalide (format #RRGGBB attendu).", status: 400 };
    }
  }

  const enabled = input.enabled !== undefined ? Boolean(input.enabled) : profile.public_page_enabled === true;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    public_page_enabled: enabled,
    public_page_slug: slug,
    public_page_title:
      input.title !== undefined ? trimOrNull(input.title) : profile.public_page_title ?? null,
    public_page_description:
      input.description !== undefined
        ? trimOrNull(input.description)
        : profile.public_page_description ?? null,
    public_page_primary_color:
      input.primaryColor !== undefined
        ? input.primaryColor?.trim() || null
        : profile.public_page_primary_color ?? null,
    public_page_instagram_url:
      input.instagramUrl !== undefined
        ? trimOrNull(input.instagramUrl)
        : profile.public_page_instagram_url ?? null,
    public_page_facebook_url:
      input.facebookUrl !== undefined
        ? trimOrNull(input.facebookUrl)
        : profile.public_page_facebook_url ?? null,
    public_page_website_url:
      input.websiteUrl !== undefined
        ? trimOrNull(input.websiteUrl)
        : profile.public_page_website_url ?? null,
    public_page_contact_url:
      input.contactUrl !== undefined
        ? trimOrNull(input.contactUrl)
        : profile.public_page_contact_url ?? null,
    public_page_show_buvette:
      input.showBuvette !== undefined ? Boolean(input.showBuvette) : profile.public_page_show_buvette !== false,
    public_page_show_matches:
      input.showMatches !== undefined
        ? Boolean(input.showMatches)
        : profile.public_page_show_matches !== false,
    public_page_show_contact:
      input.showContact !== undefined
        ? Boolean(input.showContact)
        : profile.public_page_show_contact !== false,
  };

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(payload)
    .eq("user_id", clubId)
    .select(SETTINGS_SELECT)
    .single();

  if (updateError) {
    if (updateError.code === "23505") {
      return { error: "Ce slug est déjà utilisé.", status: 409 };
    }
    return { error: updateError.message, status: 500 };
  }

  return { settings: mapProfileToSettings(updated as Record<string, unknown>) };
}
