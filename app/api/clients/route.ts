import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const { data, error } = await supabase
    .from("clients")
    .select("id, nom, email, telephone, adresse, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API][clients][GET] Erreur Supabase", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Filtrer les clients valides (avec ID)
  const clients = (data || []).filter(
    (c) => c.id && typeof c.id === "string" && c.user_id === user.id
  );

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

  const { nom, email, telephone, adresse } = body;

  // Validation du nom (obligatoire)
  if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
    return NextResponse.json(
      { error: "Le champ 'nom' est requis" },
      { status: 400 }
    );
  }

  // Vérifier le plan de l'utilisateur et les limites (source unique de vérité)
  const { getPlan } = await import("@/lib/billing/getPlan");
  const { MAX_CLIENTS_FREE, getLimitErrorMessage } = await import("@/lib/billing/limits");

  let planResult;
  try {
    planResult = await getPlan();
  } catch (error: any) {
    console.error("[API][clients][POST] Erreur récupération plan", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du plan" },
      { status: 500 }
    );
  }

  const plan = planResult.plan;

  // Si plan gratuit, vérifier la limite de clients
  if (plan === "free") {
    const { count, error: countError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.error("[LIMIT][clients] Erreur comptage", { user_id: user.id, error: countError });
      return NextResponse.json(
        { error: "Erreur lors de la vérification des limites" },
        { status: 500 }
      );
    }

    const currentCount = count ?? 0;
    console.log(`[LIMIT][clients] user=${user.id} plan=${plan} count=${currentCount} max=${MAX_CLIENTS_FREE}`);

    if (currentCount >= MAX_CLIENTS_FREE) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: getLimitErrorMessage("clients", plan),
          limit: MAX_CLIENTS_FREE,
          current: currentCount,
          plan: plan,
        },
        { status: 403 }
      );
    }
  }

  // Insertion dans Supabase
  const { data: newClient, error: insertError } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      nom: nom.trim(),
      email: email || null,
      telephone: telephone || null,
      adresse: adresse || null,
    })
    .select("id, nom, email, telephone, adresse, user_id")
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

  // Invalider le cache
  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json({ client: newClient }, { status: 201 });
}
