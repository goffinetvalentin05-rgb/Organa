import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicPlanningConfirmationPayload } from "@/lib/planning/publicPlanningConfirmationPayload";
import { isPublicPlanningSlug } from "@/lib/planning/publicPlanningSlug";

export const runtime = "nodejs";

/**
 * Récapitulatif d’une inscription publique, pour la page `/p/[token]/confirmation`.
 * Vérifie que le token du lien correspond bien au planning du créneau et que
 * l’affectation provient du flux public.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: identifier } = await params;
    const assignmentId = request.nextUrl.searchParams.get("assignmentId");

    const slugOk = identifier ? isPublicPlanningSlug(identifier) : false;
    const tokenOk =
      identifier &&
      identifier.length >= 16 &&
      identifier.length <= 128 &&
      /^[A-Za-z0-9_-]+$/.test(identifier);

    if (!identifier || (!slugOk && !tokenOk)) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }
    if (!assignmentId || !/^[0-9a-f-]{36}$/i.test(assignmentId)) {
      return NextResponse.json({ error: "Inscription invalide" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: link } = await supabase
      .from("public_planning_links")
      .select("planning_id, club_id, active, slug")
      .eq(slugOk ? "slug" : "token", identifier)
      .maybeSingle();

    if (!link || !link.active) {
      return NextResponse.json({ error: "Lien invalide ou inactif" }, { status: 404 });
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("planning_assignments")
      .select("id, source, public_name, slot_id")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 });
    }

    if (assignment.source !== "public_signup") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: slot } = await supabase
      .from("planning_slots")
      .select("id, planning_id, location, slot_date, start_time, end_time")
      .eq("id", assignment.slot_id)
      .maybeSingle();

    if (!slot || slot.planning_id !== link.planning_id) {
      return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 });
    }

    const { data: planningRow } = await supabase
      .from("plannings")
      .select("name, date, description")
      .eq("id", link.planning_id)
      .maybeSingle();

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("user_id", link.club_id)
      .maybeSingle();

    const participantName = (assignment.public_name || "").trim() || "Participant";
    const sd = (slot as { slot_date?: string | null }).slot_date;
    const slotDateRaw = sd != null && String(sd).trim() !== "" ? String(sd).trim() : "";
    const slotDateLabel = slotDateRaw
      ? new Date(`${slotDateRaw}T12:00:00`).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

    const confirmation: PublicPlanningConfirmationPayload = {
      assignmentId: assignment.id,
      planningId: link.planning_id,
      eventName: planningRow?.name || "Événement",
      slotLocation: slot.location || "Poste / créneau",
      slotDate: slotDateRaw,
      slotDateLabel,
      startTime: (slot.start_time || "").slice(0, 5),
      endTime: (slot.end_time || "").slice(0, 5),
      participantName,
      clubName: profileRow?.company_name || "Club",
      planningDescription: planningRow?.description || undefined,
    };

    return NextResponse.json({ confirmation, canonicalSlug: link.slug }, { status: 200 });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : undefined;
    console.error("[API][public-plannings][confirmation][GET]", details);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la confirmation" },
      { status: 500 }
    );
  }
}
