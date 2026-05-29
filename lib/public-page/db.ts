import type { SupabaseClient } from "@supabase/supabase-js";
import { suggestPublicPageSlug, normalizePublicPageSlug, isValidPublicPageSlug } from "./slug";
import {
  fetchPublicPageLinks,
  fetchQrcodeOptionsForPublicPage,
  syncPublicPageLinks,
} from "./links-db";
import { getMatchProgramPdfPublicUrl } from "./match-program";
import { normalizeAndValidatePublicUrl } from "./urls";
import type {
  MatchProgramType,
  PublicPageLinkInput,
  PublicPageSettings,
  PublicPageSettingsResponse,
} from "./types";

const SETTINGS_SELECT =
  "user_id, company_name, logo_url, primary_color, buvette_slug, public_page_enabled, public_page_slug, public_page_title, public_page_description, public_page_primary_color, public_page_instagram_url, public_page_facebook_url, public_page_website_url, public_page_show_buvette, public_page_show_match_program, public_page_match_program_type, public_page_match_program_url, public_page_match_program_pdf_path, public_page_match_program_pdf_name, public_page_show_public_links";

function parseMatchProgramType(value: unknown): MatchProgramType | null {
  if (value === "external_url" || value === "pdf") return value;
  return null;
}

export function mapProfileToSettings(
  profile: Record<string, unknown>,
  pdfPublicUrl?: string | null
): PublicPageSettings {
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

  const pdfPath =
    typeof profile.public_page_match_program_pdf_path === "string"
      ? profile.public_page_match_program_pdf_path
      : null;

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
    showBuvette: profile.public_page_show_buvette !== false,
    showMatchProgram: profile.public_page_show_match_program === true,
    matchProgramType: parseMatchProgramType(profile.public_page_match_program_type),
    matchProgramUrl:
      typeof profile.public_page_match_program_url === "string"
        ? profile.public_page_match_program_url
        : null,
    matchProgramPdfPath: pdfPath,
    matchProgramPdfName:
      typeof profile.public_page_match_program_pdf_name === "string"
        ? profile.public_page_match_program_pdf_name
        : null,
    matchProgramPdfUrl: pdfPath ? pdfPublicUrl || getMatchProgramPdfPublicUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      pdfPath
    ) : null,
    showPublicLinks: profile.public_page_show_public_links === true,
    publicUrlPath:
      profile.public_page_enabled === true && slug ? `/p/${slug}` : null,
    buvetteSlug:
      typeof profile.buvette_slug === "string" && profile.buvette_slug.trim()
        ? profile.buvette_slug.trim()
        : null,
  };
}

export async function fetchPublicPageSettingsBundle(
  supabase: SupabaseClient,
  clubId: string
): Promise<PublicPageSettingsResponse | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(SETTINGS_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  if (error || !data) return null;

  const profile = data as Record<string, unknown>;
  const pdfPath =
    typeof profile.public_page_match_program_pdf_path === "string"
      ? profile.public_page_match_program_pdf_path
      : null;
  const pdfUrl = pdfPath
    ? getMatchProgramPdfPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "", pdfPath)
    : null;

  const [links, qrcodeOptions] = await Promise.all([
    fetchPublicPageLinks(supabase, clubId),
    fetchQrcodeOptionsForPublicPage(supabase, clubId),
  ]);

  return {
    settings: mapProfileToSettings(profile, pdfUrl),
    links,
    qrcodeOptions,
  };
}

export async function fetchPublicPageSettings(
  supabase: SupabaseClient,
  clubId: string
): Promise<PublicPageSettings | null> {
  const bundle = await fetchPublicPageSettingsBundle(supabase, clubId);
  return bundle?.settings ?? null;
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
  showBuvette?: boolean;
  showMatchProgram?: boolean;
  matchProgramType?: MatchProgramType | null;
  matchProgramUrl?: string | null;
  showPublicLinks?: boolean;
  links?: PublicPageLinkInput[];
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
): Promise<{
  settings?: PublicPageSettings;
  links?: PublicPageSettingsResponse["links"];
  error?: string;
  status?: number;
}> {
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

  const showMatchProgram =
    input.showMatchProgram !== undefined
      ? Boolean(input.showMatchProgram)
      : profile.public_page_show_match_program === true;

  let matchProgramType =
    input.matchProgramType !== undefined
      ? input.matchProgramType
      : parseMatchProgramType(profile.public_page_match_program_type);

  let matchProgramUrl =
    input.matchProgramUrl !== undefined
      ? trimOrNull(input.matchProgramUrl)
      : typeof profile.public_page_match_program_url === "string"
        ? profile.public_page_match_program_url
        : null;

  if (!showMatchProgram) {
    matchProgramType = null;
    matchProgramUrl = null;
  } else if (matchProgramType === "external_url" && matchProgramUrl) {
    const validated = normalizeAndValidatePublicUrl(matchProgramUrl);
    if (!validated.ok) {
      return { error: validated.error, status: 400 };
    }
    matchProgramUrl = validated.url;
  } else if (matchProgramType === "external_url" && !matchProgramUrl) {
    matchProgramUrl = null;
  }

  if (matchProgramType === "pdf") {
    matchProgramUrl = null;
  }

  if (showMatchProgram && matchProgramType === "external_url" && !matchProgramUrl) {
    matchProgramType = null;
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
    public_page_show_buvette:
      input.showBuvette !== undefined ? Boolean(input.showBuvette) : profile.public_page_show_buvette !== false,
    public_page_show_match_program: showMatchProgram,
    public_page_match_program_type: matchProgramType,
    public_page_match_program_url: matchProgramType === "external_url" ? matchProgramUrl : null,
    public_page_show_public_links:
      input.showPublicLinks !== undefined
        ? Boolean(input.showPublicLinks)
        : profile.public_page_show_public_links === true,
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

  let linksResult: PublicPageSettingsResponse["links"] | undefined;
  if (input.links !== undefined) {
    const sync = await syncPublicPageLinks(supabase, clubId, input.links);
    if (sync.error) {
      return { error: sync.error, status: sync.status || 500 };
    }
    linksResult = sync.links;
  }

  const updatedProfile = updated as Record<string, unknown>;
  const pdfPath =
    typeof updatedProfile.public_page_match_program_pdf_path === "string"
      ? updatedProfile.public_page_match_program_pdf_path
      : null;
  const pdfUrl = pdfPath
    ? getMatchProgramPdfPublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "", pdfPath)
    : null;

  return {
    settings: mapProfileToSettings(updatedProfile, pdfUrl),
    links: linksResult,
  };
}
