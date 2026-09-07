import { NextResponse } from "next/server";
import { createMembershipCheckoutSession } from "@/lib/quotes/create-checkout-session";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
    }
    const result = await createMembershipCheckoutSession({ token });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ url: result.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[COTISATION][checkout]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
