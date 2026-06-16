import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/billing/checkAccess";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";
import { fetchMergedMemberFieldSettings } from "@/lib/member-fields/loadSettings";
import { buildClientInsertPayload } from "@/lib/clients/memberWritePayload";
import {
  finalizeImportRows,
  MAX_IMPORT_ROWS,
  memberIdentityKey,
  rowToMemberBody,
  type ImportMemberRow,
} from "@/lib/clients/importMembers";

export const runtime = "nodejs";

interface ImportRequestBody {
  rows?: {
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    postal_code?: string;
    city?: string;
    role?: string;
    category?: string;
    date_of_birth?: string;
    avs_number?: string;
  }[];
}

function toImportMemberRow(
  raw: NonNullable<ImportRequestBody["rows"]>[number],
  rowIndex: number
): ImportMemberRow {
  return {
    rowIndex,
    prenom: String(raw.prenom ?? "").trim(),
    nom: String(raw.nom ?? "").trim(),
    email: String(raw.email ?? "").trim(),
    telephone: String(raw.telephone ?? "").trim(),
    adresse: String(raw.adresse ?? "").trim(),
    postal_code: String(raw.postal_code ?? "").trim(),
    city: String(raw.city ?? "").trim(),
    role: String(raw.role ?? "").trim(),
    category: String(raw.category ?? "").trim(),
    date_of_birth: String(raw.date_of_birth ?? "").trim(),
    avs_number: String(raw.avs_number ?? "").trim(),
    status: "valid",
    errors: [],
  };
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission(PERMISSIONS.MANAGE_MEMBERS);
  if ("error" in guard) return guard.error;

  const accessCheck = await requireWriteAccess();
  if (accessCheck.response) {
    return accessCheck.response;
  }

  let body: ImportRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const rawRows = body.rows;
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne à importer" }, { status: 400 });
  }
  if (rawRows.length > MAX_IMPORT_ROWS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_IMPORT_ROWS} lignes par import` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const user = guard.ctx.user;
  const clubId = guard.clubId;

  const { data: existingData, error: listError } = await supabase
    .from("clients")
    .select("nom, email")
    .eq("user_id", clubId);

  if (listError) {
    console.error("[API][clients/import] list_error", listError);
    return NextResponse.json(
      { error: "Impossible de vérifier les membres existants" },
      { status: 500 }
    );
  }

  const existing = (existingData || []).map((r) => ({
    nom: (r as { nom?: string }).nom ?? null,
    email: (r as { email?: string }).email ?? null,
  }));

  const candidateRows = rawRows.map((r, i) => toImportMemberRow(r, i + 1));
  const validated = finalizeImportRows(candidateRows, existing);
  const fieldSettings = await fetchMergedMemberFieldSettings(supabase, clubId);

  let imported = 0;
  let duplicates = validated.filter((r) => r.status === "duplicate").length;
  const validationErrors = validated.filter((r) => r.status === "error").length;
  const insertErrors: { rowIndex: number; message: string }[] = [];

  const seenKeys = new Set(
    existing
      .map((m) => {
        const email = (m.email || "").trim().toLowerCase();
        if (email) return `email:${email}`;
        return m.nom?.trim() ? `name:${m.nom.trim().toLowerCase()}` : "";
      })
      .filter(Boolean)
  );

  for (const row of validated) {
    if (row.status !== "valid") continue;

    const key = memberIdentityKey(row.prenom, row.nom, row.email);
    if (seenKeys.has(key)) {
      duplicates++;
      continue;
    }

    const bodyObj = rowToMemberBody(row);
    const insertPayload = buildClientInsertPayload(
      bodyObj,
      fieldSettings,
      clubId,
      user.id
    );

    if (!insertPayload.nom || typeof insertPayload.nom !== "string" || !insertPayload.nom.trim()) {
      continue;
    }

    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        duplicates++;
        seenKeys.add(key);
        continue;
      }
      console.error("[API][clients/import] insert_error", {
        clubId,
        rowIndex: row.rowIndex,
        code: insertError.code,
      });
      insertErrors.push({
        rowIndex: row.rowIndex,
        message: "Erreur lors de l'insertion",
      });
      continue;
    }

    seenKeys.add(key);
    imported++;

    if (newClient?.id) {
      const meta = extractRequestMetadata(request);
      await logAudit({
        clubId,
        action: AuditAction.CREATE,
        resourceType: "member",
        resourceId: String(newClient.id),
        metadata: { source: "import", role: bodyObj.role },
        ...meta,
      });
    }
  }

  revalidatePath("/tableau-de-bord/clients");

  return NextResponse.json(
    {
      imported,
      duplicates,
      errors: validationErrors + insertErrors.length,
      insertErrors,
    },
    { status: 200 }
  );
}
