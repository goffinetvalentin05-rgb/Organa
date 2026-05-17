import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/plannings/[id]/route";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";
import type { RecordedSupabaseOp } from "@/tests/helpers/thenableSupabaseMock";

const CLUB = "00000000-0000-4000-8000-000000000001";
const USER = "00000000-0000-4000-8000-000000000002";
const PLANNING_ID = "00000000-0000-4000-8000-0000000000a1";

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

function baseUpdatedPlanning(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PLANNING_ID,
    name: "Titre après",
    description: "Desc",
    date: "2026-06-12",
    status: "draft",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    event_id: null,
    events: null,
    ...overrides,
  };
}

function runPut(body: unknown) {
  const req = new NextRequest("http://localhost/api/plannings/" + PLANNING_ID, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  return PUT(req, { params: Promise.resolve({ id: PLANNING_ID }) });
}

function assertNoSlotMutations(log: RecordedSupabaseOp[]) {
  const slotOps = log.filter((o) => o.table === "planning_slots");
  expect(slotOps).toEqual([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue(guardOk() as never);
});

describe("PUT /api/plannings/[id] — non-régression dates / créneaux", () => {
  it("modifier uniquement le titre : pas de toucher planning_slots, payload plannings limité", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "plannings",
          op: "select",
          result: { data: { id: PLANNING_ID }, error: null },
        },
        {
          table: "plannings",
          op: "update",
          match: (r) => {
            const p = r.payload as Record<string, unknown>;
            return (
              Object.prototype.hasOwnProperty.call(p, "name") &&
              !Object.prototype.hasOwnProperty.call(p, "date") &&
              !Object.prototype.hasOwnProperty.call(p, "description")
            );
          },
          result: {
            data: baseUpdatedPlanning({ name: "Nouveau titre" }),
            error: null,
          },
        },
        {
          table: "member_participations",
          op: "update",
          result: { data: null, error: null },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const res = await runPut({ name: "Nouveau titre" });
    expect(res.status).toBe(200);
    assertNoSlotMutations(log);
    const up = log.find((o) => o.table === "plannings" && o.op === "update");
    expect(up?.payload).toMatchObject({ name: "Nouveau titre" });
  });

  it("modifier uniquement la description : aucune clé date dans le payload", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "plannings",
          op: "select",
          result: { data: { id: PLANNING_ID }, error: null },
        },
        {
          table: "plannings",
          op: "update",
          match: (r) => {
            const p = r.payload as Record<string, unknown>;
            return (
              p.description === "Une seule ligne" &&
              !Object.prototype.hasOwnProperty.call(p, "date") &&
              !Object.prototype.hasOwnProperty.call(p, "name")
            );
          },
          result: {
            data: baseUpdatedPlanning({
              description: "Une seule ligne",
            }),
            error: null,
          },
        },
        {
          table: "member_participations",
          op: "update",
          result: { data: null, error: null },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const res = await runPut({ description: "Une seule ligne" });
    expect(res.status).toBe(200);
    assertNoSlotMutations(log);
  });

  it("modifier la date générale (ex. grille multi-jours) : aucune mutation de planning_slots", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "plannings",
          op: "select",
          result: { data: { id: PLANNING_ID }, error: null },
        },
        {
          table: "plannings",
          op: "update",
          match: (r) => {
            const p = r.payload as Record<string, unknown>;
            return p.date === "2026-07-01" && !Object.prototype.hasOwnProperty.call(p, "name");
          },
          result: {
            data: baseUpdatedPlanning({ date: "2026-07-01" }),
            error: null,
          },
        },
        {
          table: "member_participations",
          op: "update",
          result: { data: null, error: null },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const res = await runPut({ date: "2026-07-01" });
    expect(res.status).toBe(200);
    assertNoSlotMutations(log);
    const sync = log.find((o) => o.table === "member_participations");
    const syncPayload = sync?.payload as Record<string, unknown> | undefined;
    expect(syncPayload).toBeDefined();
    expect(syncPayload).not.toHaveProperty("event_date");
  });

  it("date invalide : 400 et aucune requête base", async () => {
    const { client, log } = createThenableSupabaseMock([]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const res = await runPut({ date: "2026-02-30" });
    expect(res.status).toBe(400);
    expect(log).toHaveLength(0);
  });
});
