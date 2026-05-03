import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";
import {
  normalizeClientsDbRow,
  normalizedClientToApi,
} from "@/lib/clients/normalizeDbRow";

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
   GET : récupérer un client
   ========================= */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Résoudre params si c'est une Promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  // Vérification stricte de l'ID
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json(
      { error: "ID manquant ou invalide" },
      { status: 400 }
    );
  }

  const guard = await requirePermission(PERMISSIONS.VIEW_MEMBERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", guard.clubId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      logClientsSupabase("GET_BY_ID", error);
    }
    return NextResponse.json(
      { error: "Client introuvable", code: "CLIENT_NOT_FOUND" },
      { status: 404 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Client introuvable", code: "CLIENT_NOT_FOUND" },
      { status: 404 }
    );
  }

  const normalized = normalizeClientsDbRow(data as Record<string, unknown>);
  if (!normalized) {
    return NextResponse.json(
      { error: "Client introuvable", code: "CLIENT_NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ client: normalizedClientToApi(normalized) });
}

/* =========================
   PUT : modifier un client
   ========================= */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Résoudre params si c'est une Promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  // Vérification stricte de l'ID
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json(
      { error: "ID manquant ou invalide" },
      { status: 400 }
    );
  }

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

  const { nom, email, telephone, adresse, postal_code, city, role, category } = body;

  // Validation du nom (obligatoire)
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    return NextResponse.json(
      { error: "Le nom est obligatoire" },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("clients")
    .update({
      nom: nom.trim(),
      email: email || null,
      telephone: telephone || null,
      adresse: adresse || null,
      postal_code: postal_code || null,
      city: city || null,
      role: role || "player",
      category: category ?? null,
      updated_by: user.id,
    })
    .eq("id", id)
    .eq("user_id", guard.clubId)
    .select("*")
    .maybeSingle();

  if (updateError) {
    logClientsSupabase("PUT", updateError);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le membre", code: "CLIENTS_UPDATE_FAILED" },
      { status: 500 }
    );
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Client introuvable ou non autorisé" },
      { status: 404 }
    );
  }

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  const normalized = normalizeClientsDbRow(updated as Record<string, unknown>);
  if (!normalized) {
    return NextResponse.json(
      { error: "Client introuvable ou non autorisé" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    client: normalizedClientToApi(normalized),
  });
}

/* =========================
   DELETE : supprimer un client
   ========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Résoudre params si c'est une Promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  // Vérification stricte de l'ID
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json(
      { error: "ID manquant ou invalide" },
      { status: 400 }
    );
  }

  const guard = await requirePermission(PERMISSIONS.DELETE_MEMBERS);
  if ("error" in guard) return guard.error;

  const supabase = await createClient();

  // Vérifier l'accès en écriture (trial actif ou abonnement)
  const accessCheck = await requireWriteAccess();
  if (accessCheck.response) {
    return accessCheck.response;
  }

  // Suppression dans Supabase (vérifier qu'une ligne a bien été supprimée)
  const { data: deletedRows, error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", guard.clubId)
    .select("id");

  if (deleteError) {
    logClientsSupabase("DELETE", deleteError);
    return NextResponse.json(
      { error: "Impossible de supprimer le membre", code: "CLIENTS_DELETE_FAILED" },
      { status: 500 }
    );
  }

  if (!deletedRows || deletedRows.length === 0) {
    return NextResponse.json(
      { error: "Client introuvable ou déjà supprimé" },
      { status: 404 }
    );
  }

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: AuditAction.HARD_DELETE,
    resourceType: "member",
    resourceId: id,
    metadata: {},
    ...meta,
  });

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json({ success: true });
}
