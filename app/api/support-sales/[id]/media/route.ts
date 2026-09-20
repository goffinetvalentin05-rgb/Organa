import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { isUuid } from "@/lib/support-sales/input";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const BUCKET = "support-sales";

type MediaKind = "image" | "sponsor" | "banner";

function kindFromRequest(request: NextRequest): MediaKind {
  const kind = request.nextUrl.searchParams.get("kind");
  if (kind === "sponsor" || kind === "banner") return kind;
  return "image";
}

function previousPath(
  kind: MediaKind,
  sale: { image_path: string | null; sponsor_logo_path: string | null; public_banner_path: string | null }
) {
  if (kind === "sponsor") return sale.sponsor_logo_path;
  if (kind === "banner") return sale.public_banner_path;
  return sale.image_path;
}

function mediaPatch(kind: MediaKind, path: string | null, url: string | null, userId: string) {
  if (kind === "sponsor") {
    return { sponsor_logo_path: path, sponsor_logo_url: url, updated_by: userId };
  }
  if (kind === "banner") {
    return { public_banner_path: path, public_banner_url: url, updated_by: userId };
  }
  return { image_path: path, image_url: url, updated_by: userId };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const supabase = await createClient();
    const { data: sale } = await supabase
      .from("support_sales")
      .select("id, image_path, sponsor_logo_path, public_banner_path")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté (JPG, PNG ou WebP)." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max. 5 Mo)." }, { status: 400 });
    }

    const kind = kindFromRequest(request);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${guard.clubId}/${id}/${kind}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const previous = previousPath(kind, sale);
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("support_sales")
      .update(mediaPatch(kind, path, pub.publicUrl, guard.userId))
      .eq("id", id)
      .eq("club_id", guard.clubId);
    if (updateError) {
      await supabase.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (previous && previous !== path) {
      await supabase.storage.from(BUCKET).remove([previous]);
    }

    return NextResponse.json({
      url: pub.publicUrl,
      kind,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_SUPPORT_SALES);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const supabase = await createClient();
    const { data: sale } = await supabase
      .from("support_sales")
      .select("id, image_path, sponsor_logo_path, public_banner_path")
      .eq("id", id)
      .eq("club_id", guard.clubId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!sale) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });

    const kind = kindFromRequest(request);
    const previous = previousPath(kind, sale);
    await supabase
      .from("support_sales")
      .update(mediaPatch(kind, null, null, guard.userId))
      .eq("id", id)
      .eq("club_id", guard.clubId);
    if (previous) await supabase.storage.from(BUCKET).remove([previous]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
