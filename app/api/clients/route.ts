import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";
import {
  normalizeClientsDbRow,
  normalizedClientToApiListItem,
} from "@/lib/clients/normalizeDbRow";
import { fetchMergedMemberFieldSettings } from "@/lib/member-fields/loadSettings";
import { buildClientInsertPayload } from "@/lib/clients/memberWritePayload";

export const runtime = "nodejs";

const CLIENT_CREATE_USER_MESSAGE =
  "Impossible de créer le membre. Vérifiez les informations saisies ou réessayez.";

function redactEmails(s: string): string {
  return s.replace(/\S+@\S+/gi, "[redacted]");
}

function logClientsSupabase(
  op: string,
  err: {
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
  },
  meta?: Record<string, unknown>
) {
  const msg = err.message ?? "";
  console.error(`[API][clients][${op}] supabase_error`, {
    ...meta,
    code: err.code ?? null,
    message: redactEmails(msg).slice(0, 600),
    details: err.details ?? null,
    hint: err.hint ?? null,
  });
}

/** Log debug : pas de secrets ; champs sensibles masqués ou réduits à une longueur. */
function summarizeInsertPayloadForLog(payload: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === "string") {
      if (
        k === "email" ||
        k === "telephone" ||
        k === "adresse" ||
        k === "avs_number"
      ) {
        out[k] = v.length === 0 ? "" : `[présent, len=${v.length}]`;
      } else {
        out[k] = v.length > 120 ? `[len=${v.length}]` : v;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

function extractPgNotNullColumn(err: {
  message?: string;
  details?: string | null;
}): string | null {
  const src = `${err.message ?? ""} ${err.details ?? ""}`;
  const m = src.match(/null value in column "([^"]+)"/i);
  return m ? m[1] : null;
}

function jsonForClientCreateFailure(
  insertError: {
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
  },
  isDev: boolean
): { status: number; body: Record<string, unknown> } {
  const code = insertError.code ?? "";
  let status = 500;
  let message = CLIENT_CREATE_USER_MESSAGE;
  let apiCode = "CLIENTS_CREATE_FAILED";

  if (code === "23505") {
    status = 409;
    message =
      "Impossible de créer le membre : une contrainte d'unicité a été violée (souvent un email déjà utilisé).";
    apiCode = "CLIENTS_CREATE_DUPLICATE";
  } else if (code === "23502") {
    status = 400;
    const col = extractPgNotNullColumn(insertError);
    if (col === "organization_id") {
      message =
        "Impossible de créer le membre : la base doit être mise à jour (migration « organization_id » sur les membres). Réessayez après déploiement SQL, ou contactez le support.";
    } else if (col === "name") {
      message =
        "Impossible de créer le membre : la base contient encore l’ancienne colonne « name » en plus de « nom ». Exécutez la migration 040 sur Supabase (nettoyage des colonnes membres), puis réessayez.";
    } else if (col) {
      message = `Impossible de créer le membre : un champ obligatoire côté serveur est vide (« ${col} »). Vérifiez les paramètres du club ou contactez le support.`;
    } else {
      message =
        "Impossible de créer le membre : données incomplètes (champ obligatoire manquant).";
    }
    apiCode = "CLIENTS_CREATE_NOT_NULL";
  } else if (
    code === "42501" ||
    (insertError.message &&
      /row-level security|violates row-level security/i.test(insertError.message))
  ) {
    message =
      "Impossible de créer le membre : vous n'avez pas l'autorisation d'enregistrer pour ce club.";
    apiCode = "CLIENTS_CREATE_RLS";
  } else if (code === "PGRST116") {
    message =
      "Impossible de créer le membre : aucune ligne retournée (vérifiez les droits ou les filtres).";
    apiCode = "CLIENTS_CREATE_NO_ROW";
  }

  const body: Record<string, unknown> = {
    error: message,
    code: apiCode,
  };
  if (isDev) {
    body.debug = {
      supabaseCode: insertError.code ?? null,
      supabaseMessage: insertError.message
        ? redactEmails(insertError.message)
        : null,
      details: insertError.details ?? null,
      hint: insertError.hint ?? null,
    };
  }
  return { status, body };
}

/* =========================
   GET : liste des clients
   ========================= */
export async function GET() {
  const guard = await requirePermission(PERMISSIONS.VIEW_MEMBERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();

  // select('*') : évite les 500 si certaines colonnes (postal_code, created_by…) ne sont pas
  // encore en prod ; normalizeClientsDbRow gère nom/name, telephone/phone, etc.
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", guard.clubId)
    .order("created_at", { ascending: false });

  if (error) {
    logClientsSupabase("GET", error);
    return NextResponse.json(
      { error: "Impossible de charger les membres", code: "CLIENTS_LIST_FAILED" },
      { status: 500 }
    );
  }

  const clients = (data || [])
    .map((c) => normalizeClientsDbRow(c as Record<string, unknown>))
    .filter(
      (n): n is NonNullable<typeof n> =>
        n !== null && n.user_id === guard.clubId
    )
    .map((n) => normalizedClientToApiListItem(n));

  return NextResponse.json({ clients }, { status: 200 });
}

/* =========================
   POST : créer un client
   ========================= */
export async function POST(request: NextRequest) {
  const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();
  const user = guard.ctx.user;

  // Vérifier l'accès en écriture (trial actif ou abonnement)
  const accessCheck = await requireWriteAccess();
  if (accessCheck.response) {
    return accessCheck.response;
  }

  // Parse du body
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const bodyObj = body as Record<string, unknown>;
  const nom = bodyObj.nom;
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    return NextResponse.json(
      { error: "Le champ 'nom' est requis" },
      { status: 400 }
    );
  }

  const fieldSettings = await fetchMergedMemberFieldSettings(supabase, guard.clubId);
  const insertPayload = buildClientInsertPayload(
    bodyObj,
    fieldSettings,
    guard.clubId,
    user.id
  );

  const isDev = process.env.NODE_ENV === "development";

  console.error("[API][clients][POST] attempt", {
    clubId: guard.clubId,
    actorUserId: user.id,
    insertKeys: Object.keys(insertPayload),
    payloadSummary: summarizeInsertPayloadForLog(insertPayload),
  });

  const { data: newClient, error: insertError } = await supabase
    .from("clients")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError) {
    logClientsSupabase("POST", insertError, {
      clubId: guard.clubId,
      actorUserId: user.id,
    });
    const { status, body } = jsonForClientCreateFailure(insertError, isDev);
    return NextResponse.json(body, { status });
  }

  const normalized = newClient
    ? normalizeClientsDbRow(newClient as Record<string, unknown>)
    : null;
  if (!normalized || !normalized.id) {
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }

  const clientResponse = normalizedClientToApiListItem(normalized);

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: AuditAction.CREATE,
    resourceType: "member",
    resourceId: String(normalized.id),
    metadata: { role: normalized.role },
    ...meta,
  });

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json({ client: clientResponse }, { status: 201 });
}
