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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.VIEW_VISUALS);
    if ("error" in guard) return guard.error;
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("club_visuals")
      .select(SELECT)
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Visuel introuvable." }, { status: 404 });
    return NextResponse.json({ visual: mapVisualRow(data) });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_VISUALS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    const body = await request.json().catch(() => null);

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("club_visuals")
      .select("id, template_id")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Visuel introuvable." }, { status: 404 });
    }

    const templateId =
      typeof body?.templateId === "string" && isVisualTemplateId(body.templateId)
        ? body.templateId
        : existing.template_id;
    const meta = getVisualTemplateMeta(templateId);
    if (!meta) {
      return NextResponse.json({ error: "Template inconnu." }, { status: 400 });
    }

    const format = parseVisualFormat(body?.format);
    if (!format || !meta.formats.includes(format)) {
      return NextResponse.json({ error: "Format non supporté." }, { status: 400 });
    }

    const data = sanitizeVisualData(body?.data);
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : defaultVisualTitle(templateId, data);

    const { data: updated, error } = await supabase
      .from("club_visuals")
      .update({
        template_id: templateId,
        type: meta.category,
        format,
        title,
        data_json: data,
        updated_at: new Date().toISOString(),
        updated_by: guard.userId,
      })
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .select(SELECT)
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message || "Mise à jour impossible." },
        { status: 500 }
      );
    }
    return NextResponse.json({ visual: mapVisualRow(updated) });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}

export async function DELETE(
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
    const { data: existing } = await supabase
      .from("club_visuals")
      .select("id")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Visuel introuvable." }, { status: 404 });
    }
    const { error } = await supabase
      .from("club_visuals")
      .delete()
      .eq("id", id)
      .eq("club_id", guard.clubId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: err(error) }, { status: 500 });
  }
}
