import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock, tableOp } from "@/tests/helpers/thenableSupabaseMock";

const CLUB = "00000000-0000-4000-8000-0000000000a1";
const QR = "11111111-1111-4111-8111-111111111111";
const REG = "22222222-2222-4222-8222-222222222222";
const REQ = "33333333-3333-4333-8333-333333333333";

vi.mock("@/lib/security/rateLimit", () => ({
  rateLimitGuard: () => ({ ok: true }),
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AuditAction: { CREATE: "create", HARD_DELETE: "hard_delete" },
  extractRequestMetadata: () => ({}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/buvette/email", () => ({
  sendPendingConfirmationToRequester: vi.fn().mockResolvedValue(undefined),
  sendRequestReceivedToClub: vi.fn().mockResolvedValue(undefined),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST as POST_REG } from "@/app/api/registrations/route";
import { POST as POST_BUVETTE } from "@/app/api/public/buvette/[slug]/requests/route";

function jsonRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("inscription événement — marketing opt-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockDb(opts: { expectUpsert: boolean }) {
    const matchers = [
      tableOp("qrcodes", "select", () => ({
        data: {
          id: QR,
          is_active: true,
          name: "Match",
          user_id: CLUB,
          deleted_at: null,
        },
        error: null,
      })),
      tableOp("registrations", "select", () => ({ data: null, error: null })),
      tableOp("registrations", "insert", () => ({
        data: { id: REG },
        error: null,
      })),
    ];
    if (opts.expectUpsert) {
      matchers.push(
        tableOp("marketing_contacts", "upsert", (record) => {
          const payload = record.payload as Record<string, unknown>;
          expect(payload.consent_source).toBe("event_form");
          expect(payload.consented_at).toBeTruthy();
          expect(payload.consent_text_version).toBe("marketing_optin_v1");
          expect(payload.unsubscribed).toBe(false);
          return { data: null, error: null };
        })
      );
    }
    const mock = createThenableSupabaseMock(matchers);
    vi.mocked(createAdminClient).mockReturnValue(mock.client as never);
    return mock;
  }

  it("sans opt-in : inscription OK, aucun contact marketing", async () => {
    const mock = mockDb({ expectUpsert: false });
    const res = await POST_REG(
      jsonRequest("http://localhost/api/registrations", {
        qrcodeId: QR,
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        marketingOptIn: false,
      })
    );
    expect(res.status).toBe(201);
    expect(mock.log.some((op) => op.table === "marketing_contacts")).toBe(false);
  });

  it("avec opt-in : contact + preuve", async () => {
    const mock = mockDb({ expectUpsert: true });
    const res = await POST_REG(
      jsonRequest("http://localhost/api/registrations", {
        qrcodeId: QR,
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        marketingOptIn: true,
      })
    );
    expect(res.status).toBe(201);
    expect(mock.log.some((op) => op.table === "marketing_contacts" && op.op === "upsert")).toBe(
      true
    );
  });
});

describe("buvette — marketing opt-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockDb(opts: { expectUpsert: boolean }) {
    const matchers = [
      tableOp("profiles", "select", () => ({
        data: {
          user_id: CLUB,
          company_name: "FC Test",
          company_email: "club@example.com",
          email_sender_name: null,
          email_sender_email: null,
          resend_api_key: null,
          email_custom_enabled: false,
        },
        error: null,
      })),
      tableOp("buvette_slots", "select", () => ({ data: null, error: null })),
      tableOp("buvette_requests", "select", () => ({ data: null, error: null })),
      tableOp("buvette_requests", "insert", () => ({
        data: { id: REQ },
        error: null,
      })),
    ];
    if (opts.expectUpsert) {
      matchers.push(
        tableOp("marketing_contacts", "upsert", (record) => {
          const payload = record.payload as Record<string, unknown>;
          expect(payload.consent_source).toBe("buvette_form");
          expect(payload.consented_at).toBeTruthy();
          return { data: null, error: null };
        })
      );
    }
    matchers.push(
      tableOp("buvette_slots", "insert", () => ({ data: { id: "slot-1" }, error: null }))
    );
    const mock = createThenableSupabaseMock(matchers);
    vi.mocked(createAdminClient).mockReturnValue(mock.client as never);
    return mock;
  }

  const baseBody = {
    date: "2026-10-01",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    eventType: "Tournoi",
  };

  it("sans opt-in : demande OK, aucun contact marketing", async () => {
    const mock = mockDb({ expectUpsert: false });
    const res = await POST_BUVETTE(
      jsonRequest("http://localhost/api/public/buvette/fc-test/requests", {
        ...baseBody,
        marketingOptIn: false,
      }),
      { params: Promise.resolve({ slug: "fc-test" }) }
    );
    expect(res.status).toBe(201);
    expect(mock.log.some((op) => op.table === "marketing_contacts")).toBe(false);
  });

  it("avec opt-in : contact + preuve", async () => {
    const mock = mockDb({ expectUpsert: true });
    const res = await POST_BUVETTE(
      jsonRequest("http://localhost/api/public/buvette/fc-test/requests", {
        ...baseBody,
        marketingOptIn: true,
      }),
      { params: Promise.resolve({ slug: "fc-test" }) }
    );
    expect(res.status).toBe(201);
    expect(mock.log.some((op) => op.table === "marketing_contacts" && op.op === "upsert")).toBe(
      true
    );
  });
});
