import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDecisionToRequester } from "@/lib/buvette/email";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

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
    const decision = body?.decision;
    if (decision !== "accepted" && decision !== "refused") {
      return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
    }

    const { data: reqData, error: reqError } = await supabase
      .from("buvette_requests")
      .select("id, reservation_date, status, first_name, last_name, email")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (reqError || !reqData) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    if (reqData.status !== "pending") {
      return NextResponse.json({ error: "Cette demande est déjà traitée" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error: updateReqError } = await supabase
      .from("buvette_requests")
      .update({
        status: decision,
        reviewed_at: now,
        reviewed_by: user.id,
        updated_at: now,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateReqError) {
      return NextResponse.json({ error: updateReqError.message }, { status: 500 });
    }

    if (decision === "accepted") {
      const { error: slotError } = await supabase.from("buvette_slots").upsert(
        {
          user_id: user.id,
          slot_date: reqData.reservation_date,
          status: "reserved",
          source: "external",
          reason: `Réservation validée (${reqData.first_name} ${reqData.last_name})`,
          request_id: reqData.id,
        },
        { onConflict: "user_id,slot_date" }
      );
      if (slotError) {
        return NextResponse.json({ error: slotError.message }, { status: 500 });
      }
    } else {
      await supabase
        .from("buvette_slots")
        .delete()
        .eq("user_id", user.id)
        .eq("request_id", reqData.id)
        .eq("status", "pending");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    await sendDecisionToRequester(
      {
        clubName: profile?.company_name || "Club",
        clubEmail: profile?.company_email || "",
        senderName: profile?.email_sender_name,
        senderEmail: profile?.email_sender_email,
        resendApiKey: profile?.resend_api_key,
        emailCustomEnabled: profile?.email_custom_enabled,
      },
      {
        firstName: reqData.first_name,
        email: reqData.email,
        date: reqData.reservation_date,
      },
      decision
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
