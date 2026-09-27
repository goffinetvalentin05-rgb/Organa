import { NextResponse } from "next/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { loadWorkspace, recordExport } from "@/lib/accounting/service";
import {
  buildAccountExtract,
  buildBalanceSheet,
  buildIncomeStatement,
  buildJournalReport,
  type ReportKind,
} from "@/lib/accounting/reports";
import { renderAccountingReportPdf } from "@/lib/pdf/AccountingReportPdf";
import { getClubCompanyPdfData } from "@/lib/utils/pdf-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set<ReportKind>(["balance", "result", "journal", "ledger"]);

function filename(kind: ReportKind, periodLabel: string, accountNumber?: string): string {
  const period = periodLabel.replace(/[^\w.-]+/g, "-");
  if (kind === "balance") return `bilan-${period}.pdf`;
  if (kind === "result") return `compte-de-resultat-${period}.pdf`;
  if (kind === "journal") return `journal-${period}.pdf`;
  return `extrait-${accountNumber || "compte"}-${period}.pdf`;
}

export async function GET(request: Request) {
  const guard = await requirePermission(PERMISSIONS.VIEW_ACCOUNTING);
  if ("error" in guard) return guard.error;

  try {
    const url = new URL(request.url);
    const requested = url.searchParams.get("kind") || "";
    if (!KINDS.has(requested as ReportKind)) {
      return NextResponse.json({ error: "Type de rapport inconnu" }, { status: 400 });
    }
    const kind = requested as ReportKind;
    const workspace = await loadWorkspace(guard.clubId);
    if (!workspace.currentPeriod) {
      return NextResponse.json({ error: "Comptabilité non initialisée" }, { status: 404 });
    }
    const period = workspace.periods.find((item) => item.id === url.searchParams.get("periodId")) || workspace.currentPeriod;
    const books = {
      accounts: workspace.accounts,
      entries: workspace.entries,
      linesByEntry: workspace.linesByEntry,
      period,
    };
    const clubPdf = await getClubCompanyPdfData(createAdminClient(), guard.clubId);
    const club = { name: clubPdf.company.name, logoUrl: clubPdf.company.logoUrl || null };
    const generatedOn = new Date().toISOString();

    let pdf: Buffer;
    let accountNumber: string | undefined;
    if (kind === "balance") {
      pdf = await renderAccountingReportPdf({ kind, report: buildBalanceSheet(books), club, generatedOn });
    } else if (kind === "result") {
      pdf = await renderAccountingReportPdf({ kind, report: buildIncomeStatement(books), club, generatedOn });
    } else if (kind === "journal") {
      pdf = await renderAccountingReportPdf({ kind, report: buildJournalReport(books), club, generatedOn });
    } else {
      const accountId = url.searchParams.get("accountId") || "";
      const extract = buildAccountExtract({ ...books, accountId });
      if ("error" in extract) return NextResponse.json({ error: extract.error }, { status: 400 });
      accountNumber = extract.accountNumber;
      pdf = await renderAccountingReportPdf({ kind, report: extract, club, generatedOn });
    }

    await recordExport(guard.clubId, guard.userId, "pdf");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename(kind, period.label, accountNumber)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
