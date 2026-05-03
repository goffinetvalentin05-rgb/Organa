import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { SponsorContractPdf } from "@/lib/pdf/SponsorContractPdf";
import { localeToIntl } from "@/lib/i18n";

export const runtime = "nodejs";

function sponsorTypeLabel(locale: string, type: string | null): string | null {
  if (!type) return null;
  const mapFr: Record<string, string> = {
    gold: "Or",
    silver: "Argent",
    bronze: "Bronze",
  };
  if (locale.startsWith("fr")) return mapFr[type] ?? type;
  const mapEn: Record<string, string> = {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
  };
  return mapEn[type] ?? type;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const locale = searchParams.get("locale") || "fr";

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const guard = await requirePermission(PERMISSIONS.VIEW_INVOICES);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const [{ data: row, error }, { data: profile }] = await Promise.all([
      supabase
        .from("sponsor_contracts")
        .select(
          "sponsor_name, title, content, amount, start_date, end_date, sponsor_type"
        )
        .eq("id", id)
        .eq("club_id", guard.clubId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("company_name, currency")
        .eq("user_id", guard.clubId)
        .maybeSingle(),
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    }

    const clubName =
      (profile?.company_name as string | undefined)?.trim() || "Club";
    const currency = (profile?.currency as string | undefined) || "CHF";
    const intl = localeToIntl[locale as keyof typeof localeToIntl] ?? localeToIntl.fr;

    let amountLabel: string | null = null;
    if (row.amount != null && row.amount !== "") {
      const n = Number(row.amount);
      if (Number.isFinite(n)) {
        amountLabel = new Intl.NumberFormat(intl, {
          style: "currency",
          currency,
        }).format(n);
      }
    }

    const pdfBuffer = await renderToBuffer(
      <SponsorContractPdf
        clubName={clubName}
        sponsorName={String(row.sponsor_name)}
        title={String(row.title)}
        amountLabel={amountLabel}
        startDate={String(row.start_date)}
        endDate={String(row.end_date)}
        sponsorTypeLabel={sponsorTypeLabel(locale, (row.sponsor_type as string) || null)}
        content={String(row.content ?? "")}
      />
    );

    const safeTitle = String(row.title)
      .replace(/[^\w\u00C0-\u024f\s-]+/gi, "")
      .trim()
      .slice(0, 40)
      .replace(/\s+/g, "-");
    const filename = `contrat-sponsor-${safeTitle || id}-${String(row.end_date)}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[pdf/contrat-sponsor]", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
