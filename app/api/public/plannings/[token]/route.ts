import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveResendFromProfile } from "@/lib/email/resend-delivery";
import { rateLimitGuard } from "@/lib/security/rateLimit";
import { logAudit, AuditAction, extractRequestMetadata } from "@/lib/auth/audit";

export const runtime = "nodejs";

interface PlanningAssignmentRow {
  id: string;
  slot_id: string;
  client_id?: string | null;
  member_id?: string | null;
  created_at: string;
  source: "internal_member" | "member" | "public_signup";
  public_name: string | null;
  name?: string | null;
  public_email: string | null;
  email?: string | null;
  public_phone: string | null;
  phone?: string | null;
  clients?:
    | {
        id: string;
        nom?: string | null;
        name?: string | null;
        email?: string | null;
        telephone?: string | null;
        phone?: string | null;
      }
    | {
        id: string;
        nom?: string | null;
        name?: string | null;
        email?: string | null;
        telephone?: string | null;
        phone?: string | null;
      }[]
    | null;
}

interface ClientRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  nom?: string | null;
  name?: string | null;
  email?: string | null;
  telephone?: string | null;
  phone?: string | null;
}

interface MemberRow {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  nom?: string | null;
  name?: string | null;
  email?: string | null;
  telephone?: string | null;
  phone?: string | null;
}

/** Ligne planning_slots : slot_date peut être absent si migration non appliquée. */
interface PublicPlanningSlotRow {
  id: string;
  location: string | null;
  slot_date?: string | null;
  start_time: string;
  end_time: string;
  required_people: number;
  ordre: number;
}

function getClientFullName(client: ClientRow | null | undefined) {
  if (!client) return "";
  const firstName = client.first_name?.trim() || "";
  const lastName = client.last_name?.trim() || "";
  const joined = `${firstName} ${lastName}`.trim();
  if (joined) return joined;
  return (client.nom || client.name || "").trim();
}

function getPersonFullName(person: {
  first_name?: string | null;
  last_name?: string | null;
  nom?: string | null;
  name?: string | null;
} | null | undefined) {
  if (!person) return "";
  const firstName = person.first_name?.trim() || "";
  const lastName = person.last_name?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  return (person.nom || person.name || "").trim();
}

function getPublicVolunteerName(assignment: PlanningAssignmentRow) {
  return (assignment.public_name || assignment.name || "").trim();
}

async function loadClientsMap(
  supabase: ReturnType<typeof createAdminClient>,
  clientIds: string[]
) {
  const map = new Map<string, ClientRow>();
  if (clientIds.length === 0) return map;

  const baseIds = Array.from(new Set(clientIds));
  const attempts = [
    "id, first_name, last_name, nom, email, telephone",
    "id, first_name, last_name, name, email, phone",
    "id, nom, email, telephone",
    "id, name, email, phone",
  ];

  for (const selectClause of attempts) {
    const { data, error } = await supabase
      .from("clients")
      .select(selectClause)
      .in("id", baseIds);

    if (error || !data) continue;

    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const candidate = row as Partial<ClientRow>;
      if (!candidate.id || typeof candidate.id !== "string") continue;
      const previous = map.get(candidate.id) || ({ id: candidate.id } as ClientRow);
      map.set(candidate.id, {
        ...previous,
        ...candidate,
      });
    }
  }

  return map;
}

async function loadMembersMap(
  supabase: ReturnType<typeof createAdminClient>,
  memberIds: string[]
) {
  const map = new Map<string, MemberRow>();
  if (memberIds.length === 0) return map;

  const uniqueIds = Array.from(new Set(memberIds));
  const attempts = [
    "id, first_name, last_name, email, phone",
    "id, first_name, last_name, email, telephone",
    "id, nom, email, telephone",
    "id, name, email, phone",
  ];

  for (const selectClause of attempts) {
    const { data, error } = await supabase
      .from("members")
      .select(selectClause)
      .in("id", uniqueIds);

    if (error || !data) continue;

    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const candidate = row as Partial<MemberRow>;
      if (!candidate.id || typeof candidate.id !== "string") continue;
      const previous = map.get(candidate.id) || ({ id: candidate.id } as MemberRow);
      map.set(candidate.id, {
        ...previous,
        ...candidate,
      });
    }
  }

  return map;
}

