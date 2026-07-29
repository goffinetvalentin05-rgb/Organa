import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isMissingSlotDateColumnError } from "@/lib/planning/slotDateFallback";
import { getSlotTimeRangeError } from "@/lib/planning/slotTimeRange";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { withIdempotency } from "@/lib/api/idempotency";

export const runtime = "nodejs";

/* =========================
   GET : liste des plannings avec slots et affectations
   ========================= */
export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    // Récupérer les plannings avec les événements liés
    const { data: plannings, error } = await supabase
      .from("plannings")
      .select(`
        id,
        name,
        description,
        date,
        status,
        created_at,
        updated_at,
        created_by,
        updated_by,
        event_id,
        events (
          id,
          name
        )
      `)
      .eq("user_id", guard.clubId)
      .order("date", { ascending: false });

    if (error) {
      console.error("[API][plannings][GET] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors du chargement des plannings", details: error.message },
        { status: 500 }
      );
    }

    // Pour chaque planning, récupérer les stats des slots et affectations
    const planningIds = (plannings || []).map((p: { id: string }) => p.id);
    
    let slotsStats: Array<{ id: string; planning_id: string; required_people: number }> = [];
    let assignmentsStats: Array<{ slot_id: string }> = [];

    if (planningIds.length > 0) {
      // Récupérer les slots
      const { data: slots } = await supabase
        .from("planning_slots")
        .select("id, planning_id, required_people")
        .in("planning_id", planningIds);

      slotsStats = slots || [];

      // Récupérer les affectations
      const slotIds = slotsStats.map((s) => s.id);
      if (slotIds.length > 0) {
        const { data: assignments } = await supabase
          .from("planning_assignments")
          .select("slot_id")
          .in("slot_id", slotIds);
        
        assignmentsStats = assignments || [];
      }
    }

    // Calculer les stats par planning
    const planningsWithStats = (plannings || []).map((planning: { id: string; events: unknown }) => {
      const planningSlots = slotsStats.filter((s) => s.planning_id === planning.id);
      const totalRequired = planningSlots.reduce(
        (sum: number, s) => sum + (s.required_people || 0),
        0
      );
      const slotIds = planningSlots.map((s) => s.id);
      const totalAssigned = assignmentsStats.filter((a) => slotIds.includes(a.slot_id)).length;

      return {
        ...planning,
        event: planning.events,
        slotsCount: planningSlots.length,
        totalRequired,
        totalAssigned,
        fillRate: totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0,
      };
    });

    return NextResponse.json({ plannings: planningsWithStats }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[API][plannings][GET] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement", details: message },
      { status: 500 }
    );
  }
}

/* =========================
   POST : créer un planning
   ========================= */
export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const user = guard.ctx.user;

    // Vérifier l'accès en écriture (trial actif ou abonnement)
    const accessCheck = await requireWriteAccess();
    if (accessCheck.response) {
      return accessCheck.response;
    }

    const body = await request.json();
    const { name, description, date, status, eventId, slots } = body || {};

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du planning est requis" },
        { status: 400 }
      );
    }

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        { error: "La date est requise" },
        { status: 400 }
      );
    }

    const payload = {
      user_id: guard.clubId,
      name: name.trim(),
      description: description?.trim() || null,
      date: date,
      status: status || "draft",
      event_id: eventId || null,
      created_by: user.id,
      updated_by: user.id,
    };

    const idempotencyResult = await withIdempotency<Record<string, unknown>>({
      request,
      clubId: guard.clubId,
      idempotencyKey: request.headers.get("Idempotency-Key"),
      resourceType: "planning",
      operation: async () => {
        const { data: newPlanning, error } = await supabase
          .from("plannings")
          .insert(payload)
          .select(`
            id,
            name,
            description,
            date,
            status,
            created_at,
            updated_at,
            created_by,
            updated_by,
            event_id,
            events (
              id,
              name
            )
          `)
          .single();

        if (error) {
          console.error("[API][plannings][POST] Erreur Supabase:", error);
          return {
            status: 500,
            body: {
              error: "Erreur lors de la création du planning",
              details: error.message,
            },
            resourceId: null,
          };
        }

        // Créer les slots si fournis
        if (slots && Array.isArray(slots) && slots.length > 0) {
          for (const slot of slots) {
            const timeError = getSlotTimeRangeError(slot.startTime, slot.endTime);
            if (timeError) {
              return { status: 400, body: { error: timeError }, resourceId: null };
            }
          }

          const slotsPayload = slots.map(
            (slot: {
              location?: string;
              slotDate?: string;
              startTime: string;
              endTime: string;
              requiredPeople?: number;
              notes?: string | null;
            }, index: number) => ({
            planning_id: newPlanning.id,
            location: slot.location || "Poste",
            slot_date: slot.slotDate || date,
            start_time: slot.startTime,
            end_time: slot.endTime,
            required_people: slot.requiredPeople || 1,
            notes: slot.notes || null,
            ordre: index,
          })
          );

          let { error: slotsError } = await supabase
            .from("planning_slots")
            .insert(slotsPayload);

          if (slotsError && isMissingSlotDateColumnError(slotsError)) {
            const legacyPayload = slots.map(
              (slot: {
                location?: string;
                startTime: string;
                endTime: string;
                requiredPeople?: number;
                notes?: string | null;
              }, index: number) => ({
              planning_id: newPlanning.id,
              location: slot.location || "Poste",
              start_time: slot.startTime,
              end_time: slot.endTime,
              required_people: slot.requiredPeople || 1,
              notes: slot.notes || null,
              ordre: index,
            }))
            ;
            const retry = await supabase.from("planning_slots").insert(legacyPayload);
            slotsError = retry.error;
          }

          if (slotsError) {
            console.error("[API][plannings][POST] Erreur création slots:", slotsError);
          }
        }

        revalidatePath("/tableau-de-bord");
        revalidatePath("/tableau-de-bord/plannings");

        return {
          status: 201,
          body: {
            planning: {
              ...newPlanning,
              event: newPlanning.events,
              slotsCount: slots?.length || 0,
              totalRequired:
                slots?.reduce(
                  (sum: number, s: { requiredPeople?: number }) =>
                    sum + (s.requiredPeople || 1),
                  0
                ) ||
                0,
              totalAssigned: 0,
              fillRate: 0,
            },
          },
          resourceId: String(newPlanning.id),
        };
      },
    });

    return NextResponse.json(idempotencyResult.body, {
      status: idempotencyResult.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[API][plannings][POST] Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création", details: message },
      { status: 500 }
    );
  }
}
