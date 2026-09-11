import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock, tableOp } from "@/tests/helpers/thenableSupabaseMock";

const CLUB = "00000000-0000-4000-8000-0000000000a1";
const USER = "00000000-0000-4000-8000-0000000000a2";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/permissions")>();
  return {
    ...actual,
    requirePermission: vi.fn(),
  };
});

vi.mock("@/lib/billing/checkAccess", () => ({
  requireWriteAccess: vi.fn(),
}));

vi.mock("@/lib/api/idempotency", () => ({
  withIdempotency: vi.fn(async ({ operation }: { operation: () => Promise<unknown> }) =>
    operation()
  ),
}));

vi.mock("@/lib/email/resend-delivery", () => ({
  resolveResendFromProfile: () => ({
    resend: { emails: { send: vi.fn().mockResolvedValue({ error: null }) } },
    from: "club@example.com",
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { POST } from "@/app/api/marketing/campaigns/route";

function guardOk() {
  return {
    clubId: CLUB,
    userId: USER,
    role: "owner" as const,
    isOwner: true,
    ctx: {
      user: { id: USER, email: "owner@example.com" },
      memberships: [],
      current: {
        clubId: CLUB,
        userId: USER,
        role: "owner" as const,
        acceptedAt: "2026-01-01",
      },
    },
  };
}

describe("campagnes marketing — consentement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireWriteAccess).mockResolvedValue({ allowed: true } as never);
    vi.mocked(requirePermission).mockImplementation(async (perm) => {
      if (perm === PERMISSIONS.MANAGE_MEMBERS) return guardOk() as never;
      return {
        error: new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
      } as never;
    });
  });

  it("sendTo all n’inclut que unsubscribed=false et consented_at IS NOT NULL", async () => {
    const mock = createThenableSupabaseMock([
      tableOp("profiles", "select", () => ({
        data: { company_name: "FC" },
        error: null,
      })),
      tableOp("marketing_contacts", "select", (record) => {
        expect(record.filters.club_id).toBe(CLUB);
        expect(record.filters.unsubscribed).toBe(false);
        expect(record.filters.consented_at__not_is).toBeNull();
        return { data: [], error: null };
      }),
    ]);
    vi.mocked(createClient).mockResolvedValue(mock.client as never);
    vi.mocked(createAdminClient).mockReturnValue(mock.client as never);

    const res = await POST(
      new NextRequest("http://localhost/api/marketing/campaigns", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": "camp-1",
        },
        body: JSON.stringify({
          name: "Info",
          subject: "Hello",
          contentHtml: "<p>Hi</p>",
          sendTo: "all",
        }),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/destinataire/i);
  });

  it("ne part pas si aucun contact n’a consented_at", async () => {
    const mock = createThenableSupabaseMock([
      tableOp("profiles", "select", () => ({
        data: { company_name: "FC" },
        error: null,
      })),
      tableOp("marketing_contacts", "select", (record) => {
        if (record.filters.consented_at__not_is !== null) {
          throw new Error("filtre consented_at manquant — envoi interdit");
        }
        return { data: [], error: null };
      }),
    ]);
    vi.mocked(createClient).mockResolvedValue(mock.client as never);
    vi.mocked(createAdminClient).mockReturnValue(mock.client as never);

    const res = await POST(
      new NextRequest("http://localhost/api/marketing/campaigns", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": "camp-2",
        },
        body: JSON.stringify({
          name: "Info",
          subject: "Hello",
          contentHtml: "<p>Hi</p>",
          sendTo: "all",
        }),
      })
    );
    expect(res.status).toBe(400);
  });
});
