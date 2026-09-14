import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  mapProfileToBuvetteSettings,
  selectBuvetteProfile,
  updateBuvettePublicSettings,
} from "@/lib/buvette/settings";
import { suggestBuvetteSlug } from "@/lib/buvette/slug";

export const runtime = "nodejs";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erreur serveur";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const admin = createAdminClient();
    const profile = await selectBuvetteProfile(admin, "user_id", guard.clubId);
    const settings = mapProfileToBuvetteSettings(profile || {}, guard.clubId);

    if (!settings.slug) {
      const suggested = suggestBuvetteSlug(settings.companyName, guard.clubId);
      return NextResponse.json({
        ...settings,
        suggestedSlug: suggested,
        publicUrlPath: null,
      });
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const admin = createAdminClient();
    const result = await updateBuvettePublicSettings(admin, guard.clubId, {
      slug: body.slug,
      label: body.label,
      title: body.title,
      description: body.description ?? body.subtitle,
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      accentColor: body.accentColor,
      pageStyle: body.pageStyle,
      imagePosition: body.imagePosition,
      overlayIntensity: body.overlayIntensity,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json(result.settings);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
