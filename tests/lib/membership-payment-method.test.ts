import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  francsToStripeCents,
  isMembershipPaidStatus,
  membershipPurposeFromMetadata,
  parseMembershipPaymentMethod,
  resolveMembershipPaymentMethod,
} from "@/lib/quotes/payment-method";
import {
  handleMembershipCheckoutSession,
  isMembershipStripeEvent,
  markMembershipPaidFromStripe,
} from "@/lib/quotes/stripe-membership";
import { isShopStripeEvent } from "@/lib/shop/stripe-webhook";
import type Stripe from "stripe";

describe("membership payment method", () => {
  it("parses known methods only", () => {
    expect(parseMembershipPaymentMethod("qr_invoice")).toBe("qr_invoice");
    expect(parseMembershipPaymentMethod("stripe")).toBe("stripe");
    expect(parseMembershipPaymentMethod("card")).toBeNull();
    expect(parseMembershipPaymentMethod(null)).toBeNull();
  });

  it("treats missing document method as QR invoice", () => {
    expect(resolveMembershipPaymentMethod(null)).toBe("qr_invoice");
    expect(resolveMembershipPaymentMethod(undefined)).toBe("qr_invoice");
  });

  it("converts francs to Stripe cents", () => {
    expect(francsToStripeCents(150)).toBe(15000);
    expect(francsToStripeCents("79.90")).toBe(7990);
    expect(francsToStripeCents(0)).toBeNull();
    expect(francsToStripeCents(-1)).toBeNull();
  });

  it("treats accepte and paye as paid", () => {
    expect(isMembershipPaidStatus("accepte")).toBe(true);
    expect(isMembershipPaidStatus("paye")).toBe(true);
    expect(isMembershipPaidStatus("envoye")).toBe(false);
  });

  it("detects membership purpose from metadata aliases", () => {
    expect(
      membershipPurposeFromMetadata({ obillz_purpose: "club_membership" })
    ).toBe(true);
    expect(membershipPurposeFromMetadata({ type: "club_membership" })).toBe(true);
    expect(membershipPurposeFromMetadata({ obillz_purpose: "club_shop" })).toBe(
      false
    );
  });
});

const documents = new Map<string, Record<string, unknown>>();
let lastUpdate: Record<string, unknown> | null = null;
let updateFilters: Record<string, unknown> = {};

function createDocumentsQuery() {
  let filters: Record<string, unknown> = {};
  let mode: "select" | "update" = "select";
  let payload: Record<string, unknown> | null = null;

  const executeSelect = async () => {
    if (filters.stripe_checkout_session_id && !filters.id) {
      const row =
        [...documents.values()].find(
          (r) =>
            r.stripe_checkout_session_id === filters.stripe_checkout_session_id
        ) ?? null;
      if (row && filters.type && row.type !== filters.type) {
        return { data: null, error: null };
      }
      return { data: row, error: null };
    }
    const id = String(filters.id ?? "");
    const row = documents.get(id) ?? null;
    if (row && filters.user_id && row.user_id !== filters.user_id) {
      return { data: null, error: null };
    }
    if (row && filters.type && row.type !== filters.type) {
      return { data: null, error: null };
    }
    return { data: row, error: null };
  };

  const executeUpdate = async () => {
    lastUpdate = payload;
    updateFilters = { ...filters };
    const id = String(filters.id ?? "");
    const row = documents.get(id);
    if (!row) return { data: null, error: { message: "missing" } };
    if (filters.user_id && row.user_id !== filters.user_id) {
      return { data: null, error: { message: "scope" } };
    }
    if (filters.statusNeq && row.status === filters.statusNeq) {
      return { data: null, error: null };
    }
    documents.set(id, { ...row, ...payload });
    return { data: { id }, error: null };
  };

  const api: Record<string, unknown> = {
    select() {
      return api;
    },
    update(next: Record<string, unknown>) {
      mode = "update";
      payload = next;
      return api;
    },
    eq(col: string, value: unknown) {
      filters[col] = value;
      return api;
    },
    neq(col: string, value: unknown) {
      if (col === "status") filters.statusNeq = value;
      return api;
    },
    maybeSingle: () => (mode === "update" ? executeUpdate() : executeSelect()),
    then(
      onfulfilled: (v: unknown) => unknown,
      onrejected?: (e: unknown) => unknown
    ) {
      const run = mode === "update" ? executeUpdate() : executeSelect();
      return run.then(onfulfilled, onrejected);
    },
  };
  return api;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "documents") throw new Error(`Unexpected table ${table}`);
      return createDocumentsQuery();
    },
  }),
}));

