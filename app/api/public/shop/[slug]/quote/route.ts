import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePublicShop } from "@/lib/shop/public";
import { loadClubProductsForQuote, parseCartItems, quoteCart } from "@/lib/shop/checkout";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const resolved = await resolvePublicShop(slug);
    if (!resolved) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    const body = await request.json().catch(() => null);
    const items = parseCartItems(body?.items);
    if ("error" in items) return NextResponse.json({ error: items.error }, { status: 400 });

    const supabase = createAdminClient();
    const products = await loadClubProductsForQuote(
      supabase,
      resolved.clubId,
      items.map((i) => i.productId)
    );
    const quote = quoteCart(items, products);
    if ("error" in quote) return NextResponse.json({ error: quote.error }, { status: 400 });

    return NextResponse.json({
      canCheckout: resolved.catalog.canCheckout,
      checkoutBlockedReason: resolved.catalog.checkoutBlockedReason,
      pickupInfo: resolved.catalog.pickupInfo,
      currency: "CHF",
      totalCents: quote.totalCents,
      lines: quote.lines.map((line) => ({
        productId: line.product.id,
        variantId: line.variant?.id || null,
        name: line.product.name,
        variantLabel: line.variant?.label || null,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
        imageUrl: line.product.images[0]?.publicUrl || null,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
