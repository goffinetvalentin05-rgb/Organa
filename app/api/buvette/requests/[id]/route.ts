import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erreur serveur";

async function archiveBuvetteRequest(
  request: NextRequest,
  id: string,
  clubId: string,
  userId: string
) {
  const supabase = await createClient();

  const { data: reqData, error: reqError } = await supabase
    .from("buvette_requests")
    .select("id, reservation_date, status")
    .eq("id", id)
    .eq("user_id", clubId)
    .is("deleted_at", null)
    .maybeSingle();

  if (reqError) {
    return NextResponse.json({ error: reqError.message }, { status: 500 });
  }
  if (!reqData) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  const { error: rpcError } = await supabase.rpc("soft_delete_row", {
    p_table: "buvette_requests",
    p_row_id: id,
  });

  if (rpcError) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("buvette_requests")
      .update({
        deleted_at: now,
        deleted_by: userId,
        updated_at: now,
      })
      .eq("id", id)
      .eq("user_id", clubId)
      .is("deleted_at", null);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  if (reqData.status === "pending") {
    await supabase
      .from("buvette_slots")
      .delete()
      .eq("user_id", clubId)
      .eq("request_id", id)
      .eq("status", "pending");
  }

  const meta = extractRequestMetadata(request);
  await logAudit({
    clubId,
    action: AuditAction.SOFT_DELETE,
    resourceType: "buvette_request",
    resourceId: id,
    metadata: {
      status: reqData.status,
      reservation_date: reqData.reservation_date,
    },
    ...meta,
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const body = await request.json().catch(() => ({}));
    if (body?.action !== "archive") {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    return archiveBuvetteRequest(request, id, guard.clubId, guard.userId);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    return archiveBuvetteRequest(request, id, guard.clubId, guard.userId);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
