"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { isOfficialStatus, signedBalance, type Account, type Entry, type JournalLine } from "./model";

type Tab = "result" | "balance" | "journal" | "ledger";

export default function ReportsPanel({
  summary,
  entries,
  accounts,
  linesByEntry,
  coverageNote,
}: {
  summary: Record<string, number>;
  entries: Entry[];
  accounts: Account[];
  linesByEntry: Record<string, JournalLine[]>;
  coverageNote?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("result");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const rows = useMemo(() => statementRows(entries, accounts, linesByEntry), [accounts, entries, linesByEntry]);

  return (
    <div className="space-y-4">
      {coverageNote ? <p className="text-sm text-[#475569]">{coverageNote}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(["result", "balance", "journal", "ledger"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? active : quiet} onClick={() => setTab(item)}>
            {TAB_LABEL[item]}
          </button>
        ))}
      </div>
      {tab === "result" ? <Statement title="Compte de résultat" sections={[{ title: "Produits", type: "revenue" }, { title: "Charges", type: "expense" }]} rows={rows} totalLabel="Résultat" total={summary.result || 0} /> : null}
      {tab === "balance" ? (
        <Statement
          title="Bilan"
          sections={[{ title: "Actifs", type: "asset" }, { title: "Passifs", type: "liability" }, { title: "Capitaux propres", type: "equity" }]}
          rows={rows}
          totalLabel="Trésorerie"
          total={summary.treasury || 0}
        />
      ) : null}
      {tab === "journal" ? <ExportJournal entries={entries} /> : null}
      {tab === "ledger" ? <Ledger accounts={accounts} accountId={accountId} setAccountId={setAccountId} entries={entries} linesByEntry={linesByEntry} /> : null}
      <div className="flex gap-3">
        <a className="rounded-full bg-[#1A23FF] px-4 py-2 text-sm font-semibold text-white" href="/api/accounting/pdf">PDF</a>
        <button type="button" className="rounded-full bg-[#F1F5F9] px-4 py-2 text-sm" onClick={() => downloadCsv(entries)}>CSV / Excel</button>
      </div>
    </div>
  );
}

const TAB_LABEL: Record<Tab, string> = {
  result: "Compte de résultat",
  balance: "Bilan",
  journal: "Journal",
  ledger: "Extrait de compte",
};

function Statement({
  title,
  sections,
  rows,
  totalLabel,
  total,
}: {
  title: string;
  sections: Array<{ title: string; type: string }>;
  rows: Array<{ id: string; number: string; name: string; type: string; balance: number }>;
  totalLabel: string;
  total: number;
}) {
  return (
    <GlassCard padding="sm">
      <h2 className="text-lg font-semibold text-[#0F172A]">{title}</h2>
      {sections.map((section) => {
        const lines = rows.filter((row) => row.type === section.type && row.balance !== 0);
        const sum = lines.reduce((acc, row) => acc + row.balance, 0);
        return (
          <div key={section.title} className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{section.title}</p>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {lines.length === 0 ? <tr><td className="py-1 text-[#94A3B8]">Aucun mouvement validé.</td></tr> : null}
                {lines.map((row) => (
                  <tr key={row.id} className="border-t border-[#F1F5F9]">
                    <td className="py-1.5 tabular-nums text-[#64748B]">{row.number}</td>
                    <td className="py-1.5">{row.name}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatChfAmount(row.balance)}</td>
                  </tr>
                ))}
                <tr className="border-t border-[#E2E8F0] font-medium">
                  <td />
                  <td className="py-1.5">Total {section.title.toLowerCase()}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatChfAmount(sum)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
      <p className="mt-4 text-right text-base font-semibold">{totalLabel} {formatChfAmount(total)}</p>
    </GlassCard>
  );
}

function ExportJournal({ entries }: { entries: Entry[] }) {
  const official = entries.filter((entry) => isOfficialStatus(entry.status));
  return (
    <GlassCard padding="sm">
      <h2 className="font-semibold">Journal exportable</h2>
      <p className="mt-1 text-sm text-[#64748B]">{official.length} écritures validées ou extournées.</p>
    </GlassCard>
  );
}

function Ledger({
  accounts,
  accountId,
  setAccountId,
  entries,
  linesByEntry,
}: {
  accounts: Account[];
  accountId: string;
  setAccountId: (id: string) => void;
  entries: Entry[];
  linesByEntry: Record<string, JournalLine[]>;
}) {
  const account = accounts.find((item) => item.id === accountId);
  const movements = entries.flatMap((entry) => {
    if (!isOfficialStatus(entry.status)) return [];
    return (linesByEntry[entry.id] || [])
      .filter((line) => line.accountId === accountId)
      .map((line) => ({ entry, line }));
  });
  return (
    <GlassCard padding="sm">
      <h2 className="font-semibold">Extrait de compte</h2>
      <select className="mt-3 rounded-xl border px-3 py-2 text-sm" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
        {accounts.map((item) => <option key={item.id} value={item.id}>{item.number} {item.name}</option>)}
      </select>
      <table className="mt-3 w-full text-sm">
        <thead className="text-xs uppercase text-[#64748B]"><tr><th className="py-1 text-left">Date</th><th className="text-left">Libellé</th><th className="text-right">Débit</th><th className="text-right">Crédit</th></tr></thead>
        <tbody>
          {movements.map(({ entry, line }) => (
            <tr key={`${entry.id}-${line.accountId}`} className="border-t border-[#F1F5F9]">
              <td className="py-1.5">{formatSwissDate(entry.entry_date)}</td>
              <td>{entry.description}</td>
              <td className="text-right tabular-nums">{line.debit ? formatChfAmount(line.debit) : ""}</td>
              <td className="text-right tabular-nums">{line.credit ? formatChfAmount(line.credit) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {account ? <p className="mt-2 text-xs text-[#64748B]">Compte {account.number} {account.name}</p> : null}
    </GlassCard>
  );
}

function statementRows(entries: Entry[], accounts: Account[], linesByEntry: Record<string, JournalLine[]>) {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!isOfficialStatus(entry.status)) continue;
    if (entry.source_type === "period_close") continue;
    for (const line of linesByEntry[entry.id] || []) {
      const account = accounts.find((item) => item.id === line.accountId);
      if (!account) continue;
      if (entry.source_type === "opening" && (account.accountType === "revenue" || account.accountType === "expense")) continue;
      totals.set(account.id, (totals.get(account.id) || 0) + signedBalance(account.accountType, line.debit, line.credit));
    }
  }
  return accounts.map((account) => ({
    id: account.id,
    number: account.number,
    name: account.name,
    type: account.accountType,
    balance: totals.get(account.id) || 0,
  }));
}

function downloadCsv(entries: Entry[]) {
  const header = ["Date", "N°", "Libellé", "Montant", "Statut", "Source"];
  const rows = entries.filter((entry) => isOfficialStatus(entry.status)).map((entry) => [
    formatSwissDate(entry.entry_date),
    entry.entry_number,
    entry.description,
    entry.amount,
    entry.status,
    entry.source_type,
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

const active = "rounded-full bg-[#1A23FF] px-3 py-1.5 text-sm font-semibold text-white";
const quiet = "rounded-full bg-[#F1F5F9] px-3 py-1.5 text-sm text-[#334155]";
