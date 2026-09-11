import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";
import { DPA_VERSION, TERMS_VERSION } from "@/lib/legal/versions";

const USER = "00000000-0000-4000-8000-0000000000ab";

const signUp = vi.fn();

vi.mock("@/lib/associations/public-launch", () => ({
  ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED: true,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { signUp },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/associations/inscription/route";

function jsonRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/associations/inscription", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseBody = {
  email: "asso@example.com",
  password: "password1",
  associationName: "FC Test",
  firstName: "Ada",
  lastName: "Lovelace",
};

describe("POST /api/associations/inscription — DPA nouveaux clubs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    signUp.mockResolvedValue({
      data: { user: { id: USER } },
      error: null,
    });
  });

  it("sans checkbox : 400", async () => {
    const res = await POST(jsonRequest(baseBody));
    expect(res.status).toBe(400);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("avec checkbox : 201 + preuve enregistrée", async () => {
    const mock = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "profiles",
          op: "select",
          result: { data: null, error: null },
        },
        {
          table: "profiles",
          op: "insert",
          result: { data: null, error: null },
        },
        {
          table: "club_memberships",
          op: "update",
          result: { data: null, error: null },
        },
        {
          table: "legal_acceptances",
          op: "upsert",
          match: (record) => {
            const payload = record.payload as Record<string, unknown>;
            return (
              payload.club_id === USER &&
              payload.terms_version === TERMS_VERSION &&
              payload.dpa_version === DPA_VERSION
            );
          },
          result: { data: null, error: null },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(mock.client as never);

    const res = await POST(jsonRequest({ ...baseBody, acceptLegal: true }));
    expect(res.status).toBe(201);
    expect(
      mock.log.some((op) => op.table === "legal_acceptances" && op.op === "upsert")
    ).toBe(true);
  });
});
