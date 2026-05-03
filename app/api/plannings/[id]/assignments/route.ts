import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  ensureMemberParticipationForPlanning,
  refreshMemberParticipationAfterAssignmentsChange,
} from "@/lib/planning/memberParticipations";

export const runtime = "nodejs";

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "membre";
  const trimmed = fullName.trim();
  if (!trimmed) return "membre";
  return trimmed.split(/\s+/)[0] || "membre";
}

/* =========================
   POST : affecter un membre à un créneau
   ========================= */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId } = await params;
    const supabase = await createClient();

    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id, name, date")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
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
    // Compatibilité schéma: certains environnements utilisent `name`, d'autres `nom`.
    let memberRecord: { id: string; displayName: string; email: string | null } | null = null;
    const { data: memberByName, error: memberByNameError } = await supabase
      .from("clients")
      .select("id, name, email")
      .eq("id", clientId)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (memberByName && !memberByNameError) {
      memberRecord = {
        id: memberByName.id,
        displayName: memberByName.name || "Membre",
        email: memberByName.email || null,
      };
    } else {
      const { data: memberByNom, error: memberByNomError } = await supabase
        .from("clients")
        .select("id, nom, email")
        .eq("id", clientId)
        .eq("user_id", guard.clubId)
        .maybeSingle();

      if (memberByNom && !memberByNomError) {
        memberRecord = {
          id: memberByNom.id,
          displayName: memberByNom.nom || "Membre",
          email: memberByNom.email || null,
        };
      } else {
        console.error("[API][assignments][POST] Membre introuvable:", {
          clientId,
          userId: guard.userId,
          memberByNameError: memberByNameError?.message || null,
          memberByNomError: memberByNomError?.message || null,
        });
        return NextResponse.json(
          { error: "Membre non trouvé" },
          { status: 404 }
        );
      }
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
        assigned_by: guard.userId,
        source: "internal_member",
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

    await ensureMemberParticipationForPlanning(supabase, {
      memberId: clientId,
      planningId,
      createdBy: guard.userId,
    });

    // Envoyer la notification par email si demandé et si le membre a un email
    let notificationSent = false;
    if (sendNotification) {
      try {
        // Récupérer les paramètres email de l'utilisateur
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled")
          .eq("user_id", guard.clubId)
          .maybeSingle();

        if (!memberRecord?.email) {
          console.error("[API][assignments][POST] Notification ignorée: email membre manquant", {
            clientId,
            assignmentId: assignment.id,
          });
        } else {
          const delivery = resolveResendFromProfile({
            company_name: profile?.company_name,
            company_email: profile?.company_email,
            email_sender_name: profile?.email_sender_name,
            email_sender_email: profile?.email_sender_email,
            resend_api_key: profile?.resend_api_key,
            email_custom_enabled: profile?.email_custom_enabled,
          });
          if (!delivery) {
            console.error("[API][assignments][POST] Envoi email impossible (Resend non configuré)", {
              userId: guard.userId,
              assignmentId: assignment.id,
            });
          } else {
            const resendInstance = delivery.resend;
            const fromAddress = delivery.from;
            const firstName = getFirstName(memberRecord.displayName);
            const dateFormatted = new Date(planning.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const startTime = slot.start_time.slice(0, 5);
            const endTime = slot.end_time.slice(0, 5);

            const emailText = `Bonjour ${firstName},

Tu as été affecté(e) au planning suivant :

📅 Événement : ${planning.name}
📍 Créneau : ${slot.location}
🕐 Horaires : ${startTime} - ${endTime}
📆 Date : ${dateFormatted}

Merci pour ta disponibilité !
À bientôt !`;

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <p>Bonjour ${firstName},</p>
                <p>Tu as été affecté(e) au planning suivant :</p>
                <p>
                  📅 <strong>Événement :</strong> ${planning.name}<br/>
                  📍 <strong>Créneau :</strong> ${slot.location}<br/>
                  🕐 <strong>Horaires :</strong> ${startTime} - ${endTime}<br/>
                  📆 <strong>Date :</strong> ${dateFormatted}
                </p>
                <p>Merci pour ta disponibilité !<br/>À bientôt !</p>
              </div>
            `;

            const sendResult = await resendInstance.emails.send({
              from: fromAddress,
              to: [memberRecord.email],
              subject: `Affectation : ${planning.name} - ${slot.location}`,
              html: emailHtml,
              text: emailText,
            });

            const sendError =
              sendResult && typeof sendResult === "object" && "error" in sendResult
                ? (sendResult as { error?: { message?: string } }).error
                : undefined;

            if (sendError) {
              console.error("[API][assignments][POST] Erreur Resend:", {
                assignmentId: assignment.id,
                clientId,
                to: memberRecord.email,
                mode: delivery.mode,
                message: sendError.message,
              });
            } else {
              await supabase
                .from("planning_assignments")
                .update({ notified_at: new Date().toISOString() })
                .eq("id", assignment.id);

              notificationSent = true;
            }
          }
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
        member: {
          id: memberRecord.id,
          nom: memberRecord.displayName,
          email: memberRecord.email || undefined,
        },
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
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const { id: planningId } = await params;
    const supabase = await createClient();

    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", planningId)
      .eq("user_id", guard.clubId)
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
        client_id,
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

    const slotRow = assignment.planning_slots as { planning_id?: string } | { planning_id?: string }[];
    const planningIdFromSlot = Array.isArray(slotRow)
      ? slotRow[0]?.planning_id
      : slotRow?.planning_id;
    if (planningIdFromSlot !== planningId) {
      return NextResponse.json({ error: "Affectation non trouvée" }, { status: 404 });
    }

    const removedClientId = assignment.client_id as string | null;

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

    await refreshMemberParticipationAfterAssignmentsChange(supabase, {
      memberId: removedClientId,
      planningId,
    });

    revalidatePath(`/tableau-de-bord/plannings/${planningId}`);
    if (removedClientId) {
      revalidatePath(`/tableau-de-bord/clients/${removedClientId}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API][assignments][DELETE] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    );
  }
}
