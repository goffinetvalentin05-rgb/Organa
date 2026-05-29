import { NextResponse } from "next/server";
import { getPublicClubBySlug } from "@/lib/public-page/resolve";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await getPublicClubBySlug(slug.trim().toLowerCase());

    if (!data) {
      return NextResponse.json({ error: "Page introuvable" }, { status: 404 });
    }

    return NextResponse.json({ page: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
