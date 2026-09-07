import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { mapVisualRow } from "@/lib/visuals/map";
import { sanitizeVisualData } from "@/lib/visuals/data";

export const runtime = "nodejs";

const SELECT =
  "id, club_id, template_id, type, format, title, data_json, created_at, updated_at";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_VISUALS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const supabase = await createClient();

    const { data: source, error } = await supabase
      .from("club_visuals")
      .select(SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();

    if (error || !source) {
      return NextResponse.json({ error: "Visuel introuvable." }, { status: 404 });
    }

    const { data: created, error: createError } = await supabase
      .from("club_visuals")
      .insert({
        club_id: guard.clubId,
        template_id: source.template_id,
        type: source.type,
        format: source.format,
        title: `${source.title} (copie)`.slice(0, 120),
        data_json: sanitizeVisualData(source.data_json),
        created_by: guard.userId,
        updated_by: guard.userId,
      })
      .select(SELECT)
      .single();

    if (createError || !created) {
      return NextResponse.json(
        { error: createError?.message || "Duplication impossible." },
        { status: 500 }
      );
    }

    return NextResponse.json({ visual: mapVisualRow(created) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
