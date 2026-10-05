"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import {
  BALANCE_ASSET_TOTAL_LABEL,
  BALANCE_FUNDING_TOTAL_LABEL,
  balanceSubtotalLabel,
  buildAccountExtract,
  buildBalanceSheet,
  buildIncomeStatement,
  buildJournalReport,
  reportLineLabel,
  type LedgerReport,
  type ReportKind,
} from "@/lib/accounting/reports";
import type { Account, AccountGroup, Entry, JournalLine, Period } from "./model";

type Tab = ReportKind;

export default function ReportsPanel({
  entries,
  accounts,
  linesByEntry,
  periods,
  groups = [],
  coverageNote,
}: {
  entries: Entry[];
  accounts: Account[];
  linesByEntry: Record<string, JournalLine[]>;
  periods: Period[];
  groups?: AccountGroup[];
  coverageNote?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("result");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [periodId, setPeriodId] = useState(periods.find((period) => period.status === "open")?.id || periods[periods.length - 1]?.id || "");
  const period = periods.find((item) => item.id === periodId) || periods[periods.length - 1];
  const books = useMemo(() => {
    if (!period) return null;
    return { accounts, entries, linesByEntry, period, groups };
  }, [accounts, entries, linesByEntry, period, groups]);
  const balance = books ? buildBalanceSheet(books) : null;
  const income = books ? buildIncomeStatement(books) : null;
  const journal = books ? buildJournalReport(books) : null;
  const ledger = books && accountId ? buildAccountExtract({ ...books, accountId }) : null;

  const pdfHref = (() => {
    if (!period) return "";
    const params = new URLSearchParams({ kind: tab, periodId: period.id });
    if (tab === "ledger") params.set("accountId", accountId);
    return `/api/accounting/pdf?${params.toString()}`;
  })();

  return (
    <div className="space-y-4">
      {coverageNote ? <p className="text-sm text-[#475569]">{coverageNote}</p> : null}
      <nav className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-xl border border-[#D6DEE8] bg-white p-1" aria-label="Rapports">
        {(["result", "balance", "journal", "ledger"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === item ? "bg-[#0F172A] font-semibold text-white" : "text-[#475569] hover:bg-[#F4F7FB]"}`}
            onClick={() => setTab(item)}
          >
            {TAB_LABEL[item]}
          </button>
        ))}
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          {periods.length > 0 ? (
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
              Exercice
              <select className="mt-1.5 block h-9 rounded-lg border border-[#D6DEE8] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#0F172A]" value={periodId} onChange={(event) => setPeriodId(event.target.value)}>
                {periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          ) : null}
          {tab === "ledger" ? (
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
              Compte
              <select className="mt-1.5 block h-9 min-w-56 rounded-lg border border-[#D6DEE8] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#0F172A]" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                {accounts.map((item) => <option key={item.id} value={item.id}>{item.number} {item.name}</option>)}
              </select>
            </label>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {pdfHref && (tab !== "ledger" || accountId) ? (
            <a className="inline-flex h-9 items-center rounded-lg bg-[#1A23FF] px-3 text-sm font-semibold text-white" href={pdfHref}>PDF</a>
          ) : (
            <span className="inline-flex h-9 items-center rounded-lg bg-[#E2E8F0] px-3 text-sm text-[#64748B]">Choisissez un compte</span>
          )}
          {tab === "journal" && journal ? (
            <button type="button" className="inline-flex h-9 items-center rounded-lg border border-[#D6DEE8] bg-white px-3 text-sm font-medium text-[#0F172A]" onClick={() => downloadCsv(journal)}>CSV / Excel</button>
          ) : null}
        </div>
      </div>
      {tab === "result" && income ? <IncomeView report={income} /> : null}
      {tab === "balance" && balance ? <BalanceView report={balance} /> : null}
      {tab === "journal" && journal ? <JournalView report={journal} /> : null}
      {tab === "ledger" ? (
        <LedgerView
          ledger={ledger && "movements" in ledger ? ledger : null}
          error={ledger && "error" in ledger ? ledger.error : null}
        />
      ) : null}
    </div>
  );
}

const TAB_LABEL: Record<Tab, string> = {
  result: "Compte de résultat",
  balance: "Bilan",
  journal: "Journal",
  ledger: "Extrait de compte",
};

function IncomeView({ report }: { report: ReturnType<typeof buildIncomeStatement> }) {
  return (
    <GlassCard padding="sm">
      <h2 className="text-lg font-semibold text-[#0F172A]">Compte de résultat</h2>
      <p className="mt-1 text-sm text-[#64748B]">Du {formatSwissDate(report.from)} au {formatSwissDate(report.to)}</p>
      <GroupBlock title="Produits" groups={report.products} totalLabel="Total des produits" total={report.productTotal} empty="Aucun produit sur cette période." />
      <GroupBlock title="Charges" groups={report.charges} totalLabel="Total des charges" total={report.chargeTotal} empty="Aucune charge sur cette période." />
      <p className="mt-4 text-right text-base font-semibold">{report.outcome.label} {formatChfAmount(report.outcome.amount)}</p>
    </GlassCard>
  );
}

function JournalView({ report }: { report: ReturnType<typeof buildJournalReport> }) {
  return (
    <GlassCard padding="sm">
      <h2 className="font-semibold">Journal</h2>
      <p className="mt-1 text-sm text-[#64748B]">{report.scope}</p>
      <p className="mt-1 text-sm text-[#334155]">{report.lineCount} ligne{report.lineCount > 1 ? "s" : ""}.</p>
      <table className="mt-3 w-full text-sm">
        <thead className="text-xs uppercase text-[#64748B]">
          <tr>
            <th className="py-1 text-left">Date</th>
            <th className="text-left">N°</th>
            <th className="text-left">Libellé</th>
            <th className="text-left">Débit</th>
            <th className="text-left">Crédit</th>
            <th className="text-right">Montant</th>
            <th className="text-left">Statut</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={`${row.entryId}-${row.lineIndex}`} className="border-t border-[#F1F5F9]">
              <td className="py-1.5">{formatSwissDate(row.date)}</td>
              <td className="tabular-nums">{row.number}</td>
              <td>{row.label}</td>
              <td>{row.debit}</td>
              <td>{row.credit}</td>
              <td className="text-right tabular-nums">{formatChfAmount(row.amount)}</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function BalanceView({ report }: { report: ReturnType<typeof buildBalanceSheet> }) {
  return (
    <GlassCard padding="sm">
      <h2 className="text-lg font-semibold text-[#0F172A]">Bilan</h2>
      <p className="mt-1 text-sm text-[#64748B]">Situation au {formatSwissDate(report.asOf)}</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          {report.assets.map((group) => <GroupTable key={group.title} group={group} subtotalLabel={balanceSubtotalLabel(group.title)} />)}
          <p className="mt-3 text-right font-semibold">{BALANCE_ASSET_TOTAL_LABEL} {formatChfAmount(report.assetTotal)}</p>
        </div>
        <div>
          {report.funding.map((group) => <GroupTable key={group.title} group={group} subtotalLabel={balanceSubtotalLabel(group.title)} />)}
          <p className="mt-3 text-right font-semibold">{BALANCE_FUNDING_TOTAL_LABEL} {formatChfAmount(report.fundingTotal)}</p>
        </div>
      </div>
      {report.gap !== 0 ? (
        <p className="mt-4 text-sm text-rose-700">Écart {formatChfAmount(Math.abs(report.gap))}. Les deux côtés ne concordent pas.</p>
      ) : null}
    </GlassCard>
  );
}

function GroupBlock({
  title,
  groups,
  totalLabel,
  total,
  empty,
}: {
  title: string;
  groups: ReturnType<typeof buildIncomeStatement>["charges"];
  totalLabel: string;
  total: number;
  empty: string;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{title}</p>
      {groups.length === 0 ? <p className="py-1 text-sm text-[#94A3B8]">{empty}</p> : groups.map((group) => (
        <GroupTable key={group.title} group={group} hideTitle={group.title === title} hideSubtotal={groups.length === 1} />
      ))}
      <p className="mt-2 text-right text-sm font-medium">{totalLabel} {formatChfAmount(total)}</p>
    </div>
  );
}

function GroupTable({
  group,
  hideTitle = false,
  hideSubtotal = false,
  subtotalLabel,
}: {
  group: { title: string; lines: Array<{ number: string; name: string; amount: number; kind?: "account" | "group" }>; total: number };
  hideTitle?: boolean;
  hideSubtotal?: boolean;
  subtotalLabel?: string;
}) {
  return (
    <div className="mt-3">
      {hideTitle ? null : <p className="text-xs font-semibold text-[#334155]">{group.title}</p>}
      <table className="mt-1 w-full text-sm">
        <tbody>
          {group.lines.length === 0 ? <tr><td className="py-1 text-[#94A3B8]">Aucun mouvement validé.</td></tr> : null}
          {group.lines.map((row) => (
            <tr key={`${row.kind || "account"}:${row.number}:${row.name}`} className={`border-t border-[#F1F5F9] ${row.kind === "group" ? "font-semibold" : ""}`}>
              <td className="py-1.5 tabular-nums text-[#64748B]">{row.number}</td>
              <td className="py-1.5">{reportLineLabel(row)}{row.kind === "group" ? <span className="ml-2 text-[11px] font-medium text-[#64748B]">Sous-total, sans écriture</span> : null}</td>
              <td className="py-1.5 text-right tabular-nums">{formatChfAmount(row.amount)}</td>
            </tr>
          ))}
          {hideSubtotal ? null : (
            <tr className="border-t border-[#E2E8F0] font-medium">
              <td />
              <td className="py-1.5">{subtotalLabel || `Total ${group.title.toLowerCase()}`}</td>
              <td className="py-1.5 text-right tabular-nums">{formatChfAmount(group.total)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function LedgerView({
  ledger,
  error,
}: {
  ledger: LedgerReport | null;
  error: string | null;
}) {
  return (
    <GlassCard padding="sm">
      <h2 className="font-semibold">Extrait de compte</h2>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {ledger && "movements" in ledger ? (
        <>
          <p className="mt-3 text-sm text-[#64748B]">{ledger.accountNumber} {ledger.accountName}. {ledger.scope}</p>
          <p className="mt-2 text-sm">Solde initial {formatChfAmount(ledger.opening)}</p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-xs uppercase text-[#64748B]">
              <tr>
                <th className="py-1 text-left">Date</th>
                <th className="text-left">N°</th>
                <th className="text-left">Libellé</th>
                <th className="text-left">Contrepartie</th>
                <th className="text-right">Débit</th>
                <th className="text-right">Crédit</th>
                <th className="text-right">Solde</th>
              </tr>
            </thead>
            <tbody>
              {ledger.movements.map((row, index) => (
                <tr key={`${row.date}-${index}`} className="border-t border-[#F1F5F9]">
                  <td className="py-1.5">{formatSwissDate(row.date)}</td>
                  <td className="tabular-nums">{row.number}</td>
                  <td>{row.label}</td>
                  <td>{row.counterpart}</td>
                  <td className="text-right tabular-nums">{row.debit ? formatChfAmount(row.debit) : ""}</td>
                  <td className="text-right tabular-nums">{row.credit ? formatChfAmount(row.credit) : ""}</td>
                  <td className="text-right tabular-nums">{formatChfAmount(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-right text-sm font-semibold">Solde final {formatChfAmount(ledger.closing)}</p>
        </>
      ) : null}
    </GlassCard>
  );
}

function downloadCsv(journal: ReturnType<typeof buildJournalReport>) {
  const header = ["Date", "N°", "Pièce", "Libellé", "Débit", "Crédit", "Montant", "Remarque", "Statut"];
  const rows = journal.rows.map((row) => [
    formatSwissDate(row.date),
    row.number,
    row.piece,
    row.label,
    row.debit,
    row.credit,
    row.amount,
    row.remark,
    row.status,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "journal-comptable.csv";
  link.click();
  URL.revokeObjectURL(url);
  void fetch("/api/accounting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "export", kind: "csv" }),
  });
}
