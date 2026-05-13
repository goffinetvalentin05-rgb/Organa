import fs from "fs";

const p = new URL("./app/api/plannings/[id]/route.ts", import.meta.url);
let text = fs.readFileSync(p, "utf8");

const oldImport = `import { syncMemberParticipationsWithPlanning } from "@/lib/planning/memberParticipations";

export const runtime = "nodejs";`;

const newImport = `import { syncMemberParticipationsWithPlanning } from "@/lib/planning/memberParticipations";
import { isValidIsoDateOnly, calendarDayDeltaIso } from "@/lib/planning/isoCalendarDate";
import { shiftAllPlanningSlotDatesByDelta } from "@/lib/planning/shiftPlanningSlotDates";

export const runtime = "nodejs";`;

if (!text.includes(oldImport)) throw new Error("import anchor missing");
text = text.replace(oldImport, newImport);

const oldPut = `    const body = await request.json();
    const { name, description, date, status, eventId } = body || {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Le titre du planning est obligatoire et ne peut pas être vide" },
          { status: 400 }
        );
      }
    }

    // Vérifier que le planning appartient au club
    const { data: existingPlanning, error: fetchError } = await supabase
      .from("plannings")
      .select("id")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (fetchError || !existingPlanning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const updatePayload: any = { updated_by: user.id };
    if (name !== undefined) updatePayload.name = String(name).trim();
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (date !== undefined) updatePayload.date = date;
    if (status !== undefined) updatePayload.status = status;
    if (eventId !== undefined) updatePayload.event_id = eventId || null;

    const { data: updatedPlanning, error } = await supabase
      .from("plannings")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .select(\`
        id,
        name,
        description,
        date,
        status,
        created_at,
        updated_at,
        event_id,
        events (
          id,
          name
        )
      \`)
      .single();

    if (error) {
      console.error("[API][plannings][PUT] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: error.message },
        { status: 500 }
      );
    }

    await syncMemberParticipationsWithPlanning(supabase,`;

const newPut = `    const body = await request.json();
    const { name, description, date, status, eventId } = body || {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Le titre du planning est obligatoire et ne peut pas être vide" },
          { status: 400 }
        );
      }
    }

    if (date !== undefined) {
      if (typeof date !== "string" || !isValidIsoDateOnly(date)) {
        return NextResponse.json(
          {
            error:
              "La date du planning est obligatoire et doit être au format AAAA-MM-JJ (ex. 2026-05-21)",
          },
          { status: 400 }
        );
      }
    }

    // Vérifier que le planning appartient au club
    const { data: existingPlanning, error: fetchError } = await supabase
      .from("plannings")
      .select("id, date")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .single();

    if (fetchError || !existingPlanning) {
      return NextResponse.json(
        { error: "Planning non trouvé" },
        { status: 404 }
      );
    }

    const oldPlanningDate = String((existingPlanning as { date?: string }).date || "").trim();

    const updatePayload: Record<string, unknown> = { updated_by: user.id };
    if (name !== undefined) updatePayload.name = String(name).trim();
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (date !== undefined) updatePayload.date = String(date).trim();
    if (status !== undefined) updatePayload.status = status;
    if (eventId !== undefined) updatePayload.event_id = eventId || null;

    const dateDeltaDays =
      date !== undefined && oldPlanningDate && isValidIsoDateOnly(oldPlanningDate)
        ? calendarDayDeltaIso(oldPlanningDate, String(date).trim())
        : 0;

    const { data: updatedPlanning, error } = await supabase
      .from("plannings")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .select(\`
        id,
        name,
        description,
        date,
        status,
        created_at,
        updated_at,
        event_id,
        events (
          id,
          name
        )
      \`)
      .single();

    if (error || !updatedPlanning) {
      console.error("[API][plannings][PUT] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: error?.message },
        { status: 500 }
      );
    }

    if (date !== undefined && dateDeltaDays !== 0) {
      const shiftRes = await shiftAllPlanningSlotDatesByDelta(supabase, id, dateDeltaDays);
      if (!shiftRes.ok) {
        await supabase
          .from("plannings")
          .update({ date: oldPlanningDate, updated_by: user.id })
          .eq("id", id)
          .eq("user_id", guard.clubId);
        console.error("[API][plannings][PUT] Décalage des créneaux:", shiftRes.message);
        return NextResponse.json(
          {
            error: "Erreur lors de la mise à jour des dates des créneaux",
            details: shiftRes.message,
          },
          { status: 500 }
        );
      }
    }

    await syncMemberParticipationsWithPlanning(supabase,`;

if (!text.includes(oldPut)) throw new Error("PUT anchor missing");
text = text.replace(oldPut, newPut);

fs.writeFileSync(p, text, "utf8");
console.log("patched", p.pathname);
