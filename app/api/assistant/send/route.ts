import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, content, language, relatedType, relatedId, clientId } = body || {};

    if (!to || !subject || !content) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "company_name, company_email, company_phone, company_address, email_sender_name, email_sender_email, resend_api_key"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[Assistant][send] Erreur profil:", profileError);
      return NextResponse.json({ error: "Erreur lors du chargement du profil" }, { status: 500 });
    }

    const resendApiKey = profile?.resend_api_key || "";
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Clé API Resend non configurée. Veuillez la configurer dans les paramètres." },
        { status: 400 }
      );
    }

    const resend = new Resend(resendApiKey);
    const sender = profile?.email_sender_name
      ? `${profile?.email_sender_name} <${profile?.email_sender_email || profile?.company_email}>`
      : profile?.email_sender_email || profile?.company_email;

    const htmlContent = content
      .split("\n")
      .map((line: string) => `<p style="margin:0 0 12px;">${line}</p>`)
      .join("");

    const { data, error } = await resend.emails.send({
      from: sender,
      to: [to],
      subject,
      html: `<div style="font-family:Arial, sans-serif; line-height:1.6; color:#1f2937;">${htmlContent}</div>`,
      text: content,
    });

    if (error) {
      console.error("[Assistant][send] Resend error:", error);
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("email_history").insert({
      user_id: user.id,
      to_email: to,
      subject,
      content,
      language: language || "fr",
      related_type: relatedType || "dashboard",
      related_id: relatedId || null,
      client_id: clientId || null,
    });

    if (insertError) {
      console.error("[Assistant][send] Insert history error:", insertError);
    }

    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (error: any) {
    console.error("[Assistant][send] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error?.message || "Erreur inconnue" },
      { status: 500 }
    );
  }
}

