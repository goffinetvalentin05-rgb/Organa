import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildUniqueSlug } from "@/lib/buvette/slug";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from("buvette_requests")
      .select(
        "id, reservation_date, status, first_name, last_name, email, phone, event_type, message, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, buvette_slug")
      .eq("user_id", user.id)
      .maybeSingle();

    let slug = profile?.buvette_slug || null;
    if (!slug) {
      slug = buildUniqueSlug(profile?.company_name || "Club", user.id);
      await supabase
        .from("profiles")
        .update({ buvette_slug: slug, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    return NextResponse.json(
      {
        requests: requests || [],
        publicUrlPath: `/buvette/${slug}`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
