import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicClubPageData } from "./types";

export type PublicSlugResolution =
  | { type: "club"; data: PublicClubPageData }
  | { type: "planning" }
  | { type: "not_found" };

const PUBLIC_PROFILE_SELECT =
  "user_id, company_name, logo_url, primary_color, buvette_slug, public_page_enabled, public_page_slug, public_page_title, public_page_description, public_page_primary_color, public_page_instagram_url, public_page_facebook_url, public_page_website_url, public_page_contact_url, public_page_show_buvette, public_page_show_matches, public_page_show_contact";

function mapProfileToPublicData(profile: Record<string, unknown>): PublicClubPageData {
  const primaryColor =
    (typeof profile.public_page_primary_color === "string" &&
      profile.public_page_primary_color) ||
    (typeof profile.primary_color === "string" && profile.primary_color) ||
    "#1d4ed8";

  const title =
    (typeof profile.public_page_title === "string" && profile.public_page_title.trim()) ||
    (typeof profile.company_name === "string" && profile.company_name.trim()) ||
    "Club";

  return {
    title,
    description:
      typeof profile.public_page_description === "string"
        ? profile.public_page_description.trim()
        : "",
    logoUrl: typeof profile.logo_url === "string" ? profile.logo_url : null,
    primaryColor,
    instagramUrl:
      typeof profile.public_page_instagram_url === "string" &&
      profile.public_page_instagram_url.trim()
        ? profile.public_page_instagram_url.trim()
        : null,
    facebookUrl:
      typeof profile.public_page_facebook_url === "string" &&
      profile.public_page_facebook_url.trim()
        ? profile.public_page_facebook_url.trim()
        : null,
    websiteUrl:
      typeof profile.public_page_website_url === "string" &&
      profile.public_page_website_url.trim()
        ? profile.public_page_website_url.trim()
        : null,
    contactUrl:
      typeof profile.public_page_contact_url === "string" &&
      profile.public_page_contact_url.trim()
        ? profile.public_page_contact_url.trim()
        : null,
    showBuvette: profile.public_page_show_buvette !== false,
    showMatches: profile.public_page_show_matches !== false,
    showContact: profile.public_page_show_contact !== false,
    buvetteSlug:
      typeof profile.buvette_slug === "string" && profile.buvette_slug.trim()
        ? profile.buvette_slug.trim()
        : null,
  };
}

export async function resolvePublicSlug(slug: string): Promise<PublicSlugResolution> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return { type: "not_found" };

  const supabase = createAdminClient();

  const { data: clubProfile } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("public_page_slug", normalized)
    .eq("public_page_enabled", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (clubProfile) {
    return { type: "club", data: mapProfileToPublicData(clubProfile as Record<string, unknown>) };
  }

  const { data: planningLink } = await supabase
    .from("public_planning_links")
    .select("id, active, slug, token")
    .or(`slug.eq.${normalized},token.eq.${normalized}`)
    .eq("active", true)
    .maybeSingle();

  if (planningLink) {
    return { type: "planning" };
  }

  return { type: "not_found" };
}

export async function getPublicClubBySlug(slug: string): Promise<PublicClubPageData | null> {
  const resolution = await resolvePublicSlug(slug);
  if (resolution.type !== "club") return null;
  return resolution.data;
}
