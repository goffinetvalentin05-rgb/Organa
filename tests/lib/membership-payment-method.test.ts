import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  francsToStripeCents,
  parseMembershipPaymentMethod,
  resolveMembershipPaymentMethod,
} from "@/lib/quotes/payment-method";
import { markMembershipPaidFromStripe } from "@/lib/quotes/stripe-membership";

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
});

const documents = new Map<string, Record<string, unknown>>();
let lastUpdate: Record<string, unknown> | null = null;
let updateFilters: Record<string, unknown> = {};

function createDocumentsQuery() {
  let filters: Record<string, unknown> = {};
  let mode: "select" | "update" = "select";
  let payload: Record<string, unknown> | null = null;

  const executeSelect = async () => {
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
});
