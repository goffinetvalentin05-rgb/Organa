import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FROM_EMAIL = "noreply@obillz.com";
const RESEND_TIMEOUT_MS = 20000;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur serveur";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const { data: reqData, error: reqError } = await supabase
      .from("buvette_requests")
      .select("id, status, first_name, last_name, email, reservation_date, event_type")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (reqError || !reqData) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (reqData.status !== "accepted") {
      return NextResponse.json(
        { error: "Action disponible uniquement pour les réservations acceptées" },
        { status: 400 }
      );
    }

    if (!reqData.email) {
      return NextResponse.json(
        { error: "Email destinataire introuvable sur la réservation" },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("[API][buvette][send-info] RESEND_API_KEY manquante");
      return NextResponse.json(
        { error: "RESEND_API_KEY non configurée sur le serveur" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const html = message.replace(/\n/g, "<br/>");

    const sendResult = await Promise.race([
      resend.emails.send({
        from: FROM_EMAIL,
        to: [reqData.email],
        subject: `Infos pratiques - Réservation buvette du ${reqData.reservation_date}`,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${html}</div>`,
        text: message,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout envoi email Resend")), RESEND_TIMEOUT_MS)
      ),
    ]);

    const sendError =
      sendResult && typeof sendResult === "object" && "error" in sendResult
        ? (sendResult as { error?: { message?: string } }).error
        : undefined;

    if (sendError) {
      console.error("[API][buvette][send-info] Erreur Resend:", {
        requestId: id,
        to: reqData.email,
        from: FROM_EMAIL,
        message: sendError.message,
      });
      return NextResponse.json(
        { error: `Erreur lors de l'envoi de l'email: ${sendError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[API][buvette][send-info] Erreur inattendue:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

