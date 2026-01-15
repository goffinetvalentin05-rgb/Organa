import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("depenses")
      .select(
        "id, fournisseur, montant, date_echeance, statut, note, piece_jointe"
      )
      .eq("user_id", user.id)
      .order("date_echeance", { ascending: true });

    if (error) {
      console.error("[API][depenses][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des dépenses" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { depenses: (data || []).map(formatDepense) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API][depenses][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { fournisseur, montant, dateEcheance, statut, note, pieceJointe } =
      body || {};

    if (!fournisseur || !dateEcheance || typeof montant !== "number") {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("depenses")
      .insert({
        user_id: user.id,
        fournisseur: String(fournisseur).trim(),
        montant,
        date_echeance: dateEcheance,
        statut: statut || "a_payer",
        note: note || null,
        piece_jointe: pieceJointe || null,
      })
      .select(
        "id, fournisseur, montant, date_echeance, statut, note, piece_jointe"
      )
      .single();

    if (error) {
      console.error("[API][depenses][POST] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création de la dépense" },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/depenses");

    return NextResponse.json(
      { depense: formatDepense(data) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API][depenses][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de dépense requis" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("depenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API][depenses][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    revalidatePath("/tableau-de-bord");
    revalidatePath("/tableau-de-bord/depenses");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][depenses][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}

function formatDepense(depense: any) {
  const montant =
    typeof depense.montant === "number"
      ? depense.montant
      : Number(depense.montant) || 0;

  return {
    id: depense.id,
    fournisseur: depense.fournisseur || "",
    montant,
    dateEcheance: depense.date_echeance || "",
    statut: depense.statut || "a_payer",
    note: depense.note || undefined,
    pieceJointe: depense.piece_jointe || undefined,
  };
}

