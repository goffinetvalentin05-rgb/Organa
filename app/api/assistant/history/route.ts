import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { searchParams } = new URL(request.url);
    const relatedType = searchParams.get("relatedType");
    const relatedId = searchParams.get("relatedId");
    const clientId = searchParams.get("clientId");

    let query = supabase
      .from("email_history")
      .select("id, to_email, subject, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (relatedType) {
      query = query.eq("related_type", relatedType);
    }
    if (relatedId) {
      query = query.eq("related_id", relatedId);
    }
    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Assistant][history] Error:", error);
      return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    console.error("[Assistant][history] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error?.message || "Erreur inconnue" },
      { status: 500 }
    );
  }
}

