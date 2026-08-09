import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/billing/handleStripeWebhook";

/**
 * Endpoint webhook moderne.
 * Délègue 100% à lib/billing/handleStripeWebhook.ts
 * (même handler que /api/webhook).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleStripeWebhook(request);
}