function mapAssignment(assignment: PlanningAssignmentRow, displayName: string) {
  const isPublic = assignment?.source === "public_signup";
  return {
    id: assignment.id,
    source: assignment.source || "member",
    createdAt: assignment.created_at,
    member: {
      id: assignment.member_id || assignment.client_id || `public-${assignment.id}`,
      nom: displayName,
      email: isPublic ? assignment.public_email || assignment.email || undefined : undefined,
      telephone: isPublic ? assignment.public_phone || assignment.phone || undefined : undefined,
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
    if (!token || token.length < 16 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }
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

    const { data: slots, error: slotsError } = await supabase
      .from("planning_slots")
      .select("id, location, slot_date, start_time, end_time, required_people, ordre")
      .eq("planning_id", planning.id)
      .order("slot_date", { ascending: true })
      .order("ordre", { ascending: true });

    let slotsRows: PublicPlanningSlotRow[];
    if (!slotsError && Array.isArray(slots)) {
      slotsRows = slots as PublicPlanningSlotRow[];
    } else {
      const { data: legacySlots, error: legacyError } = await supabase
        .from("planning_slots")
        .select("id, location, start_time, end_time, required_people, ordre")
        .eq("planning_id", planning.id)
        .order("ordre", { ascending: true });
      slotsRows =
        !legacyError && legacySlots ? (legacySlots as PublicPlanningSlotRow[]) : [];
    }

    const slotIds = slotsRows.map((slot) => slot.id);
    let assignments: PlanningAssignmentRow[] = [];

    if (slotIds.length > 0) {
      const { data } = await supabase
        .from("planning_assignments")
        .select(`
          *,
          clients (
            id,
            nom,
            email,
            telephone
          )
        `)
        .in("slot_id", slotIds);
      assignments = (data || []) as PlanningAssignmentRow[];
    }

    const clientIds = assignments
      .map((assignment) => assignment.client_id)
      .filter((id): id is string => Boolean(id));
    const memberIds = assignments
      .map((assignment) => assignment.member_id)
      .filter((id): id is string => Boolean(id));
    const clientsMap = await loadClientsMap(supabase, clientIds);
    const membersMap = await loadMembersMap(supabase, memberIds);

    const slotsWithAssignments = (slotsRows || []).map((slot) => {
      const slotAssignments = assignments
        .filter((assignment) => assignment.slot_id === slot.id)
        .map((assignment) => {
          if (assignment.member_id) {
            const member = membersMap.get(assignment.member_id);
            const memberAsClient = clientsMap.get(assignment.member_id);
            const displayName =
              getPersonFullName(member) || getClientFullName(memberAsClient);
            const mapped = mapAssignment(
              assignment,
              displayName || getPublicVolunteerName(assignment)
            );
            if (member) {
              mapped.member.email = member.email || undefined;
              mapped.member.telephone = member.telephone || member.phone || undefined;
            } else if (memberAsClient) {
              mapped.member.email = memberAsClient.email || undefined;
              mapped.member.telephone =
                memberAsClient.telephone || memberAsClient.phone || undefined;
            }
            return mapped;
          }

          const relationClient = Array.isArray(assignment.clients)
            ? assignment.clients[0] || null
            : assignment.clients || null;
          const client = assignment.client_id
            ? clientsMap.get(assignment.client_id)
            : null;
          const fullName =
            getClientFullName(client) ||
            getClientFullName(relationClient || undefined) ||
            getPublicVolunteerName(assignment);
          const mapped = mapAssignment(assignment, fullName);
          if (client) {
            mapped.member.email = client.email || mapped.member.email;
            mapped.member.telephone = client.telephone || client.phone || mapped.member.telephone;
          } else if (relationClient) {
            mapped.member.email = relationClient.email || mapped.member.email;
            mapped.member.telephone =
              relationClient.telephone || relationClient.phone || mapped.member.telephone;
          }
          return mapped;
        });

      return {
        id: slot.id,
        location: slot.location,
        slotDate: slot.slot_date ?? planning.date,
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
  const meta = extractRequestMetadata(request);
  // Anti-spam : 10 inscriptions max par IP toutes les 15 minutes
  const rl = rateLimitGuard(
    request,
    "plannings:public-signup",
    { limit: 10, windowMs: 15 * 60 * 1000 }
  );
  if (!rl.ok) return rl.response;

  try {
    const { token } = await params;
    if (!token || token.length < 16 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const body: { slotId?: string; name?: string; email?: string; phone?: string } =
      await request.json();
    const slotId = body?.slotId;
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
    const email = typeof body?.email === "string" ? body.email.trim().slice(0, 255) : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 50) : "";

    if (slotId && !/^[0-9a-f-]{36}$/i.test(slotId)) {
      return NextResponse.json({ error: "Slot invalide" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

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
      .select("id, planning_id, location, slot_date, start_time, end_time, required_people")
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

    if (email) {
      try {
        const { data: planning } = await supabase
          .from("plannings")
          .select("name, date")
          .eq("id", link.planning_id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, company_email, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled")
          .eq("user_id", link.club_id)
          .maybeSingle();

        const delivery = resolveResendFromProfile({
          company_name: profile?.company_name,
          company_email: profile?.company_email,
          email_sender_name: profile?.email_sender_name,
          email_sender_email: profile?.email_sender_email,
          resend_api_key: profile?.resend_api_key,
          email_custom_enabled: profile?.email_custom_enabled,
        });
        if (delivery) {
          const resend = delivery.resend;
          const subject = "Confirmation - inscription benevole";
          const clubName = profile?.company_name || "Club";
          const eventName = planning?.name || "Evenement";
          const slotName = slot.location || "Poste";
          const startTime = (slot.start_time || "").slice(0, 5);
          const endTime = (slot.end_time || "").slice(0, 5);
          const volunteerName = name || "benevole";
          const slotDateRaw = (slot as { slot_date?: string }).slot_date || planning?.date;
          const slotDateLabel = slotDateRaw
            ? new Date(`${slotDateRaw}T12:00:00`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "";

          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
              <p>Bonjour ${volunteerName},</p>
              <p>Votre inscription est confirmee pour l'evenement suivant :</p>
              <p>
                <strong>Evenement :</strong> ${eventName}<br/>
                <strong>Poste :</strong> ${slotName}<br/>
                ${slotDateLabel ? `<strong>Date :</strong> ${slotDateLabel}<br/>` : ""}
                <strong>Horaire :</strong> ${startTime} - ${endTime}
              </p>
              <p>Merci pour votre aide !</p>
              <p>${clubName}</p>
              <p style="font-size: 12px; color: #6b7280;">Si vous avez une question, contactez le club.</p>
            </div>
          `;

          const text = `Bonjour ${volunteerName},

Votre inscription est confirmee pour l'evenement suivant :

Evenement : ${eventName}
Poste : ${slotName}
${slotDateLabel ? `Date : ${slotDateLabel}\n` : ""}Horaire : ${startTime} - ${endTime}

Merci pour votre aide !

${clubName}

Si vous avez une question, contactez le club.`;

          await resend.emails.send({
            from: delivery.from,
            to: [email],
            subject,
            html,
            text,
          });
        }
      } catch (emailError) {
        console.error("[API][public-plannings][POST] Erreur envoi email confirmation:", emailError);
      }
    }

    await logAudit({
      clubId: link.club_id,
      actorId: null,
      actorEmail: email || null,
      action: AuditAction.CREATE,
      resourceType: "planning_assignments",
      resourceId: assignment.id,
      outcome: "success",
      metadata: { source: "public_signup", token, slot_id: slotId },
      ...meta,
    });

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
    console.error("[API][public-plannings][POST] Erreur:", details);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
