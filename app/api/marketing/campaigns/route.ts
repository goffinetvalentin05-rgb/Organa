import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";

export const runtime = "nodejs";

type SendTo = "all" | "source" | "manual";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { data: campaigns, error } = await supabase
      .from("marketing_campaigns")
      .select("id, name, subject, status, recipient_count, sent_at, created_at")
      .eq("club_id", guard.clubId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ campaigns: campaigns || [] }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const name = body?.name?.trim();
    const subject = body?.subject?.trim();
    const contentHtml = body?.contentHtml?.trim();
    const sendTo = (body?.sendTo || "all") as SendTo;
    const source = body?.source?.trim() || null;
    const contactIds: string[] = Array.isArray(body?.contactIds) ? body.contactIds : [];

    if (!name || !subject || !contentHtml) {
      return NextResponse.json({ error: "Nom, objet et contenu sont obligatoires" }, { status: 400 });
    }

    if (sendTo === "source" && !source) {
      return NextResponse.json({ error: "La source est obligatoire pour ce filtre" }, { status: 400 });
    }

    if (sendTo === "manual" && contactIds.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins un contact" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled")
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Erreur chargement paramètres email" }, { status: 500 });
    }

    const delivery = resolveResendFromProfile({
      company_name: profile?.company_name,
      company_email: profile?.company_email,
      email_sender_name: profile?.email_sender_name,
      email_sender_email: profile?.email_sender_email,
      resend_api_key: profile?.resend_api_key,
      email_custom_enabled: profile?.email_custom_enabled,
    });

    if (!delivery) {
      return NextResponse.json(
        {
          error:
            "L'envoi d'emails n'est pas disponible. Vérifiez la configuration du serveur ou le mode expéditeur avancé dans les paramètres.",
        },
        { status: 503 }
      );
    }

    let contactsQuery = supabase
      .from("marketing_contacts")
      .select("id, email")
      .eq("club_id", guard.clubId)
      .eq("unsubscribed", false);

    if (sendTo === "source" && source) {
      contactsQuery = contactsQuery.eq("source", source);
    }
    if (sendTo === "manual") {
      contactsQuery = contactsQuery.in("id", contactIds);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;
    if (contactsError) {
      return NextResponse.json({ error: contactsError.message }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire actif pour cette campagne" }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .insert({
        club_id: guard.clubId,
        name,
        subject,
        content_html: contentHtml,
        status: "sending",
      })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: campaignError?.message || "Erreur création campagne" }, { status: 500 });
    }

    const recipientPayload = contacts.map((contact) => ({
      campaign_id: campaign.id,
      club_id: guard.clubId,
      contact_id: contact.id,
      email: contact.email,
      status: "pending",
    }));

    const { data: recipients, error: recipientsError } = await supabase
      .from("marketing_campaign_recipients")
      .insert(recipientPayload)
      .select("id, email, unsubscribe_token");

    if (recipientsError || !recipients) {
      await supabase
        .from("marketing_campaigns")
        .update({ status: "failed", recipient_count: 0 })
        .eq("id", campaign.id)
        .eq("club_id", guard.clubId);

      return NextResponse.json(
        { error: recipientsError?.message || "Erreur préparation destinataires" },
        { status: 500 }
      );
    }

    const { resend, from } = delivery;

    const baseUrl = new URL(request.url).origin;
    let successCount = 0;

    for (const recipient of recipients) {
      const unsubscribeUrl = `${baseUrl}/desinscription/${recipient.unsubscribe_token}`;
      const footer = `
        <hr style="margin-top:24px;margin-bottom:12px;border:none;border-top:1px solid #e5e7eb;" />
        <p style="font-size:12px;color:#6b7280;">
          Vous recevez cet email car vous êtes inscrit(e) aux communications du club.<br/>
          <a href="${unsubscribeUrl}" style="color:#7C5CFF;text-decoration:underline;">Lien de désinscription</a>
        </p>
      `;
      const html = `${contentHtml}${footer}`;

      const { error: sendError } = await resend.emails.send({
        from,
        to: [recipient.email],
        subject,
        html,
      });

      if (sendError) {
        await supabase
          .from("marketing_campaign_recipients")
          .update({ status: "failed" })
          .eq("id", recipient.id);
        continue;
      }

      successCount += 1;
      await supabase
        .from("marketing_campaign_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", recipient.id);
    }

    const status = successCount > 0 ? "sent" : "failed";
    await supabase
      .from("marketing_campaigns")
      .update({
        status,
        sent_at: new Date().toISOString(),
        recipient_count: recipients.length,
      })
      .eq("id", campaign.id)
      .eq("club_id", guard.clubId);

    return NextResponse.json(
      {
        success: status === "sent",
        campaignId: campaign.id,
        recipientCount: recipients.length,
        sentCount: successCount,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

