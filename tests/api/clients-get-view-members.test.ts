import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";

const CLUB = "00000000-0000-4000-8000-0000000000a1";
const OTHER_CLUB = "00000000-0000-4000-8000-0000000000a9";
const USER = "00000000-0000-4000-8000-0000000000a2";
const CLIENT_ID = "00000000-0000-4000-8000-0000000000a3";

const AVS = "756.1234.5678.90";
const DOB = "1990-04-12";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

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

vi.mock("@/lib/member-fields/loadSettings", () => ({
  fetchMergedMemberFieldSettings: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { fetchMergedMemberFieldSettings } from "@/lib/member-fields/loadSettings";
import { DEFAULT_MEMBER_FIELDS } from "@/lib/member-fields/types";
import { GET as GET_LIST } from "@/app/api/clients/route";
import { GET as GET_ONE, PUT } from "@/app/api/clients/[id]/route";
import { GET as GET_EXPORT } from "@/app/api/export/route";

function guardOk(role: "owner" | "admin" | "committee" | "member" = "member") {
  return {
    clubId: CLUB,
    userId: USER,
    role,
    isOwner: role === "owner",
    ctx: {
      user: { id: USER, email: "member@example.com" },
      memberships: [],
      current: {
        clubId: CLUB,
        userId: USER,
        role,
        acceptedAt: "2026-01-01",
      },
    },
  };
}

function dbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: CLIENT_ID,
    nom: "Dupont",
    email: "alice@club.example",
    telephone: "+41000000001",
    adresse: "1 rue de la Gare",
    postal_code: "1000",
    city: "Lausanne",
    user_id: CLUB,
    role: "player",
    category: "seniors",
    date_of_birth: DOB,
    avs_number: AVS,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: USER,
    updated_by: USER,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue(guardOk() as never);
  vi.mocked(requireWriteAccess).mockResolvedValue({ allowed: true } as never);
  vi.mocked(fetchMergedMemberFieldSettings).mockResolvedValue(DEFAULT_MEMBER_FIELDS);
});

describe("GET /api/clients — VIEW_MEMBERS + admin", () => {
  it("member + view_members → liste OK, filtrée par club, sans AVS ni date de naissance", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "clients",
          op: "select",
          match: (r) =>
            r.filters.user_id === CLUB && r.filters.deleted_at__is === null,
          result: {
            data: [dbRow(), dbRow({ id: "other", user_id: OTHER_CLUB })],
            error: null,
          },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);

    const res = await GET_LIST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(vi.mocked(requirePermission).mock.calls[0][0]).toBe(
      PERMISSIONS.VIEW_MEMBERS
    );
    expect(createAdminClient).toHaveBeenCalledTimes(1);
    expect(log[0].filters.user_id).toBe(CLUB);
    expect(log[0].filters.deleted_at__is).toBe(null);
    expect(body.clients).toHaveLength(1);
    expect(body.clients[0].id).toBe(CLIENT_ID);
    expect(body.clients[0].email).toBe("alice@club.example");
    expect(body.clients[0].telephone).toBe("+41000000001");
    expect(body.clients[0]).not.toHaveProperty("avsNumber");
    expect(body.clients[0]).not.toHaveProperty("dateOfBirth");
    expect(JSON.stringify(body)).not.toContain(AVS);
    expect(JSON.stringify(body)).not.toContain(DOB);
  });

  it("member sans view_members → 403, pas de lecture admin", async () => {
    vi.mocked(requirePermission).mockResolvedValue({
      error: new Response(
        JSON.stringify({ error: "Accès refusé", required: "view_members" }),
        { status: 403 }
      ),
    } as never);

    const res = await GET_LIST();
    expect(res.status).toBe(403);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("committee / admin / owner : même GET fonctionne (VIEW_MEMBERS + admin)", async () => {
    for (const role of ["committee", "admin", "owner"] as const) {
      vi.clearAllMocks();
      vi.mocked(requirePermission).mockResolvedValue(guardOk(role) as never);
      const { client } = createThenableSupabaseMock([
        sequentialOps([
          {
            table: "clients",
            op: "select",
            result: { data: [dbRow()], error: null },
          },
        ]),
      ]);
      vi.mocked(createAdminClient).mockReturnValue(client as never);

      const res = await GET_LIST();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.clients).toHaveLength(1);
    }
  });
});

