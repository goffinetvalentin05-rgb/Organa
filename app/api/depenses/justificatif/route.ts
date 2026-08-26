import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

function guessMime(file: File): string {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  if (name.endsWith(".gif")) return "image/gif";
  return file.type || "";
}

function safeFileName(name: string) {
  return name
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .slice(0, 200);
}

/**
 * POST /api/depenses/justificatif
 * FormData: expenseId, file
 * Joint un justificatif (PDF / image / photo) à une charge existante.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requirePermission(PERMISSIONS.MANAGE_EXPENSES);
    if ("error" in guard) return guard.error;

    const form = await request.formData();
    const expenseId = String(form.get("expenseId") || "").trim();
    const file = form.get("file");

    if (!expenseId || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Charge et fichier requis" },
        { status: 400 }
      );
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 Mo)" },
        { status: 400 }
      );
    }

    const mime = guessMime(file);
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: "Formats acceptés : PDF, JPG, PNG, photo" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: expense, error: findError } = await supabase
      .from("expenses")
      .select("id, attachment_url")
      .eq("id", expenseId)
      .eq("user_id", guard.clubId)
      .maybeSingle();

    if (findError || !expense) {
      return NextResponse.json({ error: "Charge introuvable" }, { status: 404 });
    }

    const path = `${guard.clubId}/${expenseId}/${Date.now()}-${safeFileName(file.name || "justificatif")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("expenses").upload(path, buffer, {
      contentType: mime,
      upsert: false,
    });

    if (uploadError) {
      console.error("[API][depenses][justificatif] Upload:", uploadError);
      return NextResponse.json(
        { error: "Impossible d'enregistrer le justificatif", details: uploadError.message },
        { status: 500 }
      );
    }

    const previous = expense.attachment_url as string | null;
    const { error: updateError } = await supabase
      .from("expenses")
      .update({ attachment_url: path })
      .eq("id", expenseId)
      .eq("user_id", guard.clubId);

    if (updateError) {
      console.error("[API][depenses][justificatif] Update:", updateError);
      return NextResponse.json(
        { error: "Justificatif uploadé, mais la charge n'a pas pu être mise à jour" },
        { status: 500 }
      );
    }

    if (previous && !previous.startsWith("http://") && !previous.startsWith("https://")) {
      await supabase.storage.from("expenses").remove([previous]).catch(() => undefined);
    }

    revalidatePath("/tableau-de-bord/depenses");
    return NextResponse.json({ attachmentUrl: path }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[API][depenses][justificatif]", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout du justificatif", details: message }, { status: 500 });
  }
}
