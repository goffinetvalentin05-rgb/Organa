import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

// GET: List all QR codes for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: qrcodes, error } = await supabase
      .from("qrcodes")
      .select(`
        *,
        registrations:registrations(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API][QRCodes] Erreur:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format the response to include registration count
    const formattedQrcodes = qrcodes?.map((qr) => ({
      ...qr,
      registrationsCount: qr.registrations?.[0]?.count || 0,
    }));

    return NextResponse.json({ qrcodes: formattedQrcodes || [] });
  } catch (error) {
    console.error("[API][QRCodes] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Create a new QR code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, eventType, eventDate } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
    }

    // Generate a unique code for the QR
    const code = nanoid(10);

    const { data: qrcode, error } = await supabase
      .from("qrcodes")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        event_type: eventType || "other",
        event_date: eventDate || null,
        code,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[API][QRCodes] Erreur création:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ qrcode }, { status: 201 });
  } catch (error) {
    console.error("[API][QRCodes] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Delete a QR code
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from("qrcodes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[API][QRCodes] Erreur suppression:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API][QRCodes] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
