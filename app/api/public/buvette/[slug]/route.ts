import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUVETTE_PUBLIC_DEFAULT_TITLE } from "@/lib/buvette/settings";
import { normalizeHexColor, OBILLZ_BRAND_PRIMARY } from "@/lib/public-page/colors";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "user_id, company_name, logo_url, primary_color, buvette_public_title, buvette_public_description, buvette_public_primary_color, buvette_public_accent_color, buvette_public_banner_url"
      )
      .eq("buvette_slug", slug)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 404 });
    }

    const primaryColor = normalizeHexColor(
      profile.buvette_public_primary_color || profile.primary_color,
      OBILLZ_BRAND_PRIMARY
    );
    const accentColor = profile.buvette_public_accent_color
      ? normalizeHexColor(profile.buvette_public_accent_color)
      : null;

    return NextResponse.json(
      {
        clubName: profile.company_name || "Club",
        logoUrl: profile.logo_url || null,
        title: profile.buvette_public_title?.trim() || BUVETTE_PUBLIC_DEFAULT_TITLE,
        description: profile.buvette_public_description?.trim() || null,
        primaryColor,
        accentColor,
        bannerUrl: profile.buvette_public_banner_url?.trim() || null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
