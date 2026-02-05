import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

/* =========================
   DELETE : supprimer un type d'événement
   ========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID du type d'événement requis" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("event_types")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API][event-types][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord/evenements");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][event-types][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}
