import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { AuditAction, extractRequestMetadata, logAudit } from "@/lib/auth/audit";

export const runtime = "nodejs";
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erreur serveur";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guard = await requirePermission(PERMISSIONS.MANAGE_PLANNINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();

    const { data: reqData, error: reqError } = await supabase
      .from("buvette_requests")
      .select("id, reservation_date, status")
      .eq("id", id)
      .eq("user_id", guard.clubId)
      .is("deleted_at", null)
      .single();

    if (reqError || !reqData) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("buvette_requests")
      .update({
        deleted_at: now,
        deleted_by: guard.userId,
        updated_at: now,
      })
      .eq("id", id)
      .eq("user_id", guard.clubId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (reqData.status === "pending") {
      await supabase
        .from("buvette_slots")
        .delete()
        .eq("user_id", guard.clubId)
        .eq("request_id", id)
        .eq("status", "pending");
    }

    const meta = extractRequestMetadata(request);
    await logAudit({
      clubId: guard.clubId,
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
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
