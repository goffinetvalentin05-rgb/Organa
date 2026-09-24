"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActionButton, GlassCard } from "@/components/ui";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { isFinancialSystemCode } from "@/lib/accounting/financialAccounts";
import { sourceHref, sourceLabel } from "@/lib/accounting/sources";
import EntryComposer from "./EntryComposer";
import {
  STATUS_LABEL,
  accountLabel,
  sideLabels,
  type Account,
  type Attachment,
  type Entry,
  type InboxItem,
  type JournalLine,
  type Period,
} from "./model";

type Kind = "in" | "out" | "transfer" | "misc";

export default function JournalPanel({
  entries,
  accounts,
  linesByEntry,
  periods,
  attachments,
  inbox,
  reviewOnly,
  canWrite,
  onAct,
}: {
  entries: Entry[];
  accounts: Account[];
  linesByEntry: Record<string, JournalLine[]>;
  periods: Period[];
  attachments: Attachment[];
  inbox: InboxItem[];
  reviewOnly: boolean;
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(reviewOnly ? "pending" : "all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [accountId, setAccountId] = useState("");
  const [source, setSource] = useState("all");
  const [periodId, setPeriodId] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composer, setComposer] = useState<Kind | null>(null);

  const files = useMemo(() => {
    const map = new Map<string, Attachment[]>();
    for (const file of attachments) {
      const list = map.get(file.entry_id) ?? [];
      list.push(file);
      map.set(file.entry_id, list);
    }
    return map;
  }, [attachments]);

  const sources = useMemo(
    () => [...new Set(entries.map((entry) => entry.source_type))].sort(),
    [entries]
  );

  const visible = entries.filter((entry) => {
    if (reviewOnly && entry.status !== "pending") return false;
    if (!reviewOnly && status !== "all" && entry.status !== status) return false;
    if (from && entry.entry_date < from) return false;
    if (to && entry.entry_date > to) return false;
    if (periodId !== "all" && entry.period_id !== periodId) return false;
    if (source !== "all" && entry.source_type !== source) return false;
    if (accountId) {
      const lines = linesByEntry[entry.id] || [];
      if (!lines.some((line) => line.accountId === accountId)) return false;
    }
    const blob = `${entry.description} ${entry.party_name || ""} ${entry.entry_number}`.toLowerCase();
    return blob.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-4">
      {reviewOnly ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">À vérifier</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Vue du journal limitée aux écritures en attente. Ces montants restent hors des chiffres officiels.
            </p>
          </div>
          <Link href="/tableau-de-bord/comptabilite/journal" className="text-sm font-semibold text-[#1A23FF]">
            Ouvrir le journal complet
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ActionButton type="button" variant="premiumInline" disabled={!canWrite} onClick={() => setComposer("misc")}>Nouvelle écriture</ActionButton>
          <ActionButton type="button" variant="surface" disabled={!canWrite} onClick={() => setComposer("in")}>Nouvel encaissement</ActionButton>
          <ActionButton type="button" variant="surface" disabled={!canWrite} onClick={() => setComposer("out")}>Nouvelle dépense</ActionButton>
          <ActionButton type="button" variant="surface" disabled={!canWrite} onClick={() => setComposer("transfer")}>Nouveau transfert</ActionButton>
          {inbox.length + entries.filter((entry) => entry.status === "pending").length > 0 ? (
            <Link href="/tableau-de-bord/comptabilite/a-verifier" className="inline-flex items-center rounded-full bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
              À vérifier ({inbox.length + entries.filter((entry) => entry.status === "pending").length})
            </Link>
          ) : null}
        </div>
      )}

      {reviewOnly ? inbox.map((item) => (
        <InboxRow key={item.id} item={item} accounts={accounts} canWrite={canWrite} onAct={onAct} />
      )) : null}

      <div className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white shadow-sm">
        <div className="grid gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:grid-cols-2 lg:grid-cols-6">
          <input className={field} placeholder="Rechercher" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className={field} value={status} disabled={reviewOnly} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Toutes</option>
            <option value="pending">À vérifier</option>
            <option value="validated">Validées</option>
            <option value="reversed">Extournées</option>
          </select>
          <input className={field} type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Du" />
          <input className={field} type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Au" />
          <select className={field} value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            <option value="">Tous les comptes</option>
            {accounts.filter((account) => account.isActive).map((account) => (
              <option key={account.id} value={account.id}>{account.number} {account.name}</option>
            ))}
          </select>
          <select className={field} value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="all">Toutes les sources</option>
            {sources.map((item) => <option key={item} value={item}>{sourceLabel(item)}</option>)}
          </select>
          <select className={`${field} lg:col-span-2`} value={periodId} onChange={(event) => setPeriodId(event.target.value)}>
            <option value="all">Tous les exercices</option>
            {periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-white text-[11px] uppercase tracking-wide text-[#64748B]">
              <tr className="border-b border-[#E2E8F0]">
                {["Date", "N°", "Pièce", "Libellé", "Compte débit", "Compte crédit", "Montant", "Statut", "Source", "Remarque", "Justificatif"].map((label) => (
                  <th key={label} className="px-3 py-2 font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={11} className="px-3 py-8 text-center text-sm text-[#64748B]">Aucune écriture pour ces filtres.</td></tr>
              ) : null}
              {visible.map((entry) => {
                const lines = linesByEntry[entry.id] || [];
                const sides = sideLabels(lines, accounts);
                const docs = files.get(entry.id) || [];
                const href = sourceHref(entry.source_type, entry.source_id);
                const open = openId === entry.id;
                return (
                  <tr key={entry.id} className="border-b border-[#F1F5F9] align-top hover:bg-[#F8FAFC]">
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[#334155]">{formatSwissDate(entry.entry_date)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{entry.entry_number}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{sourceLabel(entry.source_type)}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-[#0F172A]">{entry.description}</p>
                      {reviewOnly && entry.status === "pending" ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {canWrite ? <button type="button" className="text-xs font-semibold text-[#1A23FF]" onClick={() => void onAct({ action: "validate", entryId: entry.id })}>Valider</button> : null}
                          <button type="button" className="text-xs font-semibold text-[#1A23FF]" onClick={() => setOpenId(open ? null : entry.id)}>{open ? "Fermer" : "Modifier"}</button>
                          {href ? <Link className="text-xs font-semibold text-[#1A23FF]" href={href}>Ouvrir</Link> : null}
                        </div>
                      ) : (
                        <button type="button" className="mt-1 text-xs text-[#1A23FF]" onClick={() => setOpenId(open ? null : entry.id)}>
                          {open ? "Masquer les lignes" : "Voir les lignes"}
                        </button>
                      )}
                          {open ? (
                        <div className="mt-2 space-y-1 text-xs text-[#475569]">
                          {lines.map((line, index) => (
                            <p key={`${entry.id}-${index}`}>
                              {line.debit > 0 ? "Débit" : "Crédit"} {accountLabel(accounts.find((account) => account.id === line.accountId))} {formatChfAmount(line.debit || line.credit)}
                            </p>
                          ))}
                          {reviewOnly && canWrite && entry.status === "pending" ? (
                            <button type="button" className="text-xs text-[#64748B]" onClick={() => void onAct({ action: "void", entryId: entry.id })}>Écarter</button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                    <td className="max-w-[12rem] px-3 py-2.5 text-[#334155]">{sides.debit}</td>
                    <td className="max-w-[12rem] px-3 py-2.5 text-[#334155]">{sides.credit}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums">{formatChfAmount(Number(entry.amount))}</td>
                    <td className="px-3 py-2.5"><StatusPill status={entry.status} /></td>
                    <td className="px-3 py-2.5">
                      {href ? <Link className="text-[#1A23FF]" href={href}>{sourceLabel(entry.source_type)}</Link> : sourceLabel(entry.source_type)}
                    </td>
                    <td className="max-w-[10rem] px-3 py-2.5 text-[#64748B]">{entry.party_name && entry.party_name !== entry.description ? entry.party_name : "—"}</td>
                    <td className="px-3 py-2.5 text-[#64748B]">{docs.length ? docs.map((file) => file.file_name || "Pièce").join(", ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-[#E2E8F0] px-3 py-2 text-xs text-[#64748B]">{visible.length} écriture{visible.length > 1 ? "s" : ""}</p>
      </div>

      {composer ? (
        <EntryComposer kind={composer} accounts={accounts} onClose={() => setComposer(null)} onAct={onAct} />
      ) : null}
    </div>
  );
}

function InboxRow({
  item,
  accounts,
  canWrite,
  onAct,
}: {
  item: InboxItem;
  accounts: Account[];
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [financialCode, setFinancialCode] = useState(item.financial_account_code || "");
  const [categoryCode, setCategoryCode] = useState(item.category_code || "");
  const [editing, setEditing] = useState(false);
  const financial = accounts.filter((account) => account.isActive && isFinancialSystemCode(account.systemCode));
  const categories = accounts.filter((account) => item.direction === "out" ? account.accountType === "expense" : account.accountType === "revenue");
  const href = sourceHref(item.source_type, item.source_id);

  return (
    <GlassCard padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusPill status={item.status} />
          <p className="mt-2 font-medium text-[#0F172A]">{item.party_name || item.description}</p>
          <p className="text-sm text-[#475569]">{formatChfAmount(Number(item.amount))} · {formatSwissDate(item.entry_date)} · {sourceLabel(item.source_type)}</p>
        </div>
        <div className="flex gap-2">
          {canWrite ? <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={() => setEditing((value) => !value)}>Modifier</button> : null}
          {href ? <Link className="text-sm font-semibold text-[#1A23FF]" href={href}>Ouvrir</Link> : null}
        </div>
      </div>
      {editing && canWrite ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Compte financier
            <select className={field} value={financialCode} onChange={(event) => setFinancialCode(event.target.value)}>
              <option value="">Choisir</option>
              {financial.map((account) => <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Catégorie
            <select className={field} value={categoryCode} onChange={(event) => setCategoryCode(event.target.value)}>
              <option value="">Choisir</option>
              {categories.map((account) => <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>)}
            </select>
          </label>
          <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "confirm", inboxId: item.id, financialAccountCode: financialCode, categoryCode })}>
            Proposer l’écriture
          </ActionButton>
        </div>
      ) : null}
    </GlassCard>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "validated"
    ? "bg-emerald-50 text-emerald-800"
    : status === "pending" || status.startsWith("awaiting")
      ? "bg-amber-50 text-amber-800"
      : status === "reversed"
        ? "bg-slate-100 text-slate-600"
        : "bg-[#F1F5F9] text-[#475569]";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{STATUS_LABEL[status] || status}</span>;
}

const field = "w-full rounded-lg border border-[rgba(15,23,42,0.1)] bg-white px-2.5 py-1.5 text-sm";
