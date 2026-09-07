import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { getVisualTemplateMeta, isVisualTemplateId } from "@/lib/visuals/catalog";
import {
  defaultVisualTitle,
  parseVisualFormat,
  sanitizeVisualData,
} from "@/lib/visuals/data";
import { mapVisualRow } from "@/lib/visuals/map";

export const runtime = "nodejs";

const err = (e: unknown) => (e instanceof Error ? e.message : "Erreur serveur");

const SELECT =
  "id, club_id, template_id, type, format, title, data_json, created_at, updated_at";

export async function GET() {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_VISUALS);
    if ("error" in guard) return guard.error;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("club_visuals")
      .select(SELECT)
      .eq("club_id", guard.clubId)
      .order("updated_at", { ascending: false })
      .limit(40);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      visuals: (data || []).map((row) => mapVisualRow(row)),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_VISUALS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const body = await request.json().catch(() => null);
    const templateId =
      typeof body?.templateId === "string" ? body.templateId.trim() : "";
    if (!isVisualTemplateId(templateId)) {
      return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
    }
    const meta = getVisualTemplateMeta(templateId)!;
    const format = parseVisualFormat(body?.format);
    if (!format || !meta.formats.includes(format)) {
      return NextResponse.json({ error: "Format non supporté." }, { status: 400 });
    }

    const data = sanitizeVisualData(body?.data);
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : defaultVisualTitle(templateId, data);

    const supabase = await createClient();
    const { data: created, error } = await supabase
      .from("club_visuals")
      .insert({
        club_id: guard.clubId,
        template_id: templateId,
        type: meta.category,
        format,
        title,
        data_json: data,
        created_by: guard.userId,
        updated_by: guard.userId,
      })
      .select(SELECT)
      .single();

    if (error || !created) {
      return NextResponse.json(
        { error: error?.message || "Enregistrement impossible." },
        { status: 500 }
      );
    }

    return NextResponse.json({ visual: mapVisualRow(created) }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
