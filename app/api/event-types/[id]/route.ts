import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

/* =========================
   DELETE : supprimer un type d'événement
   ========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_EXPENSES);
    if ("error" in guard) return guard.error;

    const { id } = await params;
    const supabase = await createClient();

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
      .eq("user_id", guard.clubId);

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
