import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { SupportSaleDistributionPdf } from "@/lib/pdf/SupportSaleDistributionPdf";
import { groupMembersForDistribution } from "@/lib/support-sales/distribution";
import { isUuid } from "@/lib/support-sales/input";
import { loadSupportSalePdfContext } from "@/lib/support-sales/pdf-data";
import { getClubCompanyPdfData } from "@/lib/utils/pdf-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || !isUuid(id)) {
      return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    }

    const guard = await requirePermission(PERMISSIONS.VIEW_SUPPORT_SALES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const context = await loadSupportSalePdfContext(supabase, guard.clubId, id);
    if (!context) {
      return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
    }

    const { sale, dashboard } = context;
    const groups = groupMembersForDistribution(dashboard.members);
    const totalQuantity = groups.reduce((sum, group) => sum + group.totalQuantity, 0);
    const { company, primaryColor } = await getClubCompanyPdfData(supabase, guard.clubId);

    const pdfBuffer = await renderToBuffer(
      <SupportSaleDistributionPdf
        company={{ name: company.name || "Club", logoUrl: company.logoUrl }}
        sale={{ name: sale.name, productName: sale.productName }}
        totalQuantity={totalQuantity}
        groups={groups}
        primaryColor={primaryColor}
      />
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="distribution-${sale.slug}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
