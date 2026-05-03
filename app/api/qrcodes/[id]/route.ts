import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

// GET: Get a specific QR code with its registrations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_MEMBERS);
    if ("error" in guard) return guard.error;

    const { id } = await params;
    const supabase = await createClient();

    const { data: qrcode, error: qrError } = await supabase
      .from("qrcodes")
      .select("*")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (qrError || !qrcode) {
      return NextResponse.json({ error: "QR code non trouvé" }, { status: 404 });
    }

    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select("*")
      .eq("qrcode_id", id)
      .order("created_at", { ascending: false });

    if (regError) {
      console.error("[API][QRCode] Erreur registrations:", regError);
    }

    return NextResponse.json({
      qrcode,
      registrations: registrations || [],
    });
  } catch (error) {
    console.error("[API][QRCode] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH: Update a QR code
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
    if ("error" in guard) return guard.error;

    const { id } = await params;
    const supabase = await createClient();

    const body = await request.json();
    const { name, description, eventType, eventDate, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (eventType !== undefined) updateData.event_type = eventType;
    if (eventDate !== undefined) updateData.event_date = eventDate || null;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: qrcode, error } = await supabase
      .from("qrcodes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .select()
      .single();

    if (error) {
      console.error("[API][QRCode] Erreur update:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ qrcode });
  } catch (error) {
    console.error("[API][QRCode] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
