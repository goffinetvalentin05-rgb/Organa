import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

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

  const supabase = await createClient();

  // Authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.id) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // Récupérer le client depuis Supabase
  // Note: Les colonnes BD sont en anglais (name, phone, address)
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, address, user_id, role, category")
    .eq("id", id)
    .eq("user_id", user.id)
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
    user_id: data.user_id,
    role: data.role,
    category: data.category,
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

  const supabase = await createClient();

  // Authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.id) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

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

  const { nom, email, telephone, adresse, role, category } = body;

  // Validation du nom (obligatoire)
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    return NextResponse.json(
      { error: "Le nom est obligatoire" },
      { status: 400 }
    );
  }

  // Mise à jour dans Supabase
  // Note: Les colonnes BD sont en anglais (name, phone, address)
  const { error: updateError } = await supabase
    .from("clients")
    .update({
      name: nom.trim(),
      email: email || null,
      phone: telephone || null,
      address: adresse || null,
      role: role || "player",
      category: category || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[API][clients][PUT] Erreur Supabase", updateError);
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json({ success: true });
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

  const supabase = await createClient();

  // Authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.id) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // Vérifier l'accès en écriture (trial actif ou abonnement)
  const accessCheck = await requireWriteAccess();
  if (accessCheck.response) {
    return accessCheck.response;
  }

  // Suppression dans Supabase
  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[API][clients][DELETE] Erreur Supabase", deleteError);
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json({ success: true });
}
