"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActionButton, GlassCard } from "@/components/ui";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { isFinancialSystemCode } from "@/lib/accounting/financialAccounts";
import { sourceHref, sourceLabel } from "@/lib/accounting/sources";
import AdvancedEntryForm from "./AdvancedEntryForm";
import EntryComposer from "./EntryComposer";
import {
  STATUS_LABEL,
  accountLabel,
  sideSummary,
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
  canManage,
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
  canManage: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(reviewOnly ? "pending" : "all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [accountId, setAccountId] = useState("");
  const [source, setSource] = useState("all");
  const [periodId, setPeriodId] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editingAdvanced, setEditingAdvanced] = useState<Entry | null>(null);
  const [composer, setComposer] = useState<Kind | "advanced" | null>(null);

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
          {canManage ? (
            <ActionButton type="button" variant="surface" onClick={() => setComposer("advanced")}>Écriture comptable avancée</ActionButton>
          ) : null}
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
                const debitLabel = sideSummary(lines, accounts, "debit");
                const creditLabel = sideSummary(lines, accounts, "credit");
                const docs = files.get(entry.id) || [];
                const href = sourceHref(entry.source_type, entry.source_id);
                const open = openId === entry.id;
                return (
                  <tr key={entry.id} className="border-b border-[#F1F5F9] align-top hover:bg-[#F8FAFC]">
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[#334155]">{formatSwissDate(entry.entry_date)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{entry.entry_number}</td>
                    <td className="px-3 py-2.5 text-[#475569]">{entry.reference || sourceLabel(entry.source_type)}</td>
                    <td className="px-3 py-2.5">
                      <button type="button" className="text-left font-medium text-[#0F172A]" onClick={() => setDetailId(entry.id)}>{entry.description}</button>
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
                    <td className="max-w-[12rem] px-3 py-2.5 text-[#334155]">{debitLabel}</td>
                    <td className="max-w-[12rem] px-3 py-2.5 text-[#334155]">{creditLabel}</td>
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

      {composer && composer !== "advanced" ? (
        <EntryComposer kind={composer} accounts={accounts} onClose={() => setComposer(null)} onAct={async (payload) => { await onAct(payload); }} />
      ) : null}
      {composer === "advanced" ? (
        <AdvancedEntryForm accounts={accounts} onClose={() => setComposer(null)} onAct={onAct} />
      ) : null}
      {detailId ? (
        <EntryDetail
          entry={entries.find((entry) => entry.id === detailId) || null}
          lines={linesByEntry[detailId] || []}
          accounts={accounts}
          files={files.get(detailId) || []}
          canManage={canManage}
          onClose={() => setDetailId(null)}
          onEdit={(entry) => { setDetailId(null); setEditingAdvanced(entry); }}
          onAct={onAct}
        />
      ) : null}
      {editingAdvanced ? (
        <AdvancedEntryForm
          accounts={accounts}
          initial={{
            entryId: editingAdvanced.id,
            date: editingAdvanced.entry_date,
            description: editingAdvanced.description,
            reference: editingAdvanced.reference || "",
            remark: editingAdvanced.party_name || "",
            lines: linesByEntry[editingAdvanced.id] || [],
          }}
          onClose={() => setEditingAdvanced(null)}
          onAct={onAct}
        />
      ) : null}
    </div>
  );
}

function EntryDetail({
  entry,
  lines,
  accounts,
  files,
  canManage,
  onClose,
  onEdit,
  onAct,
}: {
  entry: Entry | null;
  lines: JournalLine[];
  accounts: Account[];
  files: Attachment[];
  canManage: boolean;
  onClose: () => void;
  onEdit: (entry: Entry) => void;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  if (!entry) return null;
  const debit = lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = lines.reduce((sum, line) => sum + line.credit, 0);
  const advanced = entry.source_type === "manual_accounting" && entry.event_type === "manual_advanced_entry";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/30">
      <button type="button" className="h-full flex-1" aria-label="Fermer" onClick={onClose} />
      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white p-5 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Écriture {entry.entry_number}</p>
        <h2 className="mt-1 text-lg font-semibold">{entry.description}</h2>
        <p className="mt-1 text-sm text-[#64748B]">{formatSwissDate(entry.entry_date)} · {sourceLabel(entry.source_type)} · {STATUS_LABEL[entry.status] || entry.status}</p>
        <table className="mt-4 w-full text-sm">
          <thead className="text-[11px] uppercase text-[#64748B]"><tr><th className="py-1 text-left">Compte</th><th className="text-right">Débit</th><th className="text-right">Crédit</th></tr></thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-t border-[#F1F5F9]">
                <td className="py-1.5">{accountLabel(accounts.find((account) => account.id === line.accountId))}</td>
                <td className="py-1.5 text-right tabular-nums">{line.debit ? formatChfAmount(line.debit) : ""}</td>
                <td className="py-1.5 text-right tabular-nums">{line.credit ? formatChfAmount(line.credit) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm">Total débit {formatChfAmount(debit)} · Total crédit {formatChfAmount(credit)}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div><dt className="text-[#64748B]">Pièce</dt><dd>{entry.reference || "—"}</dd></div>
          <div><dt className="text-[#64748B]">Remarque</dt><dd>{entry.party_name || "—"}</dd></div>
          <div><dt className="text-[#64748B]">Création</dt><dd>{entry.created_at ? formatSwissDate(entry.created_at) : "—"}</dd></div>
          <div><dt className="text-[#64748B]">Validation</dt><dd>{entry.validated_at ? formatSwissDate(entry.validated_at) : "Pas encore validée"}</dd></div>
          <div><dt className="text-[#64748B]">Justificatifs</dt><dd>{files.length ? files.map((file) => file.file_name || "Pièce").join(", ") : "—"}</dd></div>
          <div><dt className="text-[#64748B]">Audit</dt><dd>Création, modification, validation et extourne sont enregistrées dans le journal d’audit.</dd></div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {canManage && entry.status === "pending" ? <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "validate", entryId: entry.id })}>Valider</ActionButton> : null}
          {canManage && advanced && entry.status === "pending" ? <ActionButton type="button" variant="surface" onClick={() => onEdit(entry)}>Modifier</ActionButton> : null}
          {canManage && advanced && entry.status === "validated" ? <ActionButton type="button" variant="ghost" onClick={() => void onAct({ action: "reverse", entryId: entry.id })}>Extourner</ActionButton> : null}
          <ActionButton type="button" variant="ghost" onClick={onClose}>Fermer</ActionButton>
        </div>
      </aside>
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
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
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
