import { NextRequest, NextResponse } from "next/server";
import { createShopCheckoutSession } from "@/lib/shop/create-checkout-session";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Données invalides." }, { status: 400 });
    }
    const result = await createShopCheckoutSession({
      slug,
      items: (body as { items?: unknown }).items,
      customer: {
        firstName: (body as { firstName?: unknown }).firstName,
        lastName: (body as { lastName?: unknown }).lastName,
        email: (body as { email?: unknown }).email,
        phone: (body as { phone?: unknown }).phone,
      },
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[SHOP][public checkout]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
