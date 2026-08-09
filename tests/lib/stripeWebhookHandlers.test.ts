import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const profiles = new Map<string, Record<string, unknown>>();

function createProfilesQuery() {
  let filters: Record<string, unknown> = {};
  let updatePayload: Record<string, unknown> | null = null;
  let mode: "select" | "update" = "select";

  const execute = async () => {
    if (mode === "update" && updatePayload) {
      const userId = String(filters["user_id"] ?? "");
      const existing = profiles.get(userId);
      if (!existing) {
        return { data: [], error: null };
      }
      const next = { ...existing, ...updatePayload };
      profiles.set(userId, next);
      return { data: [{ user_id: userId }], error: null };
    }

    const userId = String(filters["user_id"] ?? "");
    const subId = filters["stripe_subscription_id"];
    const custId = filters["stripe_customer_id"];
    let row: Record<string, unknown> | null = null;
    if (userId && profiles.has(userId)) row = profiles.get(userId)!;
    else if (subId) {
      row =
        [...profiles.values()].find((p) => p.stripe_subscription_id === subId) ??
        null;
    } else if (custId) {
      row =
        [...profiles.values()].find((p) => p.stripe_customer_id === custId) ??
        null;
    }
    return { data: row, error: null };
  };

  const api: Record<string, unknown> = {
    select(_cols?: string) {
      return api;
    },
    update(payload: Record<string, unknown>) {
      mode = "update";
      updatePayload = payload;
      return api;
    },
    eq(col: string, value: unknown) {
      filters[col] = value;
      return api;
    },
    maybeSingle: () => execute(),
    then(
      onfulfilled: (v: unknown) => unknown,
      onrejected?: (e: unknown) => unknown
    ) {
      return execute().then(onfulfilled, onrejected);
    },
  };

  return api;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "profiles") {
        throw new Error(`Unexpected table ${table}`);
      }
      return createProfilesQuery();
    },
  }),
}));

vi.mock("@/lib/billing/stripePrices", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/billing/stripePrices")
  >("@/lib/billing/stripePrices");
  return {
    ...actual,
    tierFromStripePriceId: (priceId: string | null) => {
      if (priceId === "price_team_year") {
        return { tier: "team" as const, interval: "yearly" as const };
      }
      if (priceId === "price_std_month") {
        return { tier: "standard" as const, interval: "monthly" as const };
      }
      return null;
    },
  };
});

import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentSucceeded,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "@/lib/billing/stripeWebhookHandlers";
import {
  StripeWebhookSyncError,
  isPermanentSyncCode,
  syncProfileFromStripe,
} from "@/lib/billing/stripeSync";
import { mapStripeSubscriptionStatus } from "@/lib/billing/stripeStatusMap";

const EVENT = { eventId: "evt_test_1", eventType: "test" };

