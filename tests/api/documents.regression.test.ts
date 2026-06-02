import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, PATCH } from "@/app/api/documents/route";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";
import type { RecordedSupabaseOp } from "@/tests/helpers/thenableSupabaseMock";

const CLUB = "00000000-0000-4000-8000-0000000000c1";
const USER = "00000000-0000-4000-8000-0000000000c2";
const CLIENT_ID = "00000000-0000-4000-8000-0000000000c3";
const DOC_ID = "00000000-0000-4000-8000-0000000000c4";

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

vi.mock("@/lib/billing/checkAccess", () => ({
  requireWriteAccess: vi.fn(),
}));

vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AuditAction: { CREATE: "create" },
  extractRequestMetadata: () => ({}),
}));

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

function guardOk() {
  return {
    clubId: CLUB,
    userId: USER,
    role: "owner" as const,
    isOwner: true,
    ctx: {
      user: { id: USER, email: "test@example.com" },
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireWriteAccess).mockResolvedValue({ allowed: true });
  vi.mocked(requirePermission).mockImplementation(async (perm) => {
    if (
      perm === PERMISSIONS.MANAGE_INVOICES ||
      perm === PERMISSIONS.VIEW_INVOICES
    ) {
      return guardOk() as never;
    }
    return {
      error: new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
    };
  });
});

const ligne = {
  id: "l1",
  designation: "Adhésion",
  quantite: 1,
  prixUnitaire: 100,
  tva: 0,
};

describe("POST /api/documents — facture", () => {
  it("filtre clients par user_id (club), génère un numéro et insère avec les bons totaux", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "clients",
          op: "select",
          match: (r) =>
            r.filters.id === CLIENT_ID && r.filters.user_id === CLUB,
          result: { data: { id: CLIENT_ID }, error: null },
        },
        {
          table: "documents",
          op: "select",
          match: (r) => r.countHead === true,
          result: { count: 0, error: null },
        },
        {
          table: "documents",
          op: "insert",
          match: (r) => {
            const p = r.payload as Record<string, unknown>;
            return (
              p.user_id === CLUB &&
              p.client_id === CLIENT_ID &&
              typeof p.numero === "string" &&
              (p.numero as string).startsWith("FAC-") &&
              p.title === "Adhésion" &&
              p.total_ttc === 100
            );
          },
          result: {
            data: {
              id: DOC_ID,
              numero: "FAC-2026-001",
              type: "invoice",
              created_at: "2026-05-01T00:00:00Z",
            },
            error: null,
          },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const req = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        type: "invoice",
        clientId: CLIENT_ID,
        lignes: [ligne],
        statut: "brouillon",
        dateCreation: "2026-05-10",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.numero).toMatch(/^FAC-/);
    expect(log.some((o) => o.table === "documents" && o.op === "insert")).toBe(true);
  });

  it("crée une facture avec destinataire externe sans client_id", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "documents",
          op: "select",
          match: (r) => r.countHead === true,
          result: { count: 2, error: null },
        },
        {
          table: "documents",
          op: "insert",
          match: (r) => {
            const p = r.payload as Record<string, unknown>;
            return (
              p.user_id === CLUB &&
              p.client_id === null &&
              p.recipient_type === "external" &&
              p.external_recipient_name === "Entreprise SA" &&
              p.external_recipient_zip === "1000" &&
              p.external_recipient_city === "Lausanne"
            );
          },
          result: {
            data: {
              id: DOC_ID,
              numero: "FAC-2026-003",
              type: "invoice",
              created_at: "2026-05-01T00:00:00Z",
            },
            error: null,
          },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const req = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        type: "invoice",
        recipientType: "external",
        recipientData: {
          name: "Entreprise SA",
          address: "Rue du Test 1",
          postalCode: "1000",
          city: "Lausanne",
          email: "contact@entreprise.test",
        },
        lignes: [ligne],
        statut: "brouillon",
        dateCreation: "2026-05-10",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(DOC_ID);
    expect(log.some((o) => o.table === "documents" && o.op === "insert")).toBe(true);
  });
});

describe("PATCH /api/documents — isolation club", () => {
  it("retourne 404 si le document n’appartient pas au club (user_id)", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "documents",
          op: "select",
          match: (r) =>
            r.filters.id === DOC_ID && r.filters.user_id === CLUB,
          result: { data: null, error: null },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const req = new NextRequest("http://localhost/api/documents", {
      method: "PATCH",
      body: JSON.stringify({
        id: DOC_ID,
        type: "invoice",
        title: "Hack",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(404);
    const updates = log.filter((o: RecordedSupabaseOp) => o.op === "update");
    expect(updates).toHaveLength(0);
  });

  it("modifier le titre seul : update contient title + numero inchangé, pas de recalcul des lignes", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "documents",
          op: "select",
          result: {
            data: {
              id: DOC_ID,
              numero: "FAC-2026-010",
              title: "Ancien",
              event_id: null,
              type: "invoice",
            },
            error: null,
          },
        },
        {
          table: "documents",
          op: "update",
          match: (r) => {
            const p = r.payload as Record<string, unknown>;
            return (
              p.title === "Nouveau titre" &&
              p.numero === "FAC-2026-010" &&
              !Object.prototype.hasOwnProperty.call(p, "total_ttc") &&
              !Object.prototype.hasOwnProperty.call(p, "items") &&
              p.updated_by === USER
            );
          },
          result: {
            data: {
              id: DOC_ID,
              numero: "FAC-2026-010",
              title: "Nouveau titre",
              type: "invoice",
              event_id: null,
            },
            error: null,
          },
        },
      ]),
    ]);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const req = new NextRequest("http://localhost/api/documents", {
      method: "PATCH",
      body: JSON.stringify({
        id: DOC_ID,
        type: "invoice",
        title: "Nouveau titre",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Nouveau titre");
    expect(body.numero).toBe("FAC-2026-010");
  });
});
