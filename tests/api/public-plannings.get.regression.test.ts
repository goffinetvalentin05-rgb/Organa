import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";

const CLUB = "00000000-0000-4000-8000-0000000000d1";
const PLANNING_ID = "00000000-0000-4000-8000-0000000000d2";
const SLOT_ID = "00000000-0000-4000-8000-0000000000d3";
const CLIENT_ID = "00000000-0000-4000-8000-0000000000d4";
const ASSIGNMENT_INTERNAL_ID = "00000000-0000-4000-8000-0000000000d6";
const ASSIGNMENT_PUBLIC_ID = "00000000-0000-4000-8000-0000000000d7";

const INTERNAL_EMAIL = "membre-interne@club-b.example";
const INTERNAL_PHONE = "+41000000001";
const PUBLIC_EMAIL = "benevole-public@club-b.example";
const PUBLIC_PHONE = "+41000000002";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { GET } from "@/app/api/public/plannings/[token]/route";

const PII_VALUE_KEYS = new Set([
  "email",
  "telephone",
  "phone",
  "public_email",
  "public_phone",
]);

function collectPiiValues(value: unknown, acc: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectPiiValues(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (PII_VALUE_KEYS.has(key) && nested != null && nested !== "") {
        acc.push(String(nested));
      }
      collectPiiValues(nested, acc);
    }
  }
  return acc;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/public/plannings/[token] — pas de PII bénévoles", () => {
  it("ne renvoie ni email ni telephone des personnes assignées", async () => {
    const { client } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "public_planning_links",
          op: "select",
          result: {
            data: {
              planning_id: PLANNING_ID,
              club_id: CLUB,
              active: true,
              require_name: true,
              require_email: true,
              slug: "tournoi-printemps",
              token: "this-is-a-long-secret-token",
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
              name: "Tournoi printemps",
              date: "2026-06-12",
              description: "Bénévoles",
            },
            error: null,
          },
        },
        {
          table: "profiles",
          op: "select",
          result: {
            data: { company_name: "FC Exemple" },
            error: null,
          },
        },
        {
          table: "planning_slots",
          op: "select",
          result: {
            data: [
              {
                id: SLOT_ID,
                location: "Entrée",
                slot_date: "2026-06-12",
                start_time: "09:00:00",
                end_time: "11:00:00",
                required_people: 3,
                notes: null,
                ordre: 1,
              },
            ],
            error: null,
          },
        },
        {
          table: "planning_assignments",
          op: "select",
          result: {
            data: [
              {
                id: ASSIGNMENT_INTERNAL_ID,
                slot_id: SLOT_ID,
                client_id: CLIENT_ID,
                member_id: null,
                created_at: "2026-05-01T10:00:00.000Z",
                source: "internal_member",
                public_name: null,
                public_email: null,
                public_phone: null,
                clients: {
                  id: CLIENT_ID,
                  nom: "Alice Interne",
                  email: INTERNAL_EMAIL,
                  telephone: INTERNAL_PHONE,
                },
              },
              {
                id: ASSIGNMENT_PUBLIC_ID,
                slot_id: SLOT_ID,
                client_id: null,
                member_id: null,
                created_at: "2026-05-01T11:00:00.000Z",
                source: "public_signup",
                public_name: "Bob Public",
                public_email: PUBLIC_EMAIL,
                public_phone: PUBLIC_PHONE,
                clients: null,
              },
            ],
            error: null,
          },
        },
        {
          table: "clients",
          op: "select",
          result: {
            data: [
              {
                id: CLIENT_ID,
                nom: "Alice Interne",
                email: INTERNAL_EMAIL,
                telephone: INTERNAL_PHONE,
              },
            ],
            error: null,
          },
        },
      ]),
    ]);

    vi.mocked(createAdminClient).mockReturnValue(client as never);

    const request = new NextRequest(
      "http://localhost/api/public/plannings/tournoi-printemps"
    );
    const response = await GET(request, {
      params: Promise.resolve({ token: "tournoi-printemps" }),
    });
    const body = (await response.json()) as Record<string, unknown>;
    expect(response.status, JSON.stringify(body)).toBe(200);
    const serialized = JSON.stringify(body);

    expect(collectPiiValues(body)).toEqual([]);
    expect(serialized).not.toContain(INTERNAL_EMAIL);
    expect(serialized).not.toContain(INTERNAL_PHONE);
    expect(serialized).not.toContain(PUBLIC_EMAIL);
    expect(serialized).not.toContain(PUBLIC_PHONE);

    const planning = body.planning as {
      requireEmail: boolean;
      slots: Array<{
        assignments: Array<{ member: { nom: string; status: string } }>;
      }>;
    };
    expect(planning.requireEmail).toBe(true);
    const names = planning.slots[0].assignments.map((a) => a.member.nom);
    expect(names).toEqual(["Alice Interne", "Bob Public"]);
    for (const assignment of planning.slots[0].assignments) {
      expect(assignment.member).not.toHaveProperty("email");
      expect(assignment.member).not.toHaveProperty("telephone");
      expect(assignment.member).not.toHaveProperty("phone");
    }
  });
});
