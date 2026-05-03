import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";

export const runtime = "nodejs";

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

  // Récupérer le client depuis Supabase
  // Note: Les colonnes BD sont en anglais (name, phone, address)
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, address, postal_code, city, user_id, role, category, created_by, updated_by, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", guard.clubId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Client introuvable" },
      { status: 404 }
    );
  }

  // Mapper vers les noms français pour le frontend
  const client = {
    id: data.id,
    nom: data.name,
    email: data.email,
    telephone: data.phone,
    adresse: data.address,
    postal_code: data.postal_code,
    city: data.city,
    user_id: data.user_id,
    role: data.role,
    category: data.category,
    createdBy: data.created_by ?? null,
    updatedBy: data.updated_by ?? null,
    createdAt: data.created_at ?? null,
    updatedAt: data.updated_at ?? null,
  };

  return NextResponse.json({ client });
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

  // Mise à jour dans Supabase
  // Note: Les colonnes BD sont en anglais (name, phone, address)
  const { data: updated, error: updateError } = await supabase
    .from("clients")
    .update({
      name: nom.trim(),
      email: email || null,
      phone: telephone || null,
      address: adresse || null,
      postal_code: postal_code || null,
      city: city || null,
      role: role || "player",
      category: category ?? null,
      updated_by: user.id,
    })
    .eq("id", id)
    .eq("user_id", guard.clubId)
    .select("id, name, email, phone, address, postal_code, city, user_id, role, category, created_by, updated_by, created_at, updated_at")
    .maybeSingle();

  if (updateError) {
    console.error("[API][clients][PUT] Erreur Supabase", updateError);
    return NextResponse.json(
      { error: updateError.message },
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

  const clientResponse = {
    id: updated.id,
    nom: updated.name,
    email: updated.email,
    telephone: updated.phone,
    adresse: updated.address,
    postal_code: updated.postal_code,
    city: updated.city,
    user_id: updated.user_id,
    role: updated.role,
    category: updated.category,
    createdBy: updated.created_by ?? null,
    updatedBy: updated.updated_by ?? null,
    createdAt: updated.created_at ?? null,
    updatedAt: updated.updated_at ?? null,
  };

  return NextResponse.json({ success: true, client: clientResponse });
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
    console.error("[API][clients][DELETE] Erreur Supabase", deleteError);
    return NextResponse.json(
      { error: deleteError.message },
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