describe("markMembershipPaidFromStripe", () => {
  beforeEach(() => {
    documents.clear();
    lastUpdate = null;
    updateFilters = {};
    documents.set("doc-1", {
      id: "doc-1",
      user_id: "club-a",
      type: "quote",
      status: "envoye",
      payment_method: "stripe",
      total_ttc: 150,
      stripe_payment_intent_id: null,
      stripe_checkout_session_id: "cs_1",
    });
  });

  it("marks a Stripe membership as paid", async () => {
    await markMembershipPaidFromStripe({
      documentId: "doc-1",
      clubId: "club-a",
      expectedAccountId: "acct_club",
      eventAccountId: "acct_club",
      sessionId: "cs_1",
      paymentIntentId: "pi_1",
      chargeId: "ch_1",
      amountCents: 15000,
    });
    const row = documents.get("doc-1")!;
    expect(row.status).toBe("accepte");
    expect(row.stripe_payment_intent_id).toBe("pi_1");
    expect(row.date_paiement).toBeTruthy();
    expect(lastUpdate).toMatchObject({ status: "accepte" });
    expect(updateFilters.statusNeq).toBe("accepte");
  });

  it("is idempotent when already paid with the same intent", async () => {
    documents.set("doc-1", {
      id: "doc-1",
      user_id: "club-a",
      type: "quote",
      status: "accepte",
      payment_method: "stripe",
      total_ttc: 150,
      stripe_payment_intent_id: "pi_1",
      stripe_checkout_session_id: "cs_1",
    });
    await markMembershipPaidFromStripe({
      documentId: "doc-1",
      clubId: "club-a",
      expectedAccountId: "acct_club",
      eventAccountId: "acct_club",
      sessionId: "cs_1",
      paymentIntentId: "pi_1",
      chargeId: "ch_1",
      amountCents: 15000,
    });
    expect(lastUpdate).toBeNull();
  });

  it("does not update when already paid even with another event", async () => {
    documents.set("doc-1", {
      id: "doc-1",
      user_id: "club-a",
      type: "quote",
      status: "accepte",
      payment_method: "stripe",
      total_ttc: 150,
      stripe_payment_intent_id: "pi_old",
      stripe_checkout_session_id: "cs_1",
    });
    await markMembershipPaidFromStripe({
      documentId: "doc-1",
      clubId: "club-a",
      expectedAccountId: "acct_club",
      eventAccountId: "acct_club",
      sessionId: "cs_2",
      paymentIntentId: "pi_2",
      chargeId: "ch_2",
      amountCents: 15000,
    });
    expect(lastUpdate).toBeNull();
    expect(documents.get("doc-1")!.stripe_payment_intent_id).toBe("pi_old");
  });

  it("finds the document by checkout session id when metadata id is missing", async () => {
    await markMembershipPaidFromStripe({
      documentId: "unknown",
      clubId: "club-a",
      expectedAccountId: "acct_club",
      eventAccountId: "acct_club",
      sessionId: "cs_1",
      paymentIntentId: "pi_1",
      chargeId: "ch_1",
      amountCents: 15000,
    });
    expect(documents.get("doc-1")!.status).toBe("accepte");
    expect(lastUpdate).toMatchObject({ status: "accepte" });
  });

  it("marks the cotisation paid from a Checkout session payload", async () => {
    const session = {
      id: "cs_1",
      payment_status: "paid",
      amount_total: 100,
      metadata: {
        obillz_purpose: "club_membership",
        club_id: "club-a",
        document_id: "doc-1",
        connected_account_id: "acct_club",
      },
      payment_intent: {
        id: "pi_1",
        latest_charge: "ch_1",
      },
    } as unknown as Stripe.Checkout.Session;
    const stripe = {
      checkout: {
        sessions: {
          retrieve: vi.fn(async () => session),
        },
      },
    } as unknown as Stripe;
    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      account: "acct_club",
      data: { object: session },
    } as unknown as Stripe.Event;

    await handleMembershipCheckoutSession(stripe, event, session, "acct_club");
    expect(documents.get("doc-1")!.status).toBe("accepte");
    expect(documents.get("doc-1")!.stripe_charge_id).toBe("ch_1");
  });
});

describe("membership stripe event routing", () => {
  it("detects membership checkout events from obillz_purpose", () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: { metadata: { obillz_purpose: "club_membership" } },
      },
    } as unknown as Stripe.Event;
    expect(isMembershipStripeEvent(event)).toBe(true);
  });

  it("detects membership events from metadata.type alias", () => {
    const event = {
      type: "checkout.session.completed",
      data: { object: { metadata: { type: "club_membership" } } },
    } as unknown as Stripe.Event;
    expect(isMembershipStripeEvent(event)).toBe(true);
  });

  it("routes Connect checkout events to the shop/membership handler even without metadata", () => {
    const event = {
      type: "checkout.session.completed",
      account: "acct_club",
      data: { object: { metadata: {} } },
    } as unknown as Stripe.Event;
    expect(isShopStripeEvent(event)).toBe(true);
  });

  it("does not treat platform SaaS checkout as a shop event", () => {
    const event = {
      type: "checkout.session.completed",
      data: { object: { metadata: { user_id: "user-1" } } },
    } as unknown as Stripe.Event;
    expect(isShopStripeEvent(event)).toBe(false);
  });
});

