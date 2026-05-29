import { createAdminClient } from "@/lib/supabase/admin";
import { fetchActivePublicPageLinksForClub } from "./links-db";
import {
  getMatchProgramPdfPublicUrl,
  isMatchProgramConfigured,
} from "./match-program";
import type { MatchProgramType, PublicClubPageData } from "./types";
import { mapProfileToSettings } from "./db";

export type PublicSlugResolution =
  | { type: "club"; data: PublicClubPageData }
  | { type: "planning" }
  | { type: "not_found" };

const PUBLIC_PROFILE_SELECT =
  "user_id, company_name, logo_url, primary_color, buvette_slug, public_page_enabled, public_page_slug, public_page_title, public_page_description, public_page_primary_color, public_page_instagram_url, public_page_facebook_url, public_page_website_url, public_page_show_buvette, public_page_show_match_program, public_page_match_program_type, public_page_match_program_url, public_page_match_program_pdf_path, public_page_match_program_pdf_name, public_page_show_public_links";

function trimSocialUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:")
  );
}

async function mapProfileToPublicClubData(
  profile: Record<string, unknown>,
  clubId: string
): Promise<PublicClubPageData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const pdfPath =
    typeof profile.public_page_match_program_pdf_path === "string"
      ? profile.public_page_match_program_pdf_path
      : null;
  const settings = mapProfileToSettings(
    profile,
    pdfPath ? getMatchProgramPdfPublicUrl(supabaseUrl, pdfPath) : null
  );

  let matchProgram: PublicClubPageData["matchProgram"] = null;
  if (isMatchProgramConfigured(settings)) {
    if (settings.matchProgramType === "external_url" && settings.matchProgramUrl) {
      matchProgram = {
        label: "Voir le programme des matchs",
        href: settings.matchProgramUrl,
        external: true,
      };
    } else if (settings.matchProgramType === "pdf" && settings.matchProgramPdfUrl) {
      matchProgram = {
        label: "Voir le programme des matchs",
        href: settings.matchProgramPdfUrl,
        external: true,
      };
    }
  }

  const admin = createAdminClient();
  const rawLinks = settings.showPublicLinks
    ? await fetchActivePublicPageLinksForClub(admin, clubId)
    : [];

  const publicLinks = rawLinks.map((link) => ({
    id: link.id,
    title: link.title,
    description: link.description,
    url: link.url,
    external: isExternalHref(link.url),
  }));

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
    instagramUrl: trimSocialUrl(profile.public_page_instagram_url),
    facebookUrl: trimSocialUrl(profile.public_page_facebook_url),
    websiteUrl: trimSocialUrl(profile.public_page_website_url),
    showBuvette: profile.public_page_show_buvette !== false,
    buvetteSlug:
      typeof profile.buvette_slug === "string" && profile.buvette_slug.trim()
        ? profile.buvette_slug.trim()
        : null,
    matchProgram,
    publicLinks,
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
    const clubId = String(clubProfile.user_id);
    const data = await mapProfileToPublicClubData(
      clubProfile as Record<string, unknown>,
      clubId
    );
    return { type: "club", data };
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
