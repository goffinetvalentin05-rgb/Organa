import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const firstName = body?.firstName?.trim();
    const lastName = body?.lastName?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const phone = body?.phone?.trim() || null;
    const source = body?.source?.trim() || "manual";

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Nom, prénom et email sont obligatoires" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const { data: existingContact } = await supabase
      .from("marketing_contacts")
      .select("id")
      .eq("club_id", user.id)
      .eq("email_normalized", email)
      .maybeSingle();

    if (existingContact) {
      return NextResponse.json(
        { error: "Un contact avec cet email existe déjà pour ce club" },
        { status: 409 }
      );
    }

    const { data: contact, error } = await supabase
      .from("marketing_contacts")
      .insert({
        club_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        source,
      })
      .select("id, first_name, last_name, email, phone, source, source_id, created_at, unsubscribed")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

