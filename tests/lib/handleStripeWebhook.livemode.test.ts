import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const {
  constructEvent,
  handleCheckoutSessionCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
} = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  handleCheckoutSessionCompleted: vi.fn(),
  handleSubscriptionCreated: vi.fn(),
  handleSubscriptionUpdated: vi.fn(),
  handleSubscriptionDeleted: vi.fn(),
  handleInvoicePaymentSucceeded: vi.fn(),
  handleInvoicePaymentFailed: vi.fn(),
}));

vi.mock("stripe", () => {
  class StripeMock {
    webhooks = { constructEvent };
  }
  return { default: StripeMock };
});

vi.mock("@/lib/billing/stripeWebhookHandlers", () => ({
  handleCheckoutSessionCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
}));

import { handleStripeWebhook } from "@/lib/billing/handleStripeWebhook";

function makeRequest(): NextRequest {
  return {
    text: async () => JSON.stringify({ id: "evt_payload" }),
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "stripe-signature" ? "t=1,v1=sig" : null,
    },
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_live_test_key_for_unit";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_for_unit";
});

describe("handleStripeWebhook livemode guard", () => {
  it("event TEST (livemode=false) → aucun handler, pas de sync", async () => {
    constructEvent.mockReturnValue({
      id: "evt_test_1",
      type: "checkout.session.completed",
      livemode: false,
      data: { object: { id: "cs_test" } },
    });

    const res = await handleStripeWebhook(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rejected).toBe("test_mode_event");
    expect(body.event_id).toBe("evt_test_1");
    expect(handleCheckoutSessionCompleted).not.toHaveBeenCalled();
    expect(handleSubscriptionCreated).not.toHaveBeenCalled();
    expect(handleSubscriptionUpdated).not.toHaveBeenCalled();
    expect(handleSubscriptionDeleted).not.toHaveBeenCalled();
    expect(handleInvoicePaymentSucceeded).not.toHaveBeenCalled();
    expect(handleInvoicePaymentFailed).not.toHaveBeenCalled();
  });

  it("event LIVE (livemode=true) → traitement normal", async () => {
    const session = { id: "cs_live", object: "checkout.session" };
    constructEvent.mockReturnValue({
      id: "evt_live_1",
      type: "checkout.session.completed",
      livemode: true,
      data: { object: session },
    });
    handleCheckoutSessionCompleted.mockResolvedValue(undefined);

    const res = await handleStripeWebhook(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(body.event_id).toBe("evt_live_1");
    expect(body.rejected).toBeUndefined();
    expect(handleCheckoutSessionCompleted).toHaveBeenCalledTimes(1);
    expect(handleCheckoutSessionCompleted).toHaveBeenCalledWith(
      expect.anything(),
      session,
      { eventId: "evt_live_1", eventType: "checkout.session.completed" }
    );
  });
});
