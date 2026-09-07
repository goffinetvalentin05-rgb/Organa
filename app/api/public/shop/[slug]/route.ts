import { NextRequest, NextResponse } from "next/server";
import { resolvePublicShop } from "@/lib/shop/public";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const resolved = await resolvePublicShop(slug);
    if (!resolved) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }
    return NextResponse.json(resolved.catalog);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
