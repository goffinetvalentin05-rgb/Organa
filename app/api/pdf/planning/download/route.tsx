import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { PlanningPdf } from "@/lib/pdf/PlanningPdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du planning manquant" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer le planning
    const { data: planning, error: planningError } = await supabase
      .from("plannings")
      .select(`
        id,
        name,
        description,
        date,
        status,
        event_id,
        events (
          id,
          name
        )
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (planningError || !planning) {
      console.error("[PDF][planning] Planning non trouvé:", planningError);
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les slots
    const { data: slots } = await supabase
      .from("planning_slots")
      .select(`
        id,
        location,
        start_time,
        end_time,
        required_people,
        notes,
        ordre
      `)
      .eq("planning_id", id)
      .order("ordre", { ascending: true });

    // Récupérer les affectations avec les infos membres
    const slotIds = (slots || []).map((s: any) => s.id);
    let assignments: any[] = [];

    if (slotIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from("planning_assignments")
        .select(`
          id,
          slot_id,
          client_id,
          clients (
            id,
            nom,
            email
          )
        `)
        .in("slot_id", slotIds);

      assignments = assignmentsData || [];
    }

    // Récupérer les infos du club (profil)
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, company_address, company_email, company_phone, logo_url")
      .eq("user_id", user.id)
      .maybeSingle();

    // Structurer les données pour le PDF
    const slotsWithAssignments = (slots || []).map((slot: any) => {
      const slotAssignments = assignments
        .filter((a: any) => a.slot_id === slot.id)
        .map((a: any) => ({
          id: a.id,
          member: {
            id: a.clients?.id || a.client_id,
            nom: a.clients?.nom || "Membre",
            email: a.clients?.email,
          },
        }));

      return {
        id: slot.id,
        location: slot.location,
        startTime: slot.start_time,
        endTime: slot.end_time,
        requiredPeople: slot.required_people,
        notes: slot.notes,
        assignments: slotAssignments,
      };
    });

    const totalRequired = slotsWithAssignments.reduce((sum: number, s: any) => sum + s.requiredPeople, 0);
    const totalAssigned = slotsWithAssignments.reduce((sum: number, s: any) => sum + s.assignments.length, 0);

    const pdfData = {
      club: {
        name: profile?.company_name || "Club",
        address: profile?.company_address,
        email: profile?.company_email,
        phone: profile?.company_phone,
        logoUrl: profile?.logo_url,
      },
      planning: {
        name: planning.name,
        date: planning.date,
        description: planning.description,
        eventName: (planning.events as any)?.name,
      },
      slots: slotsWithAssignments,
      summary: {
        totalSlots: slotsWithAssignments.length,
        totalRequired,
        totalAssigned,
        fillRate: totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0,
      },
    };

    // Générer le PDF avec @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      <PlanningPdf
        club={pdfData.club}
        planning={pdfData.planning}
        slots={pdfData.slots}
        summary={pdfData.summary}
      />
    );

    // Nom du fichier
    const dateFormatted = new Date(planning.date).toISOString().split("T")[0];
    const filename = `planning-${planning.name.replace(/[^a-zA-Z0-9]/g, "-")}-${dateFormatted}.pdf`;

    // Retourner le PDF pour téléchargement
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du PDF planning:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
