import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

/* =========================
   GET : liste des types d'événements
   ========================= */
export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_EXPENSES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_types")
      .select("id, name, created_at")
      .eq("user_id", guard.clubId)
      .order("name", { ascending: true });

    if (error) {
      console.error("[API][event-types][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des types d'événements", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ eventTypes: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error("[API][event-types][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   POST : créer un type d'événement
   ========================= */
export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_EXPENSES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const body = await request.json();
    const { name } = body || {};

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du type d'événement est requis" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("event_types")
      .insert({
        user_id: guard.clubId,
        name: name.trim(),
      })
      .select("id, name, created_at")
      .single();

    if (error) {
      console.error("[API][event-types][POST] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création du type d'événement", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord/evenements");

    return NextResponse.json({ eventType: data }, { status: 201 });
  } catch (error: any) {
    console.error("[API][event-types][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création", details: error.message },
      { status: 500 }
    );
  }
}
