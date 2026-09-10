import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";

const CLUB = "00000000-0000-4000-8000-0000000000f1";
const USER = "00000000-0000-4000-8000-0000000000f2";
const INVITATION_ID = "00000000-0000-4000-8000-0000000000f3";

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

vi.mock("@/lib/billing/teamPlan", () => ({
  requireTeamPlan: vi.fn(async () => ({ allowed: true })),
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  extractRequestMetadata: () => ({}),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { DELETE } from "@/app/api/club/invitations/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue({
    clubId: CLUB,
    userId: USER,
    role: "admin",
    isOwner: false,
    ctx: {
      user: { id: USER, email: "admin@example.com" },
      memberships: [],
      current: { clubId: CLUB, userId: USER, role: "admin", acceptedAt: null },
    },
  } as never);
});

describe("DELETE /api/club/invitations/[id] — admin cancel", () => {
  it("met à jour l’invitation via le client admin (status cancelled)", async () => {
    const session = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "club_invitations",
          op: "select",
          result: {
            data: {
              id: INVITATION_ID,
              club_id: CLUB,
              status: "pending",
              email: "invitee@example.com",
            },
            error: null,
          },
        },
      ]),
    ]);
    const admin = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "club_invitations",
          op: "update",
          match: (r) => {
            const payload = r.payload as { status?: string };
            return payload?.status === "cancelled";
          },
          result: { data: null, error: null },
        },
      ]),
    ]);

    vi.mocked(createClient).mockResolvedValue(session.client as never);
    vi.mocked(createAdminClient).mockReturnValue(admin.client as never);

    const request = new NextRequest(
      `http://localhost/api/club/invitations/${INVITATION_ID}`,
      { method: "DELETE" }
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: INVITATION_ID }),
    });

    expect(response.status).toBe(200);
    const update = admin.log.find(
      (o) => o.table === "club_invitations" && o.op === "update"
    );
    expect(update).toBeTruthy();
    expect(update?.payload).toMatchObject({ status: "cancelled" });
    expect(update?.filters.club_id).toBe(CLUB);
  });
});
