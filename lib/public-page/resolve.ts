import { createAdminClient } from "@/lib/supabase/admin";
import { fetchActivePublicPageLinksForClub } from "./links-db";
import {
  getMatchProgramPdfPublicUrl,
  isMatchProgramConfigured,
} from "./match-program";
import type { PublicClubPageData } from "./types";
import { mapProfileToSettings, selectEnabledPublicClubProfileBySlug } from "./db";
import { buildPublicClubTheme } from "./branding";

export type PublicSlugResolution =
  | { type: "club"; data: PublicClubPageData }
  | { type: "planning" }
  | { type: "not_found" };

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

  const theme = buildPublicClubTheme({
    ...settings,
    clubName: settings.companyName,
  });

  return {
    clubName: settings.companyName,
    title: theme.title,
    description: theme.subtitle,
    logoUrl: settings.logoUrl,
    primaryColor: theme.primaryColor,
    instagramUrl: trimSocialUrl(profile.public_page_instagram_url),
    facebookUrl: trimSocialUrl(profile.public_page_facebook_url),
    websiteUrl: trimSocialUrl(profile.public_page_website_url),
    showBuvette: profile.public_page_show_buvette !== false,
    buvetteSlug:
      typeof profile.buvette_slug === "string" && profile.buvette_slug.trim()
        ? profile.buvette_slug.trim()
        : null,
    theme,
    matchProgram,
    publicLinks,
  };
}

export async function resolvePublicSlug(slug: string): Promise<PublicSlugResolution> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return { type: "not_found" };

  const supabase = createAdminClient();

  let clubProfile: Record<string, unknown> | null = null;
  try {
    clubProfile = await selectEnabledPublicClubProfileBySlug(supabase, normalized);
  } catch {
    clubProfile = null;
  }

  if (clubProfile) {
    const clubId = String(clubProfile.user_id);
    const data = await mapProfileToPublicClubData(clubProfile, clubId);
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
