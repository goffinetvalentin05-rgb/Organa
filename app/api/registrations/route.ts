import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Create a new registration (public - no auth required)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { qrcodeId, firstName, lastName, email, phone, comment } = body;

    // Validate required fields
    if (!qrcodeId) {
      return NextResponse.json({ error: "QR code manquant" }, { status: 400 });
    }
    if (!firstName?.trim()) {
      return NextResponse.json({ error: "Le prénom est obligatoire" }, { status: 400 });
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "L'email est obligatoire" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Check if QR code exists and is active
    const { data: qrcode, error: qrError } = await supabase
      .from("qrcodes")
      .select("id, is_active, name")
      .eq("id", qrcodeId)
      .single();

    if (qrError || !qrcode) {
      return NextResponse.json({ error: "QR code non trouvé" }, { status: 404 });
    }

    if (!qrcode.is_active) {
      return NextResponse.json({ error: "Cet événement n'accepte plus d'inscriptions" }, { status: 400 });
    }

    // Check if email already registered for this QR code
    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("qrcode_id", qrcodeId)
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà inscrit à cet événement" }, { status: 400 });
    }

    // Create registration
    const { data: registration, error } = await supabase
      .from("registrations")
      .insert({
        qrcode_id: qrcodeId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        comment: comment?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[API][Registrations] Erreur création:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registration, eventName: qrcode.name }, { status: 201 });
  } catch (error) {
    console.error("[API][Registrations] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Delete a registration (requires auth)
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

    // Verify the registration belongs to a QR code owned by the user
    const { data: registration } = await supabase
      .from("registrations")
      .select(`
        id,
        qrcode:qrcodes!inner(user_id)
      `)
      .eq("id", id)
      .single();

    if (!registration || (registration.qrcode as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error } = await supabase
      .from("registrations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[API][Registrations] Erreur suppression:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API][Registrations] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
