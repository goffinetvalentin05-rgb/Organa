import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendPendingConfirmationToRequester,
  sendRequestReceivedToClub,
} from "@/lib/buvette/email";
import { upsertMarketingContact } from "@/lib/marketing/contacts";
import { rateLimitGuard } from "@/lib/security/rateLimit";
import { logAudit, AuditAction, extractRequestMetadata } from "@/lib/auth/audit";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Erreur serveur");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const meta = extractRequestMetadata(request);
  // Anti-spam : 3 demandes max par IP toutes les 30 minutes
  const rl = rateLimitGuard(
    request,
    "buvette:requests",
    { limit: 3, windowMs: 30 * 60 * 1000 }
  );
  if (!rl.ok) return rl.response;

  try {
    const { slug } = await params;
    if (!slug || slug.length > 64 || !/^[a-z0-9-]+$/i.test(slug)) {
      return NextResponse.json({ error: "Slug invalide" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const body = await request.json();

    const date = body?.date;
    const firstName = body?.firstName?.trim();
    const lastName = body?.lastName?.trim();
    const email = body?.email?.trim()?.toLowerCase();
    const phone = body?.phone?.trim() || null;
    const eventType = body?.eventType?.trim();
    const message = body?.message?.trim() || null;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }
    if (!firstName || !lastName || !email || !eventType) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "user_id, company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled"
      )
      .eq("buvette_slug", slug)
      .maybeSingle();

    if (profileError || !profile?.user_id) {
      return NextResponse.json({ error: "Club introuvable" }, { status: 404 });
    }

    const { data: existingSlot } = await supabase
      .from("buvette_slots")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("slot_date", date)
      .maybeSingle();

    if (existingSlot) {
      return NextResponse.json({ error: "Cette date n'est plus disponible" }, { status: 400 });
    }

    const { data: existingPending } = await supabase
      .from("buvette_requests")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("reservation_date", date)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json({ error: "Une demande est déjà en cours sur cette date" }, { status: 400 });
    }

    const { data: created, error: createError } = await supabase
      .from("buvette_requests")
      .insert({
        user_id: profile.user_id,
        reservation_date: date,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        event_type: eventType,
        message,
        status: "pending",
      })
      .select("id")
      .single();

    if (createError || !created) {
      return NextResponse.json({ error: createError?.message || "Erreur création demande" }, { status: 500 });
    }

    await upsertMarketingContact({
      clubId: profile.user_id,
      firstName,
      lastName,
      email,
      phone,
      source: "buvette",
      sourceId: created.id,
    });

    await supabase.from("buvette_slots").insert({
      user_id: profile.user_id,
      slot_date: date,
      status: "pending",
      source: "external",
      reason: `Demande en attente (${firstName} ${lastName})`,
      request_id: created.id,
    });

    const origin = new URL(request.url).origin;
    const manageUrl = `${origin}/tableau-de-bord/buvette`;

    const emailConfig = {
      clubName: profile.company_name || "Club",
      clubEmail: profile.company_email || "",
      senderName: profile.email_sender_name,
      senderEmail: profile.email_sender_email,
      resendApiKey: profile.resend_api_key,
      emailCustomEnabled: profile.email_custom_enabled,
    };

    await sendRequestReceivedToClub(
      emailConfig,
      { date, firstName, lastName, email, phone, eventType, message },
      manageUrl
    );
    await sendPendingConfirmationToRequester(emailConfig, {
      date,
      firstName,
      lastName,
      email,
      phone,
      eventType,
      message,
    });

    await logAudit({
      clubId: profile.user_id,
      actorId: null,
      actorEmail: email,
      action: AuditAction.CREATE,
      resourceType: "buvette_requests",
      resourceId: created.id,
      outcome: "success",
      metadata: { source: "public_form", slug, date, eventType },
      ...meta,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API][buvette][public-request] Erreur:", error);
    // Pas de fuite de message d'erreur SQL au public
    return NextResponse.json(
      { error: "Impossible de traiter la demande", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
