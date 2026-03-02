import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

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

    const { data: duplicateEmail } = await supabase
      .from("marketing_contacts")
      .select("id")
      .eq("club_id", user.id)
      .eq("email_normalized", email)
      .neq("id", id)
      .maybeSingle();

    if (duplicateEmail) {
      return NextResponse.json(
        { error: "Un contact avec cet email existe déjà pour ce club" },
        { status: 409 }
      );
    }

    const { data: updatedContact, error } = await supabase
      .from("marketing_contacts")
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        source,
      })
      .eq("id", id)
      .eq("club_id", user.id)
      .select("id, first_name, last_name, email, phone, source, source_id, created_at, unsubscribed")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact: updatedContact }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

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

    const { error } = await supabase
      .from("marketing_contacts")
      .delete()
      .eq("id", id)
      .eq("club_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

