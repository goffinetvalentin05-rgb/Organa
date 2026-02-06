import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

export const runtime = "nodejs";

/* =========================
   POST : affecter un membre à un créneau
   ========================= */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le planning appartient à l'utilisateur
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id, name, date")
      .eq("id", planningId)
      .eq("user_id", user.id)
      .single();

    if (planningError || !planning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { slotId, clientId, sendNotification = true } = body || {};

    // Validation
    if (!slotId) {
      return NextResponse.json(
        { error: "L'ID du créneau est requis" },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "L'ID du membre est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le slot appartient au planning
    const { data: slot, error: slotError } = await supabase
      .from("planning_slots")
      .select("id, location, start_time, end_time, required_people")
      .eq("id", slotId)
      .eq("planning_id", planningId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: "Créneau non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le membre appartient à l'utilisateur
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, nom, email")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le créneau n'est pas déjà plein
    const { count: assignedCount } = await supabase
      .from("planning_assignments")
      .select("*", { count: "exact", head: true })
      .eq("slot_id", slotId);

    if ((assignedCount ?? 0) >= slot.required_people) {
      return NextResponse.json(
        { error: "Ce créneau est déjà complet" },
        { status: 400 }
      );
    }

    // Vérifier si le membre n'est pas déjà affecté à ce créneau
    const { data: existingAssignment } = await supabase
      .from("planning_assignments")
      .select("id")
      .eq("slot_id", slotId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Ce membre est déjà affecté à ce créneau" },
        { status: 400 }
      );
    }

    // Créer l'affectation
    const { data: assignment, error: assignmentError } = await supabase
      .from("planning_assignments")
      .insert({
        slot_id: slotId,
        client_id: clientId,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (assignmentError) {
      console.error("[API][assignments][POST] Erreur Supabase:", assignmentError);
      return NextResponse.json(
        { error: "Erreur lors de l'affectation", details: assignmentError.message },
        { status: 500 }
      );
    }

    // Envoyer la notification par email si demandé et si le membre a un email
    let notificationSent = false;
    if (sendNotification && client.email) {
      try {
        // Récupérer les paramètres email de l'utilisateur
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, company_email, email_sender_name, email_sender_email, resend_api_key")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.resend_api_key) {
          const resend = new Resend(profile.resend_api_key);
          
          // Formater la date
          const dateFormatted = new Date(planning.date).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #7C5CFF 0%, #8B5CF6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                  .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                  .assignment-box { background: white; border-left: 4px solid #7C5CFF; padding: 15px; margin: 20px 0; border-radius: 4px; }
                  .info-row { margin: 8px 0; }
                  .label { font-weight: bold; color: #666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>${profile.company_name || "Votre Club"}</h1>
                  </div>
                  <div class="content">
                    <p>Bonjour ${client.nom},</p>
                    <p>Vous avez été affecté(e) à un créneau de bénévolat :</p>
                    
                    <div class="assignment-box">
                      <div class="info-row">
                        <span class="label">Planning :</span> ${planning.name}
                      </div>
                      <div class="info-row">
                        <span class="label">Date :</span> ${dateFormatted}
                      </div>
                      <div class="info-row">
                        <span class="label">Poste :</span> ${slot.location}
                      </div>
                      <div class="info-row">
                        <span class="label">Horaires :</span> ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}
                      </div>
                    </div>
                    
                    <p>Merci pour votre participation !</p>
                    <p>Cordialement,<br>${profile.company_name || "L'équipe"}</p>
                  </div>
                </div>
              </body>
            </html>
          `;

          const fromEmail = profile.email_sender_name 
            ? `${profile.email_sender_name} <${profile.email_sender_email || profile.company_email}>`
            : profile.email_sender_email || profile.company_email;

          await resend.emails.send({
            from: fromEmail,
            to: [client.email],
            subject: `Affectation : ${planning.name} - ${slot.location}`,
            html: emailHtml,
          });

          // Mettre à jour la date de notification
          await supabase
            .from("planning_assignments")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", assignment.id);

          notificationSent = true;
        }
      } catch (emailError) {
        console.error("[API][assignments][POST] Erreur envoi email:", emailError);
        // On ne bloque pas l'affectation si l'email échoue
      }
    }

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        slotId: assignment.slot_id,
        clientId: assignment.client_id,
        member: client,
        notifiedAt: notificationSent ? new Date().toISOString() : null,
        createdAt: assignment.created_at,
      },
      notificationSent,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API][assignments][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'affectation", details: error.message },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE : retirer une affectation
   ========================= */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planningId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le planning appartient à l'utilisateur
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", user.id)
      .single();

    if (planningError || !planning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "L'ID de l'affectation est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'affectation existe et appartient à un slot de ce planning
    const { data: assignment, error: assignmentError } = await supabase
      .from("planning_assignments")
      .select(`
        id,
        slot_id,
        planning_slots!inner (
          planning_id
        )
      `)
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Affectation non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer l'affectation
    const { error } = await supabase
      .from("planning_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      console.error("[API][assignments][DELETE] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression", details: error.message },
        { status: 500 }
      );
    }

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][assignments][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}
