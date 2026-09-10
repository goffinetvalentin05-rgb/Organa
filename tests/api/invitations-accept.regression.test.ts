import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const USER = "00000000-0000-4000-8000-0000000000e1";
const CLUB = "00000000-0000-4000-8000-0000000000e2";
const MEMBERSHIP = "00000000-0000-4000-8000-0000000000e3";
const TOKEN = "invitation-token-aaaaaaaaaaaaaaaaaaaaaaaa";

const rpc = vi.fn();
const from = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    rpc,
    from,
  })),
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  extractRequestMetadata: () => ({}),
}));

import { POST } from "@/app/api/invitations/[token]/route";

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({
    data: { user: { id: USER, email: "invitee@example.com" } },
    error: null,
  });
  rpc.mockReturnValue({
    maybeSingle: async () => ({
      data: { membership_id: MEMBERSHIP, club_id: CLUB },
      error: null,
    }),
  });
});

describe("POST /api/invitations/[token] — acceptation", () => {
  it("n’exécute aucun UPDATE direct sur club_invitations (RPC uniquement)", async () => {
    const request = new NextRequest(
      `http://localhost/api/invitations/${TOKEN}`,
      { method: "POST" }
    );
    const response = await POST(request, {
      params: Promise.resolve({ token: TOKEN }),
    });

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("accept_invitation", { p_token: TOKEN });
    expect(from).not.toHaveBeenCalled();
  });

  it("invitation member acceptée → membership renvoyée sans rôle fourni par le client", async () => {
    const request = new NextRequest(
      `http://localhost/api/invitations/${TOKEN}`,
      { method: "POST" }
    );
    const response = await POST(request, {
      params: Promise.resolve({ token: TOKEN }),
    });
    const body = (await response.json()) as {
      success: boolean;
      membershipId: string;
      clubId: string;
    };

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.membershipId).toBe(MEMBERSHIP);
    expect(body.clubId).toBe(CLUB);
    expect(rpc.mock.calls[0][1]).toEqual({ p_token: TOKEN });
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("role");
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("permissions");
    expect(rpc.mock.calls[0][1]).not.toHaveProperty("club_id");
  });
});
