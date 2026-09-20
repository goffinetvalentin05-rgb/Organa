import { NextRequest, NextResponse } from "next/server";
import { isValidSupportSaleSlug } from "@/lib/support-sales/slug";
import { loadPublicSupportSale } from "@/lib/support-sales/public";
import { rateLimitGuard } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rl = rateLimitGuard(request, "support-sales:public", {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!rl.ok) return rl.response;

  try {
    const { slug } = await params;
    if (!isValidSupportSaleSlug(slug)) {
      return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    }
    const sale = await loadPublicSupportSale(slug);
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    return NextResponse.json({ sale });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
