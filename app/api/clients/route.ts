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

function logClientsSupabase(op: string, err: { code?: string; message?: string }) {
  const msg = err.message?.slice(0, 200) ?? "";
  console.error(`[API][clients][${op}] supabase_error`, {
    code: err.code ?? null,
    message_len: msg.length,
    message_hint: msg ? msg.replace(/\S+@\S+/gi, "[redacted]") : null,
  });
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

  const { data: newClient, error: insertError } = await supabase
    .from("clients")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError) {
    logClientsSupabase("POST", insertError);
    return NextResponse.json(
      { error: "Impossible de créer le membre", code: "CLIENTS_CREATE_FAILED" },
      { status: 500 }
    );
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
