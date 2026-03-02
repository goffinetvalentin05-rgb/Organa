import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) return accessCheck.response;

    const body = await request.json();
    const date = body?.date;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Date invalide (YYYY-MM-DD)" }, { status: 400 });
    }

    const { error } = await supabase.from("buvette_slots").upsert(
      {
        user_id: user.id,
        slot_date: date,
        status: "blocked",
        source: "admin",
        reason: reason || "Bloqué par le club",
      },
      { onConflict: "user_id,slot_date" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) return accessCheck.response;

    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Date invalide (YYYY-MM-DD)" }, { status: 400 });
    }

    const { error } = await supabase
      .from("buvette_slots")
      .delete()
      .eq("user_id", user.id)
      .eq("slot_date", date)
      .eq("source", "admin")
      .eq("status", "blocked");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
