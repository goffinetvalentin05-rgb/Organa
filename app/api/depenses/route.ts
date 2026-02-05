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
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("[API][depenses][GET] Erreur Supabase:", {
        message: error.message,
        details: error.details,
        code: error.code,
      });
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

    if (!data) {
      console.warn("[API][depenses][GET] Données nulles pour expenses.");
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
    const {
      label,
      description,
      amount,
      date,
      status,
      notes,
      attachmentUrl,
      attachment_url,
      eventId,
      event_id,
    } = body || {};

    const descriptionValue = label ?? description;
    if (
      !descriptionValue ||
      typeof descriptionValue !== "string" ||
      !date ||
      typeof date !== "string" ||
      typeof amount !== "number" ||
      !Number.isFinite(amount)
    ) {
      return NextResponse.json(
        { error: "Données invalides", details: "description, date ou montant" },
        { status: 400 }
      );
    }

    const payload = {
      user_id: user.id,
      description: String(descriptionValue).trim(),
      amount,
      date,
      status: status === "paye" ? "paye" : "a_payer",
      notes: notes || null,
      attachment_url: attachment_url ?? attachmentUrl ?? null,
      event_id: event_id ?? eventId ?? null,
    };

    console.log("[API][depenses][POST] user:", user);
    console.log("[API][depenses][POST] payload:", payload);

    const { data, error } = await supabase
      .from("expenses")
      .insert(payload)
      .select("id, description, amount, date, status, notes, attachment_url")
      .single();

    console.log("[API][depenses][POST] data:", data);
    console.log("[API][depenses][POST] error:", error);
    if (error) {
      console.error("[API][depenses][POST] error.message:", error.message);
      console.error("[API][depenses][POST] error.code:", error.code);
      if ("details" in error) {
        console.error("[API][depenses][POST] error.details:", error.details);
      }
    }

    if (error) {
      console.error("[API][depenses][POST] Erreur Supabase:", {
        message: error.message,
        details: error.details,
        code: error.code,
      });
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
    label: depense.description || "",
    amount,
    date: depense.date || "",
    status: depense.status || "a_payer",
    notes: depense.notes || undefined,
    attachmentUrl: depense.attachment_url || undefined,
  };
}

