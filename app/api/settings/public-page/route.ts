import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { fetchPublicPageSettings, updatePublicPageSettings } from "@/lib/public-page/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const settings = await fetchPublicPageSettings(supabase, guard.clubId);

    if (!settings) {
      return NextResponse.json({ error: "Profil club introuvable" }, { status: 404 });
    }

    return NextResponse.json({ settings });
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
      contactUrl: body.contactUrl,
      showBuvette: body.showBuvette,
      showMatches: body.showMatches,
      showContact: body.showContact,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }

    return NextResponse.json({ settings: result.settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
