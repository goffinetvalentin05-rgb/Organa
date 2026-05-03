import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

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
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    const { data: reqData, error: reqError } = await supabase
      .from("buvette_requests")
      .select("id, status, first_name, last_name, email, reservation_date, event_type")
      .eq("id", id)
      .eq("user_id", guard.clubId)
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled")
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (profileError) {
      console.error("[API][buvette][send-info] Erreur profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors du chargement des paramètres" },
        { status: 500 }
      );
    }

    const clubName = profile?.company_name || "Club";
    const delivery = resolveResendFromProfile({
      company_name: profile?.company_name,
      company_email: profile?.company_email,
      email_sender_name: profile?.email_sender_name,
      email_sender_email: profile?.email_sender_email,
      resend_api_key: profile?.resend_api_key,
      email_custom_enabled: profile?.email_custom_enabled,
    });

    if (!delivery) {
      console.error("[API][buvette][send-info] Aucune configuration Resend utilisable");
      return NextResponse.json(
        { error: "L'envoi d'emails n'est pas disponible (configuration serveur ou paramètres expéditeur)." },
        { status: 503 }
      );
    }

    const resendInstance = delivery.resend;
    const from = delivery.from;
    const html = message.replace(/\n/g, "<br/>");

    const sendResult = await Promise.race([
      resendInstance.emails.send({
        from,
        to: [reqData.email],
        subject: `Infos pratiques - Réservation buvette du ${reqData.reservation_date} (${clubName})`,
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
        mode: delivery.mode,
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

