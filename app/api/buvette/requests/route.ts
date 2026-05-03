import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildUniqueSlug } from "@/lib/buvette/slug";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { data: requests, error } = await supabase
      .from("buvette_requests")
      .select(
        "id, reservation_date, status, first_name, last_name, email, phone, event_type, message, created_at"
      )
      .eq("user_id", guard.clubId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, buvette_slug")
      .eq("user_id", guard.clubId)
      .maybeSingle();

    let slug = profile?.buvette_slug || null;
    if (!slug) {
      slug = buildUniqueSlug(profile?.company_name || "Club", guard.clubId);
      const { error: slugErr } = await supabase
        .from("profiles")
        .update({ buvette_slug: slug, updated_at: new Date().toISOString() })
        .eq("user_id", guard.clubId);
      if (slugErr) {
        slug = null;
      }
    }

    return NextResponse.json(
      {
        requests: requests || [],
        publicUrlPath: slug ? `/club/${slug}/buvette` : null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
