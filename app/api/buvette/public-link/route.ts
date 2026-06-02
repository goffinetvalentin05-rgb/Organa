import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  mapProfileToBuvetteSettings,
  BUVETTE_SETTINGS_PROFILE_SELECT,
} from "@/lib/buvette/settings";
import { getBuvettePublicUrlPath, suggestBuvetteSlug } from "@/lib/buvette/slug";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select(BUVETTE_SETTINGS_PROFILE_SELECT)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    const companyName = profile?.company_name?.trim() || "Club";
    let slug = profile?.buvette_slug?.trim() || null;

    if (!slug) {
      slug = suggestBuvetteSlug(companyName, guard.clubId);
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
        slug,
        publicUrlPath: slug ? getBuvettePublicUrlPath(slug) : null,
        settings: mapProfileToBuvetteSettings(profile || { buvette_slug: slug }, guard.clubId),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
