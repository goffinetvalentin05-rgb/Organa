import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  fetchPublicPageSettingsBundle,
  updatePublicPageSettings,
} from "@/lib/public-page/db";
import type { MatchProgramType } from "@/lib/public-page/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const bundle = await fetchPublicPageSettingsBundle(supabase, guard.clubId);

    if (!bundle) {
      return NextResponse.json({ error: "Profil club introuvable" }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const matchProgramType: MatchProgramType | null =
      body.matchProgramType === "external_url" || body.matchProgramType === "pdf"
        ? body.matchProgramType
        : body.matchProgramType === null
          ? null
          : undefined;

    const supabase = await createClient();
    const result = await updatePublicPageSettings(supabase, guard.clubId, {
      enabled: body.enabled,
      slug: body.slug,
      title: body.title,
      description: body.description,
      primaryColor: body.primaryColor,
      instagramUrl: body.instagramUrl,
      facebookUrl: body.facebookUrl,
      websiteUrl: body.websiteUrl,
      showBuvette: body.showBuvette,
      showMatchProgram: body.showMatchProgram,
      matchProgramType,
      matchProgramUrl: body.matchProgramUrl,
      showPublicLinks: body.showPublicLinks,
      links: body.links,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    const bundle = await fetchPublicPageSettingsBundle(supabase, guard.clubId);

    return NextResponse.json({
      settings: result.settings ?? bundle?.settings,
      links: result.links ?? bundle?.links ?? [],
      qrcodeOptions: bundle?.qrcodeOptions ?? [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
