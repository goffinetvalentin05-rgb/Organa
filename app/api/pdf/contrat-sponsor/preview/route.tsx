import { renderToBuffer } from "@react-pdf/renderer";
import { SponsorContractPdf } from "@/lib/pdf/SponsorContractPdf";
import {
  getSponsorContractPdfData,
  type SponsorContractPdfLocale,
} from "@/lib/utils/pdf-data";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const localeParam = (searchParams.get("locale") || "fr").toLowerCase();
    const locale = (["fr", "en", "de"].includes(localeParam)
      ? localeParam
      : "fr") as SponsorContractPdfLocale;

    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const guard = await requirePermission(PERMISSIONS.VIEW_INVOICES);
    if ("error" in guard) return guard.error;

    const data = await getSponsorContractPdfData(id, {
      dataUserId: guard.clubId,
      locale,
    });

    const pdfBuffer = await renderToBuffer(
      <SponsorContractPdf
        company={data.company}
        primaryColor={data.primaryColor}
        currencySymbol={data.currencySymbol}
        contract={data.contract}
        locale={locale}
      />
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=contrat-sponsor-preview.pdf",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[pdf/contrat-sponsor/preview]", error);
    return new Response(JSON.stringify({ error: "Erreur lors de la génération du PDF", details: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
