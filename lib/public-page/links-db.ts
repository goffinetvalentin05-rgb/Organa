import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAndValidatePublicUrl, normalizePublicPathUrl } from "./urls";
import type { PublicPageLink, PublicPageLinkInput, PublicPageLinkType } from "./types";

const LINKS_SELECT =
  "id, club_id, title, description, url, type, qrcode_id, is_active, sort_order, created_at, updated_at";

export function mapLinkRow(row: Record<string, unknown>): PublicPageLink {
  return {
    id: String(row.id),
    title: String(row.title || ""),
    description: typeof row.description === "string" ? row.description : null,
    url: String(row.url || ""),
    type: (row.type as PublicPageLinkType) || "custom",
    qrcodeId: typeof row.qrcode_id === "string" ? row.qrcode_id : null,
    isActive: row.is_active !== false,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  };
}

export async function fetchPublicPageLinks(
  supabase: SupabaseClient,
  clubId: string
): Promise<PublicPageLink[]> {
  const { data, error } = await supabase
    .from("public_page_links")
    .select(LINKS_SELECT)
    .eq("club_id", clubId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapLinkRow(row as Record<string, unknown>));
}

export async function fetchActivePublicPageLinksForClub(
  supabase: SupabaseClient,
  clubId: string
): Promise<PublicPageLink[]> {
  const { data, error } = await supabase
    .from("public_page_links")
    .select(LINKS_SELECT)
    .eq("club_id", clubId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapLinkRow(row as Record<string, unknown>));
}

function validateLinkInput(
  link: PublicPageLinkInput
): { ok: true; url: string } | { ok: false; error: string } {
  const rawUrl = link.url.trim();
  if (rawUrl.startsWith("/")) {
    return { ok: true, url: normalizePublicPathUrl(rawUrl) };
  }
  return normalizeAndValidatePublicUrl(rawUrl, { allowMailto: true });
}

export async function syncPublicPageLinks(
  supabase: SupabaseClient,
  clubId: string,
  links: PublicPageLinkInput[]
): Promise<{ links?: PublicPageLink[]; error?: string; status?: number }> {
  if (!Array.isArray(links)) {
    return { error: "Liste de liens invalide", status: 400 };
  }

  const validated: PublicPageLinkInput[] = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const title = String(link.title || "").trim();
    if (!title) {
      return { error: `Lien ${i + 1} : titre requis`, status: 400 };
    }
    const urlCheck = validateLinkInput(link);
    if (!urlCheck.ok) {
      return { error: `Lien « ${title} » : ${urlCheck.error}`, status: 400 };
    }
    const allowedTypes: PublicPageLinkType[] = ["qr_code", "event", "buvette", "custom"];
    const type = allowedTypes.includes(link.type) ? link.type : "custom";
    validated.push({
      ...link,
      title,
      url: urlCheck.url,
      type,
      sortOrder: typeof link.sortOrder === "number" ? link.sortOrder : i,
      isActive: link.isActive !== false,
    });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("public_page_links")
    .select("id")
    .eq("club_id", clubId);

  if (fetchError) {
    return { error: fetchError.message, status: 500 };
  }

  const keepIds = new Set(
    validated.map((l) => l.id).filter((id): id is string => Boolean(id))
  );
  const toDelete = (existing || [])
    .map((r) => String(r.id))
    .filter((id) => !keepIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("public_page_links")
      .delete()
      .eq("club_id", clubId)
      .in("id", toDelete);
    if (deleteError) {
      return { error: deleteError.message, status: 500 };
    }
  }

  for (const link of validated) {
    const payload = {
      club_id: clubId,
      title: link.title,
      description: link.description?.trim() || null,
      url: link.url,
      type: link.type,
      qrcode_id: link.qrcodeId || null,
      is_active: link.isActive !== false,
      sort_order: link.sortOrder,
      updated_at: new Date().toISOString(),
    };

    if (link.id) {
      const { error } = await supabase
        .from("public_page_links")
        .update(payload)
        .eq("id", link.id)
        .eq("club_id", clubId);
      if (error) return { error: error.message, status: 500 };
    } else {
      const { error } = await supabase.from("public_page_links").insert(payload);
      if (error) return { error: error.message, status: 500 };
    }
  }

  const updated = await fetchPublicPageLinks(supabase, clubId);
  return { links: updated };
}

export interface QrcodePublicOption {
  id: string;
  name: string;
  code: string;
  registrationPath: string;
}

export async function fetchQrcodeOptionsForPublicPage(
  supabase: SupabaseClient,
  clubId: string
): Promise<QrcodePublicOption[]> {
  const { data, error } = await supabase
    .from("qrcodes")
    .select("id, name, code, is_active")
    .eq("user_id", clubId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((row) => typeof row.code === "string" && row.code.trim())
    .map((row) => ({
      id: String(row.id),
      name: String(row.name || "QR code"),
      code: String(row.code),
      registrationPath: `/inscription/${row.code}`,
    }));
}
