import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Get public QR code info by code (no auth required)
// Uses admin client to bypass RLS for public access
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = createAdminClient();

    // Get QR code with club info
    const { data: qrcode, error } = await supabase
      .from("qrcodes")
      .select(`
        id,
        name,
        description,
        event_type,
        event_date,
        code,
        is_active,
        user_id
      `)
      .eq("code", code)
      .single();

    if (error || !qrcode) {
      return NextResponse.json({ error: "QR code non trouvé" }, { status: 404 });
    }

    if (!qrcode.is_active) {
      return NextResponse.json({ error: "Cet événement n'accepte plus d'inscriptions" }, { status: 400 });
    }

    // Get club name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("id", qrcode.user_id)
      .single();

    return NextResponse.json({
      qrcode: {
        id: qrcode.id,
        name: qrcode.name,
        description: qrcode.description,
        eventType: qrcode.event_type,
        eventDate: qrcode.event_date,
        isActive: qrcode.is_active,
      },
      clubName: profile?.company_name || "Club",
    });
  } catch (error) {
    console.error("[API][QRCode Public] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
