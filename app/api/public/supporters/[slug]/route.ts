import { NextRequest, NextResponse } from "next/server";
import { getPublicSupportersPage } from "@/lib/supporters/public";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const all = request.nextUrl.searchParams.get("wall") === "all";
    const page = await getPublicSupportersPage(slug, {
      wallLimit: all ? 5000 : 30,
    });
    if (!page) {
      return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
