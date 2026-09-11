import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock, tableOp } from "@/tests/helpers/thenableSupabaseMock";

const CLUB = "00000000-0000-4000-8000-0000000000a1";
const USER = "00000000-0000-4000-8000-0000000000a2";
const CONTACT = "44444444-4444-4444-8444-444444444444";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
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

import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { POST } from "@/app/api/marketing/contacts/route";

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

describe("contacts marketing staff", () => {
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

  it("refuse sans déclaration de base valable", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createThenableSupabaseMock([]).client as never
    );
    const res = await POST(
      new NextRequest("http://localhost/api/marketing/contacts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": "c1",
        },
        body: JSON.stringify({
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          staffDeclaresLawfulBasis: false,
        }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("enregistre consent_source staff_declared", async () => {
    const mock = createThenableSupabaseMock([
      tableOp("marketing_contacts", "select", () => ({ data: null, error: null })),
      tableOp("marketing_contacts", "insert", (record) => {
        const payload = record.payload as Record<string, unknown>;
        expect(payload.consent_source).toBe("staff_declared");
        expect(payload.consented_at).toBeTruthy();
        expect(payload.consent_text_version).toBe("marketing_optin_v1");
        return {
          data: {
            id: CONTACT,
            first_name: "Ada",
            last_name: "Lovelace",
            email: "ada@example.com",
            phone: null,
            source: "manual",
            source_id: null,
            created_at: "2026-09-11",
            unsubscribed: false,
            consented_at: payload.consented_at,
            consent_source: "staff_declared",
          },
          error: null,
        };
      }),
    ]);
    vi.mocked(createClient).mockResolvedValue(mock.client as never);

    const res = await POST(
      new NextRequest("http://localhost/api/marketing/contacts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Idempotency-Key": "c2",
        },
        body: JSON.stringify({
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          staffDeclaresLawfulBasis: true,
        }),
      })
    );
    expect(res.status).toBe(201);
  });
});
