import { buildUniqueSlug } from "@/lib/buvette/slug";

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
      };
    };
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<unknown>;
    };
  };
};

export async function getOrCreateBuvetteSlug(
  supabase: SupabaseLike,
  userId: string
): Promise<{ slug: string; companyName: string; companyEmail: string }> {
  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("company_name, company_email, buvette_slug")
    .eq("user_id", userId)
    .maybeSingle();

  const profile = (rawProfile || {}) as {
    company_name?: string | null;
    company_email?: string | null;
    buvette_slug?: string | null;
  };

  const companyName = profile?.company_name || "Club";
  const companyEmail = profile?.company_email || "";

  if (profile?.buvette_slug) {
    return { slug: profile.buvette_slug, companyName, companyEmail };
  }

  const slug = buildUniqueSlug(companyName, userId);
  await supabase
    .from("profiles")
    .update({ buvette_slug: slug, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { slug, companyName, companyEmail };
}
