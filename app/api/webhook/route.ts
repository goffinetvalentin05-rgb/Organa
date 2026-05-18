import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/billing/handleStripeWebhook";

/**
 * Alias production : https://obillz.com/api/webhook
 * Même logique que /api/webhooks/stripe
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleStripeWebhook(request);
}
