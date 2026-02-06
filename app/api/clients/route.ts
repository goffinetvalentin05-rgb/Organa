import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";

/* =========================
   GET : liste des clients
   ========================= */
export async function GET() {
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

  // Charger les clients depuis Supabase
  // Note: Les colonnes BD sont en anglais (name, phone, address)
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, address, postal_code, city, user_id, role, category")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API][clients][GET] Erreur Supabase", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Filtrer les clients valides (avec ID) et mapper vers les noms français pour le frontend
  const clients = (data || [])
    .filter((c) => c.id && typeof c.id === "string" && c.user_id === user.id)
    .map((c) => ({
      id: c.id,
      nom: c.name,
      email: c.email,
      telephone: c.phone,
      adresse: c.address,
      postal_code: c.postal_code,
      city: c.city,
      user_id: c.user_id,
      role: c.role,
      category: c.category,
    }));

  return NextResponse.json({ clients }, { status: 200 });
}

/* =========================
   POST : créer un client
   ========================= */
export async function POST(request: NextRequest) {
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

  const { nom, email, telephone, adresse, postal_code, city, role, category } = body;

  // Validation du nom (obligatoire)
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    return NextResponse.json(
      { error: "Le champ 'nom' est requis" },
      { status: 400 }
    );
  }

  // Insertion dans Supabase
  // Note: La colonne BD s'appelle "name", on mappe depuis "nom" du formulaire
  const { data: newClient, error: insertError } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: nom.trim(),
      email: email || null,
      phone: telephone || null,
      address: adresse || null,
      postal_code: postal_code || null,
      city: city || null,
      role: role || "player",
      category: category || null,
    })
    .select("id, name, email, phone, address, postal_code, city, user_id, role, category")
    .single();

  if (insertError) {
    console.error("[API][clients][POST] Erreur Supabase", insertError);
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  if (!newClient || !newClient.id) {
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    );
  }

  // Mapper vers les noms français pour le frontend
  const clientResponse = {
    id: newClient.id,
    nom: newClient.name,
    email: newClient.email,
    telephone: newClient.phone,
    adresse: newClient.address,
    postal_code: newClient.postal_code,
    city: newClient.city,
    user_id: newClient.user_id,
    role: newClient.role,
    category: newClient.category,
  };

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json({ client: clientResponse }, { status: 201 });
}
