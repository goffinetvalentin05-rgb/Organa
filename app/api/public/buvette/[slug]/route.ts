import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildBuvettePublicTheme,
  mapProfileToBuvetteSettings,
  selectBuvetteProfile,
} from "@/lib/buvette/settings";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();
    const profile = await selectBuvetteProfile(supabase, "buvette_slug", slug);

    if (!profile) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 404 });
    }

    const settings = mapProfileToBuvetteSettings(profile, "");
    const theme = buildBuvettePublicTheme(settings);

    return NextResponse.json(
      {
        clubName: settings.companyName,
        logoUrl: settings.logoUrl,
        title: theme.title,
        description: theme.subtitle,
        primaryColor: theme.primaryColor,
        accentColor: theme.accentColor,
        bannerUrl: settings.bannerUrl,
        theme,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
