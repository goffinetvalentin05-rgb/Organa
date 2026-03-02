import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const source = request.nextUrl.searchParams.get("source")?.trim() || "";

    let query = supabase
      .from("marketing_contacts")
      .select(
        "id, first_name, last_name, email, phone, source, source_id, created_at, unsubscribed, unsubscribed_at"
      )
      .eq("club_id", user.id)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }
    if (source) {
      query = query.eq("source", source);
    }

    const { data: contacts, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: sourceRows } = await supabase
      .from("marketing_contacts")
      .select("source")
      .eq("club_id", user.id);

    const sources = Array.from(new Set((sourceRows || []).map((row) => row.source).filter(Boolean)));

    return NextResponse.json({ contacts: contacts || [], sources }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

