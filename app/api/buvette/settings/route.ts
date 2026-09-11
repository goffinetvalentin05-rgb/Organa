import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  mapProfileToBuvetteSettings,
  updateBuvettePublicSettings,
  BUVETTE_SETTINGS_PROFILE_SELECT,
} from "@/lib/buvette/settings";
import { getBuvettePublicUrlPath, suggestBuvetteSlug } from "@/lib/buvette/slug";

export const runtime = "nodejs";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erreur serveur";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select(BUVETTE_SETTINGS_PROFILE_SELECT)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
      title: body.title,
      description: body.description,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json(result.settings);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