function baseSubscription(
  overrides: Partial<Stripe.Subscription> & {
    id?: string;
    status?: Stripe.Subscription.Status;
  } = {}
): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: overrides.id ?? "sub_1",
    object: "subscription",
    status: overrides.status ?? "active",
    customer: overrides.customer ?? "cus_1",
    metadata: overrides.metadata ?? { user_id: "user_1" },
    items: {
      object: "list",
      data: [
        {
          id: "si_1",
          object: "subscription_item",
          price: {
            id: "price_team_year",
            object: "price",
            recurring: { interval: "year", interval_count: 1 },
          } as Stripe.Price,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: "",
    },
    current_period_start: now,
    current_period_end: now + 365 * 24 * 3600,
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function mockStripe(subscription: Stripe.Subscription) {
  return {
    subscriptions: {
      retrieve: vi.fn(async () => subscription),
    },
    customers: {
      retrieve: vi.fn(async () => ({
        id: "cus_1",
        email: "club@example.com",
        deleted: undefined,
      })),
    },
  } as unknown as Stripe;
}

beforeEach(() => {
  profiles.clear();
  profiles.set("user_1", {
    user_id: "user_1",
    company_name: "FC Test",
    subscription_status: "trial",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    plan: "free",
  });
});

describe("mapStripeSubscriptionStatus", () => {
  it("mappe active/trialing/past_due → entitled", () => {
    expect(mapStripeSubscriptionStatus("active").entitled).toBe(true);
    expect(mapStripeSubscriptionStatus("trialing").entitled).toBe(true);
    expect(mapStripeSubscriptionStatus("past_due").entitled).toBe(true);
    expect(mapStripeSubscriptionStatus("past_due").obillzStatus).toBe("active");
  });

  it("mappe unpaid/canceled/paused → expired", () => {
    expect(mapStripeSubscriptionStatus("unpaid").obillzStatus).toBe("expired");
    expect(mapStripeSubscriptionStatus("canceled").obillzStatus).toBe("expired");
    expect(mapStripeSubscriptionStatus("paused").obillzStatus).toBe("expired");
  });
});

describe("A. checkout.session.completed", () => {
  it("active le profil et renseigne les IDs", async () => {
    const sub = baseSubscription();
    const stripe = mockStripe(sub);
    const session = {
      id: "cs_1",
      object: "checkout.session",
      client_reference_id: "user_1",
      metadata: {
        user_id: "user_1",
        billing_interval: "yearly",
        subscription_tier: "team",
      },
      customer: "cus_1",
      subscription: "sub_1",
      payment_status: "paid",
    } as unknown as Stripe.Checkout.Session;

    await handleCheckoutSessionCompleted(stripe, session, {
      ...EVENT,
      eventType: "checkout.session.completed",
    });

    const row = profiles.get("user_1")!;
    expect(row.subscription_status).toBe("active");
    expect(row.stripe_customer_id).toBe("cus_1");
    expect(row.stripe_subscription_id).toBe("sub_1");
    expect(row.plan).toBe("pro");
    expect(row.subscription_tier).toBe("team");
    expect(row.billing_cycle).toBe("yearly");
  });

  it("G. sans user_id → throw permanent (pas de retry Stripe utile)", async () => {
    const sub = baseSubscription({ metadata: {} });
    const stripe = mockStripe(sub);
    const session = {
      id: "cs_2",
      client_reference_id: null,
      metadata: {},
      customer: "cus_1",
      subscription: "sub_1",
      payment_status: "paid",
    } as unknown as Stripe.Checkout.Session;

    await expect(
      handleCheckoutSessionCompleted(stripe, session, {
        eventId: "evt_missing",
        eventType: "checkout.session.completed",
      })
    ).rejects.toMatchObject({
      code: "USER_ID_MISSING",
      permanent: true,
    });
    expect(isPermanentSyncCode("USER_ID_MISSING")).toBe(true);
    expect(isPermanentSyncCode("AMBIGUOUS_EMAIL")).toBe(true);
    expect(isPermanentSyncCode("PROFILE_NOT_FOUND")).toBe(false);
    expect(isPermanentSyncCode("USER_NOT_FOUND")).toBe(false);
  });
});

describe("B. customer.subscription.created", () => {
  it("synchronise le profil via metadata.user_id", async () => {
    const sub = baseSubscription({ status: "active" });
    const stripe = mockStripe(sub);

    await handleSubscriptionCreated(stripe, sub, {
      eventId: "evt_sub_created",
      eventType: "customer.subscription.created",
    });

    const row = profiles.get("user_1")!;
    expect(row.subscription_status).toBe("active");
    expect(row.stripe_subscription_id).toBe("sub_1");
    expect(row.stripe_customer_id).toBe("cus_1");
  });

  it("ignore incomplete sans erreur", async () => {
    const sub = baseSubscription({ status: "incomplete" });
    const stripe = mockStripe(sub);

    await handleSubscriptionCreated(stripe, sub, {
      eventId: "evt_inc",
      eventType: "customer.subscription.created",
    });

    expect(profiles.get("user_1")!.subscription_status).toBe("trial");
  });
});

describe("C/D. customer.subscription.updated", () => {
  it("C. active → active", async () => {
    profiles.set("user_1", {
      ...profiles.get("user_1")!,
      stripe_subscription_id: "sub_1",
      stripe_customer_id: "cus_1",
    });
    const sub = baseSubscription({ status: "active" });
    await handleSubscriptionUpdated(mockStripe(sub), sub, {
      eventId: "evt_upd_a",
      eventType: "customer.subscription.updated",
    });
    expect(profiles.get("user_1")!.subscription_status).toBe("active");
  });

  it("D. unpaid → expired", async () => {
    profiles.set("user_1", {
      ...profiles.get("user_1")!,
      subscription_status: "active",
      stripe_subscription_id: "sub_1",
      stripe_customer_id: "cus_1",
      plan: "pro",
    });
    const sub = baseSubscription({ status: "unpaid" });
    await handleSubscriptionUpdated(mockStripe(sub), sub, {
      eventId: "evt_upd_u",
      eventType: "customer.subscription.updated",
    });
    const row = profiles.get("user_1")!;
    expect(row.subscription_status).toBe("expired");
    expect(row.plan).toBe("free");
    expect(row.stripe_subscription_id).toBe("sub_1");
  });

  it("past_due → conserve active (grace)", async () => {
    profiles.set("user_1", {
      ...profiles.get("user_1")!,
      subscription_status: "active",
      stripe_subscription_id: "sub_1",
      stripe_customer_id: "cus_1",
    });
    const sub = baseSubscription({ status: "past_due" });
    await handleSubscriptionUpdated(mockStripe(sub), sub, {
      eventId: "evt_pd",
      eventType: "customer.subscription.updated",
    });
    expect(profiles.get("user_1")!.subscription_status).toBe("active");
  });
});

describe("E. customer.subscription.deleted", () => {
  it("expire mais conserve les IDs Stripe", async () => {
    profiles.set("user_1", {
      user_id: "user_1",
      subscription_status: "active",
      stripe_subscription_id: "sub_1",
      stripe_customer_id: "cus_1",
      plan: "pro",
    });
    const sub = baseSubscription({ status: "canceled" });
    await handleSubscriptionDeleted(mockStripe(sub), sub, {
      eventId: "evt_del",
      eventType: "customer.subscription.deleted",
    });
    const row = profiles.get("user_1")!;
    expect(row.subscription_status).toBe("expired");
    expect(row.plan).toBe("free");
    expect(row.stripe_subscription_id).toBe("sub_1");
    expect(row.stripe_customer_id).toBe("cus_1");
  });
});

describe("F. invoice.payment_succeeded", () => {
  it("resynchronise le profil", async () => {
    const sub = baseSubscription();
    const stripe = mockStripe(sub);
    const invoice = {
      id: "in_1",
      subscription: "sub_1",
      customer: "cus_1",
    } as unknown as Stripe.Invoice;

    await handleInvoicePaymentSucceeded(stripe, invoice, {
      eventId: "evt_inv",
      eventType: "invoice.payment_succeeded",
    });

    expect(profiles.get("user_1")!.subscription_status).toBe("active");
    expect(profiles.get("user_1")!.stripe_subscription_id).toBe("sub_1");
  });
});

describe("H. update 0 ligne", () => {
  it("throw PROFILE_NOT_FOUND", async () => {
    await expect(
      syncProfileFromStripe({
        userId: "missing_user",
        billingCycle: "yearly",
        subscriptionTier: "team",
        stripeSubscriptionId: "sub_x",
        stripeCustomerId: "cus_x",
        active: true,
      })
    ).rejects.toMatchObject({ code: "PROFILE_NOT_FOUND" });
  });
});

describe("I. idempotence double livraison", () => {
  it("deux checkout.session.completed → état final cohérent", async () => {
    const sub = baseSubscription();
    const stripe = mockStripe(sub);
    const session = {
      id: "cs_1",
      client_reference_id: "user_1",
      metadata: {
        user_id: "user_1",
        billing_interval: "yearly",
        subscription_tier: "team",
      },
      customer: "cus_1",
      subscription: "sub_1",
      payment_status: "paid",
    } as unknown as Stripe.Checkout.Session;

    const ctx = {
      eventId: "evt_dup",
      eventType: "checkout.session.completed",
    };
    await handleCheckoutSessionCompleted(stripe, session, ctx);
    await handleCheckoutSessionCompleted(stripe, session, ctx);

    const row = profiles.get("user_1")!;
    expect(row.subscription_status).toBe("active");
    expect(row.stripe_subscription_id).toBe("sub_1");
    expect(row.stripe_customer_id).toBe("cus_1");
  });
});

describe("user introuvable sur updated", () => {
  it("throw USER_NOT_FOUND", async () => {
    profiles.clear();
    const sub = baseSubscription({
      metadata: {},
      customer: "cus_unknown",
      id: "sub_unknown",
    });
    await expect(
      handleSubscriptionUpdated(mockStripe(sub), sub, {
        eventId: "evt_nf",
        eventType: "customer.subscription.updated",
      })
    ).rejects.toMatchObject({ code: "USER_NOT_FOUND" });
  });
});
