import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

// GET: List all QR codes for the current club
export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_MEMBERS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { data: qrcodes, error } = await supabase
      .from("qrcodes")
      .select(
        `
        *,
        registrations:registrations(count)
      `
      )
      .eq("user_id", guard.clubId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API][QRCodes] Erreur:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const body = await request.json();
    const { name, description, eventType, eventDate } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
    }

    const code = nanoid(10);

    const { data: qrcode, error } = await supabase
      .from("qrcodes")
      .insert({
        user_id: guard.clubId,
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
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from("qrcodes")
      .delete()
      .eq("id", id)
      .eq("user_id", guard.clubId);

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
