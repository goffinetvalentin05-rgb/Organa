import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("user_id, company_name, logo_url, primary_color")
      .eq("buvette_slug", slug)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 404 });
    }

    return NextResponse.json(
      {
        clubName: profile.company_name || "Club",
        logoUrl: profile.logo_url || null,
        primaryColor: profile.primary_color || "#1d4ed8",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
