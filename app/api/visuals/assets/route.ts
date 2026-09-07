import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requireWriteAccess } from "@/lib/billing/checkAccess";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 8 * 1024 * 1024;
const SLOT_KEYS = [
  "clubLogo",
  "opponentLogo",
  "eventLogo",
  "player",
  "team",
  "background",
  "event",
] as const;

export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_VISUALS);
    if ("error" in guard) return guard.error;
    const access = await requireWriteAccess(guard.clubId);
    if (access.response) return access.response;

    const formData = await request.formData();
    const file = formData.get("file");
    const slot = String(formData.get("slot") || "background");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }
    if (!SLOT_KEYS.includes(slot as (typeof SLOT_KEYS)[number])) {
      return NextResponse.json({ error: "Emplacement image inconnu." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté (JPG, PNG ou WebP)." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max. 8 Mo)." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "jpg";
    const path = `${guard.clubId}/${slot}-${Date.now()}.${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = await createClient();
    const { error: uploadError } = await supabase.storage
      .from("visual-assets")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from("visual-assets").getPublicUrl(path);
    return NextResponse.json({ url: pub.publicUrl, path }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
