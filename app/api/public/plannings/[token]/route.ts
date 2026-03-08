import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface PlanningAssignmentRow {
  id: string;
  slot_id: string;
  created_at: string;
  source: "internal_member" | "public_signup";
  public_name: string | null;
  public_email: string | null;
  public_phone: string | null;
  clients: {
    id: string;
    nom: string;
    email: string | null;
    telephone: string | null;
  } | null;
}

function mapAssignment(assignment: PlanningAssignmentRow) {
  const isPublic = assignment?.source === "public_signup";
  const client = assignment?.clients;

  return {
    id: assignment.id,
    source: assignment.source || "internal_member",
    createdAt: assignment.created_at,
    member: {
      id: client?.id || `public-${assignment.id}`,
      nom: isPublic ? assignment.public_name : client?.nom || "Membre",
      email: isPublic ? assignment.public_email : client?.email || undefined,
      telephone: isPublic ? assignment.public_phone : client?.telephone || undefined,
      status: isPublic ? "public" : "member",
    },
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: link } = await supabase
      .from("public_planning_links")
      .select("planning_id, club_id, active, require_name, require_email")
      .eq("token", token)
      .maybeSingle();

    if (!link || !link.active) {
      return NextResponse.json({ error: "Lien invalide ou inactif" }, { status: 404 });
    }

    const { data: planning } = await supabase
      .from("plannings")
      .select("id, name, date, description")
      .eq("id", link.planning_id)
      .maybeSingle();

    if (!planning) {
      return NextResponse.json({ error: "Planning introuvable" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("user_id", link.club_id)
      .maybeSingle();

    const { data: slots } = await supabase
      .from("planning_slots")
      .select("id, location, start_time, end_time, required_people, ordre")
      .eq("planning_id", planning.id)
      .order("ordre", { ascending: true });

    const slotIds = (slots || []).map((slot) => slot.id);
    let assignments: PlanningAssignmentRow[] = [];

    if (slotIds.length > 0) {
      const { data } = await supabase
        .from("planning_assignments")
        .select(`
          id,
          slot_id,
          created_at,
          source,
          public_name,
          public_email,
          public_phone,
          clients (
            id,
            nom,
            email,
            telephone
          )
        `)
        .in("slot_id", slotIds);
      assignments = data || [];
    }

    const slotsWithAssignments = (slots || []).map((slot) => {
      const slotAssignments = assignments
        .filter((assignment) => assignment.slot_id === slot.id)
        .map(mapAssignment);

      return {
        id: slot.id,
        location: slot.location,
        startTime: slot.start_time,
        endTime: slot.end_time,
        requiredPeople: slot.required_people,
        assignedCount: slotAssignments.length,
        isFull: slotAssignments.length >= slot.required_people,
        assignments: slotAssignments,
      };
    });

    const totalRequired = slotsWithAssignments.reduce(
      (sum, slot) => sum + slot.requiredPeople,
      0
    );
    const totalAssigned = slotsWithAssignments.reduce(
      (sum, slot) => sum + slot.assignedCount,
      0
    );

    return NextResponse.json(
      {
        planning: {
          id: planning.id,
          name: planning.name,
          date: planning.date,
          description: planning.description,
          clubName: profile?.company_name || "Club",
          slots: slotsWithAssignments,
          totalRequired,
          totalAssigned,
          isComplete: totalRequired > 0 && totalAssigned >= totalRequired,
          requireName: link.require_name,
          requireEmail: link.require_email,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: "Erreur lors du chargement du planning public", details },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();
    const body: { slotId?: string; name?: string; email?: string; phone?: string } =
      await request.json();
    const slotId = body?.slotId;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    const { data: link } = await supabase
      .from("public_planning_links")
      .select("planning_id, club_id, active, require_name, require_email")
      .eq("token", token)
      .maybeSingle();

    if (!link || !link.active) {
      return NextResponse.json({ error: "Lien invalide ou inactif" }, { status: 404 });
    }

    if (!slotId) {
      return NextResponse.json({ error: "Le créneau est requis" }, { status: 400 });
    }

    if (link.require_name && !name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    if (link.require_email && !email) {
      return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
    }

    const { data: slot } = await supabase
      .from("planning_slots")
      .select("id, planning_id, required_people")
      .eq("id", slotId)
      .eq("planning_id", link.planning_id)
      .maybeSingle();

    if (!slot) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
    }

    const { count: assignedCount } = await supabase
      .from("planning_assignments")
      .select("*", { count: "exact", head: true })
      .eq("slot_id", slot.id);

    if ((assignedCount || 0) >= slot.required_people) {
      return NextResponse.json({ error: "Ce créneau est déjà complet" }, { status: 400 });
    }

    const { data: assignment, error: insertError } = await supabase
      .from("planning_assignments")
      .insert({
        slot_id: slot.id,
        client_id: null,
        assigned_by: link.club_id,
        source: "public_signup",
        public_name: name || "Bénévole",
        public_email: email || null,
        public_phone: phone || null,
      })
      .select("id, created_at, source, public_name, public_email, public_phone")
      .single();

    if (insertError || !assignment) {
      return NextResponse.json(
        { error: "Impossible de finaliser l'inscription" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          source: assignment.source,
          createdAt: assignment.created_at,
          member: {
            id: `public-${assignment.id}`,
            nom: assignment.public_name,
            email: assignment.public_email || undefined,
            telephone: assignment.public_phone || undefined,
            status: "public",
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: "Erreur lors de l'inscription", details },
      { status: 500 }
    );
  }
}
