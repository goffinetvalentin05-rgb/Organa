import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  mapProfileToSupportersSettings,
  SUPPORTERS_SETTINGS_PROFILE_SELECT,
  updateSupportersPageSettings,
  type SupportersBackgroundMode,
} from "@/lib/supporters/page-settings";

export const runtime = "nodejs";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erreur serveur";

async function publicPathForClub(clubId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("public_page_slug, buvette_slug")
    .eq("user_id", clubId)
    .maybeSingle();
  const slug =
    data?.public_page_slug?.trim() ||
    data?.buvette_slug?.trim() ||
    null;
  if (slug) return `/club/${slug}/supporters`;
  return null;
}

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORTERS);
    if ("error" in guard) return guard.error;

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select(SUPPORTERS_SETTINGS_PROFILE_SELECT)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (error) {
      const { data: fallback } = await admin
        .from("profiles")
        .select("company_name, logo_url, primary_color, public_page_primary_color")
        .eq("user_id", guard.clubId)
        .maybeSingle();
      const publicPath = await publicPathForClub(guard.clubId);
      return NextResponse.json(
        mapProfileToSupportersSettings(fallback || {}, publicPath)
      );
    }

    const publicPath = await publicPathForClub(guard.clubId);
    return NextResponse.json(mapProfileToSupportersSettings(profile || {}, publicPath));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORTERS);
    if ("error" in guard) return guard.error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const admin = createAdminClient();
    const result = await updateSupportersPageSettings(admin, guard.clubId, {
      title: body.title,
      subtitle: body.subtitle,
      message: body.message,
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      backgroundMode: body.backgroundMode as SupportersBackgroundMode | undefined,
      showStats: body.showStats,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    const publicPath = await publicPathForClub(guard.clubId);
    return NextResponse.json({ ...result.settings, publicPath });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
