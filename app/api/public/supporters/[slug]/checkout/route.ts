import { NextRequest, NextResponse } from "next/server";
import { createSupporterCheckoutSession } from "@/lib/supporters/checkout";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => null);
    const result = await createSupporterCheckoutSession({ slug, body });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[SUPPORTERS][public checkout]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
