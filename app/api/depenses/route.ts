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
      .from("expenses")
      .select("id, label, amount, date, status, notes, attachment_url")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("[API][depenses][GET] Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors du chargement des dépenses",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
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
    const { label, amount, date, status, notes } = body || {};

    if (!label || !date || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        label: String(label).trim(),
        amount,
        date,
        status: status || "a_payer",
        notes: notes || null,
        attachment_url: null,
      })
      .select("id, label, amount, date, status, notes, attachment_url")
      .single();

    if (error) {
      console.error("[API][depenses][POST] Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la création de la dépense",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
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
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API][depenses][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la suppression",
          details: error.message,
          hint: error.hint,
          code: error.code,
        },
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
  const amount =
    typeof depense.amount === "number"
      ? depense.amount
      : Number(depense.amount) || 0;

  return {
    id: depense.id,
    label: depense.label || "",
    amount,
    date: depense.date || "",
    status: depense.status || "a_payer",
    notes: depense.notes || undefined,
    attachmentUrl: depense.attachment_url || undefined,
  };
}

