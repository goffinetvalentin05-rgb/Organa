import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Stock en mémoire pour simuler la table Supabase `idempotency_keys`.
const store = new Map<
  string,
  { response_status: number; response_body: unknown; resource_id: string | null }
>();

type FromPayload = Record<string, unknown>;
type IdempotencyRow = {
  response_status: number;
  response_body: unknown;
  resource_id: string | null;
};

class IdempotencyKeysQuery {
  private mode: "select" | "insert" | "update" | null = null;
  private filters: Record<string, unknown> = {};
  private insertPayload: FromPayload | null = null;
  private updatePayload: FromPayload | null = null;

  constructor(private readonly table: string) {}

  select() {
    this.mode = "select";
    return this;
  }

  insert(payload: FromPayload) {
    this.mode = "insert";
    this.insertPayload = payload;
    return this;
  }

  update(payload: FromPayload) {
    this.mode = "update";
    this.updatePayload = payload;
    return this;
  }

  eq(col: string, value: unknown) {
    this.filters[col] = value;

    // Cas spécifique: on applique l'update dès que les 2 filtres sont connus.
    if (this.mode === "update" && this.updatePayload) {
      const clubId = String(this.filters["club_id"] ?? "");
      const key = String(this.filters["key"] ?? "");
      if (clubId && key) {
        const storeKey = `${clubId}::${key}`;
        const existing = store.get(storeKey);
        const next = {
          ...(existing || {
            response_status: 0,
            response_body: {},
            resource_id: null,
          }),
          response_status: Number(this.updatePayload["response_status"] ?? existing?.response_status ?? 0),
          response_body: this.updatePayload["response_body"] ?? existing?.response_body ?? {},
          resource_id:
            (this.updatePayload["resource_id"] as string | null | undefined) ?? existing?.resource_id ?? null,
        };
        store.set(storeKey, next);
        return Promise.resolve({ data: next, error: null });
      }
    }

    return this;
  }

  async maybeSingle(): Promise<{ data: unknown; error: unknown }> {
    if (this.mode === "select") {
      const clubId = String(this.filters["club_id"] ?? "");
      const key = String(this.filters["key"] ?? "");
      const storeKey = `${clubId}::${key}`;
      const row = store.get(storeKey);
      return { data: row || null, error: null };
    }

    if (this.mode === "insert") {
      const payload = this.insertPayload ?? {};
      const clubId = String(payload["club_id"] ?? "");
      const key = String(payload["key"] ?? "");
      const storeKey = `${clubId}::${key}`;

      if (store.has(storeKey)) {
        return {
          data: null,
          error: { code: "23505" }, // unique_violation
        };
      }

      store.set(storeKey, {
        response_status: 0,
        response_body: {},
        resource_id: null,
      });

      return { data: { response_status: 0 }, error: null };
    }

    return { data: null, error: null };
  }
}

const createSupabaseMock = () => {
  return {
    from: (_table: string) => new IdempotencyKeysQuery(_table),
  };
};

vi.mock("@/lib/supabase/admin", () => {
  return {
    createAdminClient: vi.fn(() => createSupabaseMock()),
  };
});

// Import après le mock.
import { withIdempotency } from "@/lib/api/idempotency";

function makeRequest(idempotencyKey: string, path = "/api/documents"): NextRequest {
  return {
    method: "POST",
    headers: new Headers({ "Idempotency-Key": idempotencyKey }),
    nextUrl: new URL(`https://example.local${path}`),
  } as unknown as NextRequest;
}

describe("avecIdempotency", () => {
  beforeEach(() => {
    store.clear();
  });

  it("même clé: exécute l'opération une seule fois", async () => {
    const op = vi.fn(async () => ({
      status: 201,
      body: { id: "doc-1" },
      resourceId: "doc-1",
    }));

    const req = makeRequest("k1");

    const first = await withIdempotency({
      request: req,
      clubId: "club-1",
      resourceType: "document",
      idempotencyKey: "k1",
      operation: op,
    });

    const second = await withIdempotency({
      request: req,
      clubId: "club-1",
      resourceType: "document",
      idempotencyKey: "k1",
      operation: op,
    });

    expect(op).toHaveBeenCalledTimes(1);
    expect(first.body).toEqual({ id: "doc-1" });
    expect(second.body).toEqual({ id: "doc-1" });
    expect(second.status).toBe(201);
  });

  it("clés différentes: exécute l'opération à chaque clé", async () => {
    const opK1 = vi.fn(async () => ({
      status: 201,
      body: { key: "k1" },
      resourceId: "doc-1",
    }));
    const opK2 = vi.fn(async () => ({
      status: 201,
      body: { key: "k2" },
      resourceId: "doc-2",
    }));

    const req1 = makeRequest("k1");
    const req2 = makeRequest("k2");

    await withIdempotency({
      request: req1,
      clubId: "club-1",
      resourceType: "document",
      idempotencyKey: "k1",
      operation: opK1,
    });

    await withIdempotency({
      request: req2,
      clubId: "club-1",
      resourceType: "document",
      idempotencyKey: "k2",
      operation: opK2,
    });

    expect(opK1).toHaveBeenCalledTimes(1);
    expect(opK2).toHaveBeenCalledTimes(1);
  });
});

