import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAssociationSettingsAccess } from "@/lib/associations/settings";
import { resolveClubLogoUrlForClient } from "@/lib/club/resolveClubLogoUrl";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 12) {
    // PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    // WEBP (RIFF....WEBP)
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "image/webp";
    }
  } else if (buffer.length >= 3) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
  }
  return null;
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/**
 * POST /api/associations/logo
 * Upload du logo pour l’organisation Associations active (bucket Logos existant).
 */
export async function POST(request: NextRequest) {
  const access = await requireAssociationSettingsAccess({ requireEdit: true });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Aucun fichier fourni" },
      { status: 400 }
    );
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (maximum 5 Mo)" },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const realMime = detectImageMime(bytes);
  if (!realMime || !ALLOWED_MIME.has(realMime)) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez PNG, JPEG ou WEBP." },
      { status: 400 }
    );
  }

  // Refuser si le Content-Type déclaré contredit le contenu réel (sauf image/* générique)
  if (
    file.type &&
    ALLOWED_MIME.has(file.type) &&
    file.type !== realMime &&
    !(file.type === "image/jpg" && realMime === "image/jpeg")
  ) {
    return NextResponse.json(
      { error: "Le type du fichier ne correspond pas à son contenu" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const clubId = access.clubId;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("logo_path, logo_url, product_type")
    .eq("user_id", clubId)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Profil association introuvable" },
      { status: 404 }
    );
  }
  if (profile.product_type !== "association") {
    return NextResponse.json(
      { error: "Organisation non Associations" },
      { status: 403 }
    );
  }

  const oldLogoPath =
    typeof profile.logo_path === "string" ? profile.logo_path : null;
  const fileName = `${clubId}/logo-${Date.now()}.${extensionForMime(realMime)}`;

  const { error: uploadError } = await supabase.storage
    .from("Logos")
    .upload(fileName, bytes, {
      contentType: realMime,
      upsert: false,
    });

  if (uploadError) {
    console.error("[associations/logo] upload:", uploadError.message);
    return NextResponse.json(
      { error: "Impossible d’envoyer le logo" },
      { status: 500 }
    );
  }

  const { data: pub } = supabase.storage.from("Logos").getPublicUrl(fileName);
  const logoUrl = pub?.publicUrl ?? null;
  if (!logoUrl) {
    await supabase.storage.from("Logos").remove([fileName]);
    return NextResponse.json(
      { error: "Impossible de générer l’URL du logo" },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      logo_path: fileName,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", clubId)
    .eq("product_type", "association");

  if (updateError) {
    await supabase.storage.from("Logos").remove([fileName]);
    console.error("[associations/logo] update:", updateError.message);
    return NextResponse.json(
      { error: "Impossible d’enregistrer le logo" },
      { status: 500 }
    );
  }

  if (oldLogoPath && oldLogoPath !== fileName) {
    try {
      await supabase.storage.from("Logos").remove([oldLogoPath]);
    } catch {
      /* non bloquant */
    }
  }

  const clientUrl = await resolveClubLogoUrlForClient(
    supabase,
    { logo_path: fileName, logo_url: logoUrl },
    clubId
  );

  return NextResponse.json({ logoUrl: clientUrl ?? logoUrl });
}

/**
 * DELETE /api/associations/logo
 */
export async function DELETE() {
  const access = await requireAssociationSettingsAccess({ requireEdit: true });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const supabase = await createClient();
  const clubId = access.clubId;

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("logo_path, product_type")
    .eq("user_id", clubId)
    .maybeSingle();

  if (fetchError || !profile) {
    return NextResponse.json(
      { error: "Profil association introuvable" },
      { status: 404 }
    );
  }
  if (profile.product_type !== "association") {
    return NextResponse.json(
      { error: "Organisation non Associations" },
      { status: 403 }
    );
  }

  if (!profile.logo_path) {
    return NextResponse.json(
      { error: "Aucun logo à supprimer" },
      { status: 400 }
    );
  }

  const logoPath = profile.logo_path;
  await supabase.storage.from("Logos").remove([logoPath]);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      logo_path: null,
      logo_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", clubId)
    .eq("product_type", "association");

  if (updateError) {
    console.error("[associations/logo] delete update:", updateError.message);
    return NextResponse.json(
      { error: "Impossible de supprimer le logo" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
