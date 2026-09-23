import { NextResponse } from "next/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { loadWorkspace, recordExport } from "@/lib/accounting/service";
import { renderAccountingSummaryPdf } from "@/lib/pdf/AccountingReportPdf";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requirePermission(PERMISSIONS.VIEW_ACCOUNTING);
  if ("error" in guard) return guard.error;

  try {
    const workspace = await loadWorkspace(guard.clubId);
    if (!workspace.summary || !workspace.currentPeriod) {
      return NextResponse.json({ error: "Comptabilité non initialisée" }, { status: 404 });
    }
    const pdf = await renderAccountingSummaryPdf({
      clubLabel: "Club",
      periodLabel: workspace.currentPeriod.label,
      ...workspace.summary,
    });
    await recordExport(guard.clubId, guard.userId, "pdf");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comptabilite-${workspace.currentPeriod.label}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
