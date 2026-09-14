import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Slug public du club (page club, boutique, buvette).
 * Lecture via service_role après un garde permission côté appelant :
 * JWT n’a pas GRANT sur public_page_slug / buvette_slug (migration 075).
 */
export async function resolveClubPublicSlug(
  clubId: string
): Promise<string | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("public_page_slug, buvette_slug")
    .eq("user_id", clubId)
    .maybeSingle();

  const publicSlug =
    typeof profile?.public_page_slug === "string"
      ? profile.public_page_slug.trim().toLowerCase()
      : "";
  if (publicSlug) return publicSlug;

  const { data: shop } = await admin
    .from("shop_settings")
    .select("slug")
    .eq("club_id", clubId)
    .maybeSingle();
  const shopSlug =
    typeof shop?.slug === "string" ? shop.slug.trim().toLowerCase() : "";
  if (shopSlug) return shopSlug;

  const buvetteSlug =
    typeof profile?.buvette_slug === "string"
      ? profile.buvette_slug.trim().toLowerCase()
      : "";
  return buvetteSlug || null;
}

export async function resolveClubIdByPublicSlug(
  slug: string
): Promise<string | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const admin = createAdminClient();

  const { data: byPublic } = await admin
    .from("profiles")
    .select("user_id")
    .eq("public_page_slug", normalized)
    .is("deleted_at", null)
    .maybeSingle();
  if (byPublic?.user_id) return byPublic.user_id as string;

  const { data: byShop } = await admin
    .from("shop_settings")
    .select("club_id")
    .eq("slug", normalized)
    .maybeSingle();
  if (byShop?.club_id) return byShop.club_id as string;

  const { data: byBuvette } = await admin
    .from("profiles")
    .select("user_id")
    .eq("buvette_slug", normalized)
    .is("deleted_at", null)
    .maybeSingle();
  if (byBuvette?.user_id) return byBuvette.user_id as string;

  return null;
}
