import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock, tableOp } from "@/tests/helpers/thenableSupabaseMock";
import { DPA_VERSION, TERMS_VERSION } from "@/lib/legal/versions";

const USER = "00000000-0000-4000-8000-0000000000aa";

const signUp = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { signUp },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/api/auth/signup/route";

function jsonRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup — DPA nouveaux clubs", () => {
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

  it("sans checkbox : 400, pas de signUp", async () => {
    const res = await POST(
      jsonRequest({ email: "new@example.com", password: "password1" })
    );
    expect(res.status).toBe(400);
    expect(signUp).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("avec checkbox : 201 + preuve 2026-09", async () => {
    const mock = createThenableSupabaseMock([
      tableOp("legal_acceptances", "upsert", (record) => {
        const payload = record.payload as Record<string, unknown>;
        expect(payload.club_id).toBe(USER);
        expect(payload.user_id).toBe(USER);
        expect(payload.terms_version).toBe(TERMS_VERSION);
        expect(payload.dpa_version).toBe(DPA_VERSION);
        return { data: null, error: null };
      }),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(mock.client as never);

    const res = await POST(
      jsonRequest({
        email: "new@example.com",
        password: "password1",
        acceptLegal: true,
      })
    );
    expect(res.status).toBe(201);
    expect(signUp).toHaveBeenCalled();
    expect(
      mock.log.some((op) => op.table === "legal_acceptances" && op.op === "upsert")
    ).toBe(true);
  });
});
