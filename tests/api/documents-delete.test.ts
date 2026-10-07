import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/documents/route";
import { createThenableSupabaseMock } from "@/tests/helpers/thenableSupabaseMock";
import { sequentialOps } from "@/tests/helpers/sequentialMatcher";

const CLUB = "657c2be5-6b67-4ef3-96fa-130e68cbc229";
const OTHER = "11111111-1111-4111-8111-111111111111";
const USER = "00000000-0000-4000-8000-0000000000c2";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/auth/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/permissions")>();
  return { ...actual, requirePermission: vi.fn() };
});
vi.mock("@/lib/billing/checkAccess", () => ({ requireWriteAccess: vi.fn() }));
vi.mock("@/lib/auth/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  AuditAction: { HARD_DELETE: "hard_delete", SOFT_DELETE: "soft_delete", CREATE: "create" },
  extractRequestMetadata: () => ({}),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireWriteAccess).mockResolvedValue({ allowed: true });
  vi.mocked(requirePermission).mockResolvedValue({
    clubId: CLUB,
    userId: USER,
    role: "owner",
    isOwner: true,
    ctx: { user: { id: USER, email: "test@example.com" }, memberships: [], current: null },
  } as never);
});

function request(id: string) {
  return new NextRequest(`http://localhost/api/documents?id=${id}`, { method: "DELETE" });
}

describe("DELETE /api/documents", () => {
  it("efface une cotisation 126 sans paiement ni écriture", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        { table: "documents", op: "select", result: { data: { id: "126" }, error: null } },
        {
          table: "documents",
          op: "select",
          result: {
            data: { id: "126", numero: "COT-2026-007", type: "quote", status: "envoye", total_ttc: 10, date_paiement: null, deleted_at: null },
            error: null,
          },
        },
        { table: "document_receipts", op: "select", result: { data: [], error: null } },
        { table: "accounting_entries", op: "select", result: { data: [], error: null } },
        {
          table: "documents",
          op: "delete",
          match: (row) => row.filters.id === "126" && row.filters.user_id === CLUB,
          result: { error: null },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    const response = await DELETE(request("126"));
    expect(response.status).toBe(200);
    expect(log.some((row) => row.op === "update")).toBe(false);
    expect(log.some((row) => row.table === "accounting_entries" && row.op !== "select")).toBe(false);
  });

  it("archive une facture payée et comptabilisée sans toucher l'écriture ni les totaux", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        { table: "documents", op: "select", result: { data: { id: "126" }, error: null } },
        {
          table: "documents",
          op: "select",
          result: {
            data: { id: "126", numero: "FAC-2026-004", type: "invoice", status: "paye", total_ttc: 280, date_paiement: "2026-06-07", deleted_at: null },
            error: null,
          },
        },
        { table: "document_receipts", op: "select", result: { data: [{ id: "receipt-1", amount: 280, idempotency_key: "key-1" }], error: null } },
        { table: "accounting_entries", op: "select", result: { data: [{ id: "entry-1", amount: 280, status: "validated" }], error: null } },
        {
          table: "documents",
          op: "update",
          match: (row) => {
            const payload = row.payload as Record<string, unknown>;
            return payload.deleted_by === USER
              && typeof payload.deleted_at === "string"
              && !("status" in payload)
              && !("total_ttc" in payload)
              && !("amount" in payload)
              && row.filters.id === "126"
              && row.filters.user_id === CLUB;
          },
          result: { error: null },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    const response = await DELETE(request("126"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.archived).toBe(true);
    expect(log.filter((row) => row.table === "accounting_entries" && row.op === "update")).toHaveLength(0);
    expect(log.filter((row) => row.table === "document_receipts" && row.op !== "select")).toHaveLength(0);
    expect(log.filter((row) => row.table === "accounting_inbox")).toHaveLength(0);
  });

  it("archive une cotisation payée sans écriture", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        { table: "documents", op: "select", result: { data: { id: "126" }, error: null } },
        {
          table: "documents",
          op: "select",
          result: {
            data: { id: "126", numero: "COT-2026-007", type: "quote", status: "accepte", total_ttc: 96.93, date_paiement: "2026-10-04", deleted_at: null },
            error: null,
          },
        },
        { table: "document_receipts", op: "select", result: { data: [], error: null } },
        { table: "accounting_entries", op: "select", result: { data: [], error: null } },
        { table: "documents", op: "update", result: { error: null } },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    const response = await DELETE(request("126"));
    expect(response.status).toBe(200);
    expect(log.some((row) => row.op === "delete")).toBe(false);
    const update = log.find((row) => row.op === "update");
    expect(update?.table).toBe("documents");
  });

  it("efface aussi un document dont l'identifiant est un UUID", async () => {
    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "documents",
          op: "select",
          result: {
            data: { id, numero: "FAC-2026-001", type: "invoice", status: "brouillon", total_ttc: 1, date_paiement: null, deleted_at: null },
            error: null,
          },
        },
        { table: "document_receipts", op: "select", result: { data: [], error: null } },
        { table: "accounting_entries", op: "select", result: { data: [], error: null } },
        { table: "documents", op: "delete", match: (row) => row.filters.id === id, result: { error: null } },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    const response = await DELETE(request(id));
    expect(response.status).toBe(200);
    expect(log.filter((row) => row.op === "select" && row.table === "documents")).toHaveLength(1);
  });

  it("refuse le document d'un autre club", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        {
          table: "documents",
          op: "select",
          match: (row) => row.filters.user_id === CLUB && row.filters.id === "77",
          result: { data: null, error: null },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    const response = await DELETE(request("77"));
    expect(response.status).toBe(404);
    expect(log.some((row) => row.op === "delete" || row.op === "update")).toBe(false);
    expect(OTHER).not.toBe(CLUB);
  });

  it("un second appel sur une archive ne réécrit ni l'écriture ni le paiement", async () => {
    const { client, log } = createThenableSupabaseMock([
      sequentialOps([
        { table: "documents", op: "select", result: { data: { id: "126" }, error: null } },
        {
          table: "documents",
          op: "select",
          result: {
            data: { id: "126", numero: "COT-2026-007", type: "quote", status: "accepte", total_ttc: 10, deleted_at: "2026-10-07T00:00:00.000Z" },
            error: null,
          },
        },
      ]),
    ]);
    vi.mocked(createAdminClient).mockReturnValue(client as never);
    const response = await DELETE(request("126"));
    expect(response.status).toBe(200);
    expect(log.filter((row) => row.op === "update" || row.op === "delete")).toHaveLength(0);
  });
});
