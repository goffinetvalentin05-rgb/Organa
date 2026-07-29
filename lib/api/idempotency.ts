import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type IdempotencyOperationResult<TBody = unknown> = {
  status: number;
  body: TBody;
  resourceId?: string | null;
};

type WaitOptions = {
  maxWaitMs?: number;
  pollIntervalMs?: number;
};

const IDEMPOTENCY_HEADER = "Idempotency-Key";

function getIdempotencyKey(request: NextRequest): string | null {
  // Headers are case-insensitive, but NextRequest.get is strict on name casing
  // so we try the canonical casing.
  const fromHeader = request.headers.get(IDEMPOTENCY_HEADER);
  if (fromHeader && typeof fromHeader === "string" && fromHeader.trim()) {
    return fromHeader.trim();
  }
  return null;
}

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return String(code || "").toLowerCase() === "23505";
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function withIdempotency<TBody>(
  params: {
    request: NextRequest;
    clubId: string;
    // When absent, we simply run operation (retro-compat).
    idempotencyKey?: string | null;
    resourceType: string;
    operation: () => Promise<IdempotencyOperationResult<TBody>>;
  },
  waitOptions: WaitOptions = {}
): Promise<IdempotencyOperationResult<TBody>> {
  const idempotencyKey =
    params.idempotencyKey ?? getIdempotencyKey(params.request) ?? null;

  if (!idempotencyKey) {
    return params.operation();
  }

  const maxWaitMs = waitOptions.maxWaitMs ?? 15000;
  const pollIntervalMs = waitOptions.pollIntervalMs ?? 250;

  const supabase = await createAdminClient();
  const path = params.request.nextUrl?.pathname ?? "";
  const method = params.request.method ?? "POST";

  // 1) Fast path: key already completed.
  try {
    const { data: existing } = await supabase
      .from("idempotency_keys")
      .select("response_status,response_body,resource_id")
      .eq("club_id", params.clubId)
      .eq("key", idempotencyKey)
      .maybeSingle();

    if (existing && existing.response_status && existing.response_status !== 0) {
      return {
        status: existing.response_status,
        body: existing.response_body as TBody,
        resourceId: existing.resource_id ?? null,
      };
    }
  } catch {
    // If lookup fails, we just proceed with the normal operation.
  }

  // 2) Claim the key by inserting a placeholder record.
  const insertPayload = {
    club_id: params.clubId,
    key: idempotencyKey,
    method,
    path,
    resource_type: params.resourceType,
    // resource_id is unknown until operation completes
    resource_id: null,
    response_status: 0,
    response_body: {} as Record<string, unknown>,
  };

  const claimed = await supabase
    .from("idempotency_keys")
    .insert(insertPayload)
    .select("response_status")
    .maybeSingle();

  // 2a) If another request claimed it first, wait for completion.
  if (claimed.error) {
    if (!isUniqueViolation(claimed.error)) {
      return params.operation();
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < maxWaitMs) {
      const { data: existing } = await supabase
        .from("idempotency_keys")
        .select("response_status,response_body,resource_id")
        .eq("club_id", params.clubId)
        .eq("key", idempotencyKey)
        .maybeSingle();

      if (existing && existing.response_status && existing.response_status !== 0) {
        return {
          status: existing.response_status,
          body: existing.response_body as TBody,
          resourceId: existing.resource_id ?? null,
        };
      }

      await sleep(pollIntervalMs);
    }

    // Timed out waiting for the other request.
    return {
      status: 409,
      body: {
        error: "Requête déjà en cours. Réessayez dans quelques secondes.",
      } as TBody,
      resourceId: null,
    };
  }

  // 3) We are the first request: run operation and persist result.
  try {
    const result = await params.operation();

    try {
      await supabase
        .from("idempotency_keys")
        .update({
          response_status: result.status,
          response_body: result.body as unknown as Record<string, unknown>,
          resource_id: result.resourceId ?? null,
        })
        .eq("club_id", params.clubId)
        .eq("key", idempotencyKey);
    } catch {
      // Even if persistence fails, we still return the operation result.
    }

    return result;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue lors du traitement";

    const errorResult: IdempotencyOperationResult<TBody> = {
      status: 500,
      body: {
        error: "Erreur lors du traitement",
        details: message,
      } as TBody,
      resourceId: null,
    };

    try {
      await supabase
        .from("idempotency_keys")
        .update({
          response_status: errorResult.status,
          response_body: errorResult.body as Record<string, unknown>,
          resource_id: null,
        })
        .eq("club_id", params.clubId)
        .eq("key", idempotencyKey);
    } catch {
      // ignore
    }

    return errorResult;
  }
}