describe("GET /api/clients/[id] — VIEW_MEMBERS + admin", () => {
  it("fiche : AVS masqué, date de naissance conservée, pas d’AVS brut", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "clients",
          op: "select",
          match: (r) =>
            r.filters.id === CLIENT_ID &&
            r.filters.user_id === CLUB &&
            r.filters.deleted_at__is === null,
          result: { data: dbRow(), error: null },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);

    const res = await GET_ONE(new NextRequest(`http://localhost/api/clients/${CLIENT_ID}`), {
      params: { id: CLIENT_ID },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(log[0].filters.user_id).toBe(CLUB);
    expect(body.client.avsNumber).toBe("756.XXXX.XXXX.90");
    expect(body.client.avsNumber).not.toBe(AVS);
    expect(body.client.dateOfBirth).toBe(DOB);
    expect(JSON.stringify(body)).not.toContain(AVS);
  });

  it("member sans view_members → 403", async () => {
    vi.mocked(requirePermission).mockResolvedValue({
      error: new Response(
        JSON.stringify({ error: "Accès refusé", required: "view_members" }),
        { status: 403 }
      ),
    } as never);

    const res = await GET_ONE(new NextRequest(`http://localhost/api/clients/${CLIENT_ID}`), {
      params: { id: CLIENT_ID },
    });
    expect(res.status).toBe(403);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("PUT /api/clients/[id] — member + manage_members", () => {
  it("édition : lecture + UPDATE via admin, AVS masqué, filtré par club", async () => {
    vi.mocked(requirePermission).mockResolvedValue(guardOk("member") as never);
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "clients",
          op: "select",
          match: (r) =>
            r.filters.id === CLIENT_ID &&
            r.filters.user_id === CLUB &&
            r.filters.deleted_at__is === null,
          result: { data: dbRow(), error: null },
        },
        {
          table: "clients",
          op: "update",
          match: (r) => r.filters.id === CLIENT_ID && r.filters.user_id === CLUB,
          result: { data: dbRow({ nom: "Dupont Modifié" }), error: null },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const res = await PUT(
      new NextRequest(`http://localhost/api/clients/${CLIENT_ID}`, {
        method: "PUT",
        body: JSON.stringify({ nom: "Dupont Modifié" }),
        headers: { "content-type": "application/json" },
      }),
      { params: { id: CLIENT_ID } }
    );
    expect(vi.mocked(requirePermission).mock.calls[0][0]).toBe(
      PERMISSIONS.MANAGE_MEMBERS
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.client.nom).toBe("Dupont Modifié");
    expect(body.client.avsNumber).toBe("756.XXXX.XXXX.90");
    expect(JSON.stringify(body)).not.toContain(AVS);
    expect(log.every((o) => o.filters.user_id === CLUB)).toBe(true);
  });

  it("sans manage_members → 403, pas d’admin", async () => {
    vi.mocked(requirePermission).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
      }),
    } as never);
    const res = await PUT(
      new NextRequest(`http://localhost/api/clients/${CLIENT_ID}`, {
        method: "PUT",
        body: JSON.stringify({ nom: "X" }),
        headers: { "content-type": "application/json" },
      }),
      { params: { id: CLIENT_ID } }
    );
    expect(res.status).toBe(403);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("GET /api/export?resource=clients — view_members", () => {
  it("export CSV via admin, sans AVS ni date de naissance", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "clients",
          op: "select",
          match: (r) =>
            r.filters.user_id === CLUB && r.filters.deleted_at__is === null,
          result: { data: [dbRow()], error: null },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const res = await GET_EXPORT(
      new NextRequest("http://localhost/api/export?resource=clients")
    );
    expect(vi.mocked(requirePermission).mock.calls[0][0]).toBe(
      PERMISSIONS.VIEW_MEMBERS
    );
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain("Dupont");
    expect(csv).toContain("alice@club.example");
    expect(csv).not.toContain(AVS);
    expect(csv).not.toContain(DOB);
    expect(log[0].filters.user_id).toBe(CLUB);
  });
});
