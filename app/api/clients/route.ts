import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";

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

  // Colonnes réelles : migration 001 (nom, telephone, adresse). user_id = identifiant du club.
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, nom, email, telephone, adresse, postal_code, city, user_id, role, category, created_by, updated_by, created_at, updated_at"
    )
    .eq("user_id", guard.clubId)
    .order("created_at", { ascending: false });

  if (error) {
    logClientsSupabase("GET", error);
    return NextResponse.json(
      { error: "Impossible de charger les membres", code: "CLIENTS_LIST_FAILED" },
      { status: 500 }
    );
  }

  // Filtrer les clients valides (avec ID) et mapper vers le contrat JSON du frontend
  const clients = (data || [])
    .filter((c) => c.id && typeof c.id === "string" && c.user_id === guard.clubId)
    .map((c) => ({
      id: c.id,
      nom: c.nom,
      email: c.email,
      telephone: c.telephone,
      adresse: c.adresse,
      postal_code: c.postal_code,
      city: c.city,
      user_id: c.user_id,
      role: c.role,
      category: c.category,
      createdBy: c.created_by ?? null,
      updatedBy: c.updated_by ?? null,
      createdAt: c.created_at ?? null,
      updatedAt: c.updated_at ?? null,
    }));

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

  const { nom, email, telephone, adresse, postal_code, city, role, category } = body;

  // Validation du nom (obligatoire)
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    return NextResponse.json(
      { error: "Le champ 'nom' est requis" },
      { status: 400 }
    );
  }

  // Insertion dans Supabase (colonnes FR : nom, telephone, adresse)
  const { data: newClient, error: insertError } = await supabase
    .from("clients")
    .insert({
      user_id: guard.clubId,
      nom: nom.trim(),
      email: email || null,
      telephone: telephone || null,
      adresse: adresse || null,
      postal_code: postal_code || null,
      city: city || null,
      role: role || "player",
      category: category || null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select(
      "id, nom, email, telephone, adresse, postal_code, city, user_id, role, category, created_by, updated_by, created_at"
    )
    .single();

  if (insertError) {
    logClientsSupabase("POST", insertError);
    return NextResponse.json(
      { error: "Impossible de créer le membre", code: "CLIENTS_CREATE_FAILED" },
      { status: 500 }
    );
  }

  if (!newClient || !newClient.id) {
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }

  const clientResponse = {
    id: newClient.id,
    nom: newClient.nom,
    email: newClient.email,
    telephone: newClient.telephone,
    adresse: newClient.adresse,
    postal_code: newClient.postal_code,
    city: newClient.city,
    user_id: newClient.user_id,
    role: newClient.role,
    category: newClient.category,
    createdBy: newClient.created_by ?? null,
    updatedBy: newClient.updated_by ?? null,
    createdAt: (newClient as { created_at?: string | null }).created_at ?? null,
  };

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId: guard.clubId,
    action: AuditAction.CREATE,
    resourceType: "member",
    resourceId: String(newClient.id),
    metadata: { role: newClient.role },
    ...meta,
  });

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json({ client: clientResponse }, { status: 201 });
}
