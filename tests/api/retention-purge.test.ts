import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { GET, POST } from "@/app/api/internal/retention-purge/route";

function req(secret?: string) {
  const headers: Record<string, string> = {};
  if (secret) headers.authorization = `Bearer ${secret}`;
  return new NextRequest("http://localhost/api/internal/retention-purge", {
    method: "POST",
    headers,
  });
}

describe("POST /api/internal/retention-purge", () => {
  const prev = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  });

  it("refuse sans secret ou mauvais Bearer", async () => {
    expect((await POST(req())).status).toBe(401);
    expect((await POST(req("wrong"))).status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuse si CRON_SECRET absent", async () => {
    delete process.env.CRON_SECRET;
    expect((await POST(req("cron-test-secret"))).status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("appelle la RPC avec un Bearer valide", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        invitations_expired_deleted: 1,
        idempotency_keys_deleted: 2,
        audit_logs_deleted: 3,
      },
      error: null,
    });
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as never);

    const res = await POST(req("cron-test-secret"));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("purge_operational_data");
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result.invitations_expired_deleted).toBe(1);
  });

  it("GET Vercel cron : même garde", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.mocked(createAdminClient).mockReturnValue({ rpc } as never);
    const res = await GET(
      new NextRequest("http://localhost/api/internal/retention-purge", {
        headers: { authorization: "Bearer cron-test-secret" },
      })
    );
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("purge_operational_data");
  });
});
