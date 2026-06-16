import { renderToBuffer } from "@react-pdf/renderer";
import { MeetingMinutesPdf } from "@/lib/pdf/MeetingMinutesPdf";
import {
  getMeetingMinutesPdfData,
  type MeetingMinutesPdfLocale,
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
      : "fr") as MeetingMinutesPdfLocale;

    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const guard = await requirePermission(PERMISSIONS.VIEW_MEETING_MINUTES);
    if ("error" in guard) return guard.error;

    const data = await getMeetingMinutesPdfData(id, {
      dataUserId: guard.clubId,
      locale,
    });

    const pdfBuffer = await renderToBuffer(
      <MeetingMinutesPdf
        company={data.company}
        primaryColor={data.primaryColor}
        minute={data.minute}
        locale={locale}
      />
    );

    const safeTitle = data.minute.title
      .replace(/[^\w\u00C0-\u024f\s-]+/gi, "")
      .trim()
      .slice(0, 40)
      .replace(/\s+/g, "-");
    const filename = `pv-seance-${safeTitle || id}-${data.minute.meetingDate}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[pdf/pv-seance/download]", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération du PDF", details: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
