import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveClubLogoUrlForClient } from "@/lib/club/resolveClubLogoUrl";
import { normalizeHexColor } from "@/lib/visuals/colors";
import type { VisualClubContext } from "@/lib/visuals/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_VISUALS);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("company_name, logo_url, logo_path, primary_color, company_address")
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const logoUrl = profile
      ? await resolveClubLogoUrlForClient(supabase, profile, guard.clubId)
      : null;

    const storedColor =
      typeof profile?.primary_color === "string" ? profile.primary_color.trim() : "";
    const primaryColor = storedColor ? normalizeHexColor(storedColor) : null;

    const context: VisualClubContext = {
      clubName:
        typeof profile?.company_name === "string" ? profile.company_name.trim() : "",
      logoUrl,
      primaryColor,
      venue:
        typeof profile?.company_address === "string"
          ? profile.company_address.trim() || null
          : null,
    };

    return NextResponse.json({ context });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
