import { NextResponse } from "next/server";
import { PERMISSIONS, requirePermission } from "@/lib/auth/permissions";
import { buildBudgetComparison, buildBudgetDocument, type BudgetPdfView } from "@/lib/accounting/budget";
import { coverageForPeriod } from "@/lib/accounting/onboarding";
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

function filename(kind: ReportKind | "budget", periodLabel: string, accountNumber?: string, view?: BudgetPdfView): string {
  const period = periodLabel.replace(/[^\w.-]+/g, "-");
  if (kind === "budget") return view === "comparison" ? `budget-realise-${period}.pdf` : `budget-${period}.pdf`;
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
    if (requested === "budget") {
      return budgetResponse(guard.clubId, guard.userId, url);
    }
    if (!KINDS.has(requested as ReportKind)) {
      return NextResponse.json({ error: "Type de rapport inconnu" }, { status: 400 });
    }
    const kind = requested as ReportKind;
    const workspace = await loadWorkspace(guard.clubId);
    if (!workspace.currentPeriod) {
      return NextResponse.json({ error: "Comptabilité non initialisée" }, { status: 404 });
    }
    const period = workspace.periods.find((item) => item.id === url.searchParams.get("periodId")) || workspace.currentPeriod;
    const startDate = workspace.access.startDate;
    const coverage = coverageForPeriod({
      period,
      accountingStartDate: startDate,
      historyPending: workspace.access.startMode === "resume_current"
        && workspace.access.historyImportStatus !== "applied"
        && Boolean(startDate && period.startsOn <= startDate && startDate <= period.endsOn),
      hasRollup: workspace.entries.some((entry) => entry.event_type === "history_rollup" && entry.period_id === period.id && entry.status !== "voided"),
      priorOpen: workspace.periods.some((item) => item.endsOn < period.startsOn && item.status === "open"),
    });
    const books = {
      accounts: workspace.accounts,
      entries: workspace.entries,
      linesByEntry: workspace.linesByEntry,
      period,
      groups: workspace.groups,
      coverageNote: coverage.note,
      detailFrom: coverage.label === "Partielle" ? startDate : null,
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

async function budgetResponse(clubId: string, userId: string, url: URL) {
  const view: BudgetPdfView = url.searchParams.get("view") === "comparison" ? "comparison" : "forecast";
  const workspace = await loadWorkspace(clubId);
  if (!workspace.currentPeriod) {
    return NextResponse.json({ error: "Comptabilité non initialisée" }, { status: 404 });
  }
  const period = workspace.periods.find((item) => item.id === url.searchParams.get("periodId")) || workspace.currentPeriod;
  const saved = workspace.budgets.filter((budget) => budget.periodId === period.id);
  const official = saved.find((budget) => budget.status === "validated") || saved.find((budget) => budget.status === "draft");
  if (!official || (official.status !== "validated" && official.status !== "draft")) {
    return NextResponse.json({ error: "Aucun budget enregistré pour cet exercice." }, { status: 404 });
  }
  const comparison = buildBudgetComparison({
    accounts: workspace.accounts,
    groups: workspace.groups,
    entries: workspace.entries,
    linesByEntry: workspace.linesByEntry,
    period,
    lines: official.lines.map((line) => ({
      accountId: line.accountId,
      groupId: line.groupId,
      amount: line.amount,
      number: line.groupNumber || undefined,
      name: line.groupName || undefined,
    })),
  });
  const report = buildBudgetDocument({
    view,
    comparison,
    periodLabel: period.label,
    from: period.startsOn,
    to: period.endsOn,
    status: official.status,
    version: official.version,
  });
  const clubPdf = await getClubCompanyPdfData(createAdminClient(), clubId);
  const pdf = await renderAccountingReportPdf({
    kind: "budget",
    report,
    club: { name: clubPdf.company.name, logoUrl: clubPdf.company.logoUrl || null },
    generatedOn: new Date().toISOString(),
  });
  await recordExport(clubId, userId, "pdf");
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename("budget", period.label, undefined, view)}"`,
      "Cache-Control": "no-store",
    },
  });
}
