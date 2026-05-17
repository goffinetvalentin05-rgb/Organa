import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/plannings/[id]/assignments/route";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";
import type { RecordedSupabaseOp } from "@/tests/helpers/thenableSupabaseMock";

const CLUB = "00000000-0000-4000-8000-000000000001";
const USER = "00000000-0000-4000-8000-000000000002";
const PLANNING_ID = "00000000-0000-4000-8000-0000000000b1";
const SLOT_ID = "00000000-0000-4000-8000-0000000000b2";
const CLIENT_ID = "00000000-0000-4000-8000-0000000000b3";
const ASSIGNMENT_ID = "00000000-0000-4000-8000-0000000000b4";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

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

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions";

function guardOk() {
  return {
    clubId: CLUB,
    userId: USER,
    role: "owner" as const,
    isOwner: true,
    ctx: {
      user: { id: USER, email: "test@example.com" },
      memberships: [
        {
          clubId: CLUB,
          userId: USER,
          role: "owner" as const,
          acceptedAt: "2026-01-01",
        },
      ],
      current: {
        clubId: CLUB,
        userId: USER,
        role: "owner" as const,
        acceptedAt: "2026-01-01",
      },
    },
  };
}

function assertSlotsReadOnly(log: RecordedSupabaseOp[]) {
  const slotOps = log.filter((o) => o.table === "planning_slots");
  expect(slotOps.every((o) => o.op === "select")).toBe(true);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue(guardOk() as never);
});

describe("POST /api/plannings/[id]/assignments — créneaux", () => {
  it("n’exécute aucun UPDATE sur planning_slots (dates / capacités inchangés)", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "plannings",
          op: "select",
          result: {
            data: { id: PLANNING_ID, name: "Tournoi", date: "2026-06-12" },
            error: null,
          },
        },
        {
          table: "planning_slots",
          op: "select",
          result: {
            data: {
              id: SLOT_ID,
              location: "Buvette",
              start_time: "10:00:00",
              end_time: "12:00:00",
              required_people: 3,
            },
            error: null,
          },
        },
        {
          table: "clients",
          op: "select",
          result: {
            data: { id: CLIENT_ID, name: "Jean Dupont", email: null },
            error: null,
          },
        },
        {
          table: "planning_assignments",
          op: "select",
          match: (r) => r.countHead === true,
          result: { count: 0, error: null },
        },
        {
          table: "planning_assignments",
          op: "select",
          match: (r) => !r.countHead,
          result: { data: null, error: null },
        },
        {
          table: "planning_assignments",
          op: "insert",
          result: {
            data: {
              id: ASSIGNMENT_ID,
              slot_id: SLOT_ID,
              client_id: CLIENT_ID,
              assigned_by: USER,
              source: "internal_member",
              created_at: "2026-01-01T12:00:00Z",
            },
            error: null,
          },
        },
        {
          table: "plannings",
          op: "select",
          result: {
            data: {
              id: PLANNING_ID,
              name: "Tournoi",
              date: "2026-06-12",
              event_id: null,
              user_id: CLUB,
            },
            error: null,
          },
        },
        {
          table: "member_participations",
          op: "select",
          result: { data: null, error: null },
        },
        {
          table: "member_participations",
          op: "insert",
          result: { data: null, error: null },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const req = new NextRequest(
      `http://localhost/api/plannings/${PLANNING_ID}/assignments`,
      {
        method: "POST",
        body: JSON.stringify({
          slotId: SLOT_ID,
          clientId: CLIENT_ID,
          sendNotification: false,
        }),
        headers: { "content-type": "application/json" },
      }
    );

    const res = await POST(req, { params: Promise.resolve({ id: PLANNING_ID }) });
    expect(res.status).toBe(201);
    assertSlotsReadOnly(log);
    const updates = log.filter((o) => o.table === "planning_slots" && o.op === "update");
    expect(updates).toHaveLength(0);
  });
});
