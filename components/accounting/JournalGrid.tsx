"use client";

import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { isFinancialSystemCode } from "@/lib/accounting/financialAccounts";
import { parseChfInput } from "@/lib/accounting/onboarding";
import {
  canEditJournalEntry,
  nextJournalField,
  rowsToLines,
  toJournalRows,
  type JournalField,
  type JournalVisualRow,
} from "@/lib/accounting/journalGrid";
import { sourceLabel } from "@/lib/accounting/sources";
import AccountingModal from "./AccountingModal";
import { STATUS_LABEL, type Account, type Attachment, type Entry, type InboxItem, type JournalLine, type Period } from "./model";

type Draft = {
  localId: string;
  entryId?: string;
  date: string;
  piece: string;
  label: string;
  debitId: string;
  creditId: string;
  amount: string;
  remark: string;
  idempotencyKey: string;
};

type EntryEdit = {
  date: string;
  piece: string;
  label: string;
  remark: string;
  rows: Array<{ debitId: string; creditId: string; amount: string }>;
};

export default function JournalGrid({
  entries,
  accounts,
  linesByEntry,
  periods,
  attachments,
  inbox,
  reviewOnly,
  canWrite,
  onAct,
  onReload,
}: {
  entries: Entry[];
  accounts: Account[];
  linesByEntry: Record<string, JournalLine[]>;
  periods: Period[];
  attachments: Attachment[];
  inbox: InboxItem[];
  reviewOnly: boolean;
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
  onReload: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(reviewOnly ? "pending" : "all");
  const [accountId, setAccountId] = useState("");
  const [source, setSource] = useState("all");
  const [periodId, setPeriodId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [extras, setExtras] = useState<Record<string, Draft[]>>({});
  const [edits, setEdits] = useState<Record<string, EntryEdit>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const activeAccounts = accounts.filter((account) => account.isActive);
  const pendingCount = entries.filter((entry) => entry.status === "pending").length + inbox.length;

  const visibleEntries = entries.filter((entry) => {
    if (status !== "all" && entry.status !== status) return false;
    if (from && entry.entry_date < from) return false;
    if (to && entry.entry_date > to) return false;
    if (periodId !== "all" && entry.period_id !== periodId) return false;
    if (source !== "all" && entry.source_type !== source) return false;
    if (accountId && !(linesByEntry[entry.id] || []).some((line) => line.accountId === accountId)) return false;
    const blob = `${entry.description} ${entry.party_name || ""} ${entry.reference || ""} ${entry.entry_number}`.toLowerCase();
    return blob.includes(query.trim().toLowerCase());
  });

  const groups = useMemo(() => visibleEntries.map((entry) => ({
    entry,
    rows: toJournalRows(entry.id, linesByEntry[entry.id] || []),
  })), [linesByEntry, visibleEntries]);

  function seed(entry: Entry, rows: JournalVisualRow[]): EntryEdit {
    return {
      date: entry.entry_date,
      piece: entry.reference || "",
      label: entry.description,
      remark: entry.party_name || "",
      rows: rows.map((row) => ({
        debitId: row.debitAccountId || "",
        creditId: row.creditAccountId || "",
        amount: String(row.amount),
      })),
    };
  }

  function editOf(entry: Entry, rows: JournalVisualRow[]): EntryEdit {
    return edits[entry.id] || seed(entry, rows);
  }

  function patchEdit(entry: Entry, rows: JournalVisualRow[], next: EntryEdit) {
    setEdits((current) => ({ ...current, [entry.id]: next }));
    setNotice(null);
  }

  function addDraft(entryId?: string) {
    const row: Draft = {
      localId: crypto.randomUUID(),
      entryId,
      date: new Date().toISOString().slice(0, 10),
      piece: "",
      label: "",
      debitId: "",
      creditId: "",
      amount: "",
      remark: "",
      idempotencyKey: `journal:${crypto.randomUUID()}`,
    };
    if (entryId) setExtras((current) => ({ ...current, [entryId]: [...(current[entryId] || []), row] }));
    else setDrafts((current) => [row, ...current]);
  }

  async function persistLines(params: {
    entry?: Entry;
    draft?: Draft;
    date: string;
    description: string;
    reference: string;
    remark: string;
    lines: ReturnType<typeof rowsToLines>;
  }) {
    const result = await onAct({
      action: "journal-save",
      entryId: params.entry?.id,
      date: params.date,
      description: params.description,
      reference: params.reference,
      remark: params.remark,
      idempotencyKey: params.draft?.idempotencyKey,
      lines: params.lines,
    });
    if (!result) return;
    if (params.draft && !params.draft.entryId) {
      setDrafts((current) => current.filter((item) => item.localId !== params.draft!.localId));
    }
    if (params.entry) {
      setExtras((current) => ({ ...current, [params.entry!.id]: [] }));
      setEdits((current) => {
        const next = { ...current };
        delete next[params.entry!.id];
        return next;
      });
      setEditingId(null);
    }
  }

  async function saveDraft(draft: Draft) {
    const amount = parseChfInput(draft.amount);
    if (!draft.debitId || !draft.creditId || !amount) {
      setNotice("Indiquez le débit, le crédit et le montant.");
      return;
    }
    await persistLines({
      draft,
      date: draft.date,
      description: draft.label,
      reference: draft.piece,
      remark: draft.remark,
      lines: rowsToLines([{ debitAccountId: draft.debitId, creditAccountId: draft.creditId, amount }]),
    });
  }

  async function saveEntry(entry: Entry, rows: JournalVisualRow[]) {
    const edit = editOf(entry, rows);
    const added = extras[entry.id] || [];
    const visual = [
      ...edit.rows.map((row, index) => ({
        debitAccountId: row.debitId || null,
        creditAccountId: row.creditId || null,
        amount: parseChfInput(row.amount) || 0,
        key: rows[index]?.key || `${entry.id}:${index}`,
      })),
      ...added.map((row) => ({
        debitAccountId: row.debitId || null,
        creditAccountId: row.creditId || null,
        amount: parseChfInput(row.amount) || 0,
        key: row.localId,
      })),
    ];
    const lines = rowsToLines(visual);
    const debit = lines.reduce((sum, line) => sum + line.debit, 0);
    const credit = lines.reduce((sum, line) => sum + line.credit, 0);
    if (lines.length < 2 || debit !== credit || debit <= 0) {
      setNotice("L’écriture doit être équilibrée avant d’être enregistrée.");
      return;
    }
    await persistLines({
      entry,
      date: edit.date,
      description: edit.label,
      reference: edit.piece,
      remark: edit.remark,
      lines,
    });
  }

  function askCorrection(entry: Entry) {
    if (entry.status !== "validated" || entry.reversed_by_entry_id) return;
    setCorrecting(entry.id);
  }

  async function upload(entryId: string, file: File) {
    const form = new FormData();
    form.set("entryId", entryId);
    form.set("file", file);
    const response = await fetch("/api/accounting", { method: "PUT", body: form });
    const body = await response.json();
    if (!response.ok) {
      setNotice(body.error || "Justificatif impossible");
      return;
    }
    await onReload();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {canWrite ? (
          <button type="button" className="rounded-full bg-[#1A23FF] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => addDraft()}>
            Nouvelle écriture
          </button>
        ) : null}
        <button type="button" className={`rounded-full px-3 py-1.5 text-sm ${status === "pending" ? "bg-amber-100 text-amber-900" : "bg-white text-[#334155] ring-1 ring-inset ring-[rgba(15,23,42,0.08)]"}`} onClick={() => setStatus(status === "pending" && !reviewOnly ? "all" : "pending")}>
          À vérifier ({pendingCount})
        </button>
        {selected.length > 0 && canWrite ? (
          <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={() => void Promise.all(selected.map((id) => onAct({ action: "validate", entryId: id })))}>
            Valider la sélection ({selected.length})
          </button>
        ) : null}
      </div>
      {notice ? <p className="text-sm text-[#334155]">{notice}</p> : null}
      <div className="overflow-hidden rounded-xl border border-[#D6DEE8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="grid grid-cols-2 gap-2 border-b border-[#E2E8F0] bg-[#F4F7FB] p-3 md:grid-cols-4 xl:grid-cols-7">
          <Filter label="Recherche"><input className={filter} placeholder="Libellé, pièce, n°" value={query} onChange={(event) => setQuery(event.target.value)} /></Filter>
          <Filter label="Exercice">
            <select className={filter} value={periodId} onChange={(event) => setPeriodId(event.target.value)}>
              <option value="all">Tous</option>
              {periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}
            </select>
          </Filter>
          <Filter label="Du"><input className={filter} type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Filter>
          <Filter label="Au"><input className={filter} type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Filter>
          <Filter label="Statut">
            <select className={filter} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Toutes</option>
              <option value="pending">À vérifier</option>
              <option value="validated">Validées</option>
              <option value="reversed">Extournées</option>
            </select>
          </Filter>
          <Filter label="Compte">
            <select className={filter} value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              <option value="">Tous</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.number} {account.name}</option>)}
            </select>
          </Filter>
          <Filter label="Source">
            <select className={filter} value={source} onChange={(event) => setSource(event.target.value)}>
              <option value="all">Toutes</option>
              {[...new Set(entries.map((entry) => entry.source_type))].map((item) => <option key={item} value={item}>{sourceLabel(item)}</option>)}
            </select>
          </Filter>
        </div>
        <div className="max-h-[calc(100vh-13.5rem)] overflow-auto">
          <table className="w-full min-w-[1280px] table-fixed border-collapse text-left text-[13px] text-[#0F172A]">
            <colgroup>
              <col className="w-9" />
              <col className="w-[7.5rem]" />
              <col className="w-16" />
              <col className="w-28" />
              <col />
              <col className="w-[16rem]" />
              <col className="w-[16rem]" />
              <col className="w-32" />
              <col className="w-24" />
              <col className="w-28" />
              <col className="w-36" />
              <col className="w-14" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]">
              <tr className="border-b border-[#D6DEE8]">
                <th className="px-2 py-2.5" />
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-2 py-2.5 font-semibold" title="Numéro interne de l’écriture">N° écr.</th>
                <th className="px-2 py-2.5 font-semibold" title="Référence du document">Pièce</th>
                <th className="px-3 py-2.5 font-semibold">Libellé</th>
                <th className="px-3 py-2.5 font-semibold">Débit</th>
                <th className="px-3 py-2.5 font-semibold">Crédit</th>
                <th className="px-3 py-2.5 text-right font-semibold">Montant</th>
                <th className="px-2 py-2.5 font-semibold">Statut</th>
                <th className="px-2 py-2.5 font-semibold">Source</th>
                <th className="px-2 py-2.5 font-semibold">Remarque</th>
                <th className="px-2 py-2.5 font-semibold" title="Justificatif">Just.</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <DraftRow
                  key={draft.localId}
                  draft={draft}
                  accounts={activeAccounts}
                  onChange={(next) => setDrafts(drafts.map((item) => item.localId === next.localId ? next : item))}
                  onSave={() => void saveDraft(draft)}
                  onCancel={() => setDrafts(drafts.filter((item) => item.localId !== draft.localId))}
                />
              ))}
              {(status === "all" || status === "pending") ? inbox.map((item) => (
                <InboxRow key={item.id} item={item} accounts={activeAccounts} canWrite={canWrite} onAct={onAct} />
              )) : null}
              {groups.map(({ entry, rows }) => {
                const edit = editOf(entry, rows);
                const editable = canWrite && canEditJournalEntry(entry.status);
                const editing = editingId === entry.id;
                const total = rows.reduce((sum, item) => sum + item.amount, 0);
                return (
                  <GroupRows key={entry.id}>
                    {rows.map((row) => (
                  <SavedRow
                    key={row.key}
                    entry={entry}
                    row={row}
                    edit={edit}
                    accounts={activeAccounts}
                    files={attachments.filter((file) => file.entry_id === entry.id)}
                    selected={selected.includes(entry.id)}
                    showMeta={row.groupIndex === 0}
                    editable={editable && editing}
                    onToggle={() => setSelected(selected.includes(entry.id) ? selected.filter((id) => id !== entry.id) : [...selected, entry.id])}
                    onValidate={() => void onAct({ action: "validate", entryId: entry.id })}
                    onChange={(next) => patchEdit(entry, rows, next)}
                    onSave={() => void saveEntry(entry, rows)}
                    onCancel={() => {
                      setEditingId(null);
                      setEdits((current) => {
                        const next = { ...current };
                        delete next[entry.id];
                        return next;
                      });
                    }}
                    onAddLine={editable && editing && row.groupIndex === rows.length - 1 ? () => addDraft(entry.id) : undefined}
                    onUpload={(file) => void upload(entry.id, file)}
                    onActivate={() => {
                      if (editable) setEditingId(entry.id);
                      else askCorrection(entry);
                    }}
                  />
                    ))}
                    {rows.length > 1 ? (
                      <tr className="border-b-2 border-[#D6DEE8] bg-[#F4F7FB]">
                        <td colSpan={7} className="px-3 py-1.5 text-right text-[11px] font-medium uppercase tracking-wide text-[#64748B]">Total de l’écriture</td>
                        <td className="px-3 py-1.5 text-right text-sm font-semibold tabular-nums">{formatChfAmount(total)}</td>
                        <td colSpan={4} />
                      </tr>
                    ) : null}
                    {(extras[entry.id] || []).map((draft) => (
                      <DraftRow
                        key={draft.localId}
                        draft={draft}
                        accounts={activeAccounts}
                        compact
                        onChange={(next) => setExtras({ ...extras, [entry.id]: (extras[entry.id] || []).map((item) => item.localId === next.localId ? next : item) })}
                        onSave={() => void saveEntry(entry, rows)}
                        onCancel={() => setExtras({ ...extras, [entry.id]: (extras[entry.id] || []).filter((item) => item.localId !== draft.localId) })}
                      />
                    ))}
                  </GroupRows>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {correcting ? (
        <AccountingModal title="Écriture validée" onClose={() => setCorrecting(null)}>
          <p className="text-sm leading-relaxed text-[#334155]">Cette écriture est validée. Une correction extourne l’originale et ouvre une nouvelle écriture à vérifier.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-full px-3 py-1.5 text-sm text-[#475569]" onClick={() => setCorrecting(null)}>Annuler</button>
            <button type="button" className="rounded-full bg-[#1A23FF] px-3 py-1.5 text-sm font-semibold text-white" onClick={() => { const id = correcting; setCorrecting(null); void onAct({ action: "correct", entryId: id }); }}>Créer une correction</button>
          </div>
        </AccountingModal>
      ) : null}
    </div>
  );
}

function moveField(event: KeyboardEvent<HTMLElement>, field: JournalField, onSave: () => void) {
  if (event.key !== "Enter") return;
  const next = nextJournalField(field);
  event.preventDefault();
  if (next === "next-row") {
    onSave();
    return;
  }
  const row = event.currentTarget.closest("tr");
  row?.querySelector<HTMLElement>(`[data-field="${next}"]`)?.focus();
}

function DraftRow({
  draft,
  accounts,
  compact,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Draft;
  accounts: Account[];
  compact?: boolean;
  onChange: (draft: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function keyDown(event: KeyboardEvent<HTMLInputElement>, field: JournalField) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    moveField(event, field, onSave);
  }
  return (
    <tr className="border-b border-[#F1F5F9] bg-[#F8FAFF]">
      <td />
      <td className="px-2 py-1">{compact ? null : <input data-field="date" className={cell} type="date" value={draft.date} onChange={(event) => onChange({ ...draft, date: event.target.value })} onKeyDown={(event) => keyDown(event, "date")} />}</td>
      <td className="px-2 py-1 text-[#94A3B8]">{compact ? "" : "auto"}</td>
      <td className="px-2 py-1">{compact ? null : <input data-field="piece" className={cell} value={draft.piece} placeholder="Pièce" onChange={(event) => onChange({ ...draft, piece: event.target.value })} onKeyDown={(event) => keyDown(event, "piece")} />}</td>
      <td className="px-2 py-1">{compact ? <span className="text-[11px] text-[#94A3B8]">ligne ajoutée</span> : <input data-field="label" className={cell} value={draft.label} placeholder="Libellé" onChange={(event) => onChange({ ...draft, label: event.target.value })} onKeyDown={(event) => keyDown(event, "label")} />}</td>
      <td className="px-2 py-1"><AccountPicker field="debit" accounts={accounts} value={draft.debitId} onChange={(debitId) => onChange({ ...draft, debitId })} onSave={onSave} /></td>
      <td className="px-2 py-1"><AccountPicker field="credit" accounts={accounts} value={draft.creditId} onChange={(creditId) => onChange({ ...draft, creditId })} onSave={onSave} /></td>
      <td className="px-2 py-1"><input data-field="amount" className={`${cell} text-right tabular-nums`} value={draft.amount} placeholder="0.00" onChange={(event) => onChange({ ...draft, amount: event.target.value })} onKeyDown={(event) => keyDown(event, "amount")} /></td>
      <td className="px-2 py-1 text-xs text-[#64748B]">{compact ? "" : "Brouillon"}</td>
      <td className="px-2 py-1 text-xs text-[#94A3B8]">{compact ? "" : "Manuel"}</td>
      <td className="px-2 py-1">{compact ? null : <input data-field="remark" className={cell} value={draft.remark} onChange={(event) => onChange({ ...draft, remark: event.target.value })} onKeyDown={(event) => keyDown(event, "remark")} />}</td>
      <td />
    </tr>
  );
}

function SavedRow({
  entry,
  row,
  edit,
  accounts,
  files,
  selected,
  showMeta,
  editable,
  onToggle,
  onValidate,
  onChange,
  onSave,
  onCancel,
  onAddLine,
  onUpload,
  onActivate,
}: {
  entry: Entry;
  row: JournalVisualRow;
  edit: EntryEdit;
  accounts: Account[];
  files: Attachment[];
  selected: boolean;
  showMeta: boolean;
  editable: boolean;
  onToggle: () => void;
  onValidate: () => void;
  onChange: (edit: EntryEdit) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddLine?: () => void;
  onUpload: (file: File) => void;
  onActivate: () => void;
}) {
  const line = edit.rows[row.groupIndex] || { debitId: "", creditId: "", amount: "" };
  const grouped = row.groupSize > 1;
  const debit = accounts.find((account) => account.id === (editable ? line.debitId : row.debitAccountId));
  const credit = accounts.find((account) => account.id === (editable ? line.creditId : row.creditAccountId));
  function keyDown(event: KeyboardEvent<HTMLInputElement>, field: JournalField) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    moveField(event, field, onSave);
  }
  function setRow(patch: Partial<typeof line>) {
    const rows = edit.rows.map((item, index) => index === row.groupIndex ? { ...item, ...patch } : item);
    onChange({ ...edit, rows });
  }
  return (
    <>
      <tr
        className={`border-b border-[#EEF2F6] ${grouped ? (row.groupIndex === 0 ? "border-t-2 border-t-[#CBD5E1] bg-white" : "bg-[#F7F9FC]") : "bg-white"} ${editable ? "cursor-text" : entry.status === "validated" ? "cursor-pointer" : ""} hover:bg-[#F3F6FB]`}
        onClick={onActivate}
      >
        <td className="px-2" onClick={(event) => event.stopPropagation()}>{showMeta && entry.status === "pending" ? <input type="checkbox" checked={selected} onChange={onToggle} aria-label="Sélectionner" /> : null}</td>
        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[#334155]">
          {showMeta && editable ? <input data-field="date" className={cell} type="date" value={edit.date} onClick={(event) => event.stopPropagation()} onChange={(event) => onChange({ ...edit, date: event.target.value })} onKeyDown={(event) => keyDown(event, "date")} /> : showMeta ? formatSwissDate(entry.entry_date) : ""}
        </td>
        <td className="px-2 py-2.5 font-medium tabular-nums text-[#475569]">{showMeta ? entry.entry_number : ""}</td>
        <td className="px-2 py-2.5 text-[#334155]">
          {showMeta && editable ? <input data-field="piece" className={cell} value={edit.piece} placeholder="Réf." onClick={(event) => event.stopPropagation()} onChange={(event) => onChange({ ...edit, piece: event.target.value })} onKeyDown={(event) => keyDown(event, "piece")} /> : showMeta ? (entry.reference || "—") : ""}
        </td>
        <td className={`px-3 py-2.5 ${row.groupIndex > 0 ? "pl-6 text-[#475569]" : "font-medium"}`}>
          {showMeta && editable ? <input data-field="label" className={cell} value={edit.label} onClick={(event) => event.stopPropagation()} onChange={(event) => onChange({ ...edit, label: event.target.value })} onKeyDown={(event) => keyDown(event, "label")} /> : showMeta ? entry.description : <span className="text-[#94A3B8]">↳</span>}
        </td>
        <td className="px-3 py-2.5" onClick={(event) => editable && event.stopPropagation()}>
          {editable ? <AccountPicker field="debit" accounts={accounts} value={line.debitId} onChange={(debitId) => setRow({ debitId })} onSave={onSave} /> : <AccountCell account={debit} />}
        </td>
        <td className="px-3 py-2.5" onClick={(event) => editable && event.stopPropagation()}>
          {editable ? <AccountPicker field="credit" accounts={accounts} value={line.creditId} onChange={(creditId) => setRow({ creditId })} onSave={onSave} /> : <AccountCell account={credit} />}
        </td>
        <td className="px-3 py-2.5 text-right text-[13px] font-medium tabular-nums">
          {editable ? <input data-field="amount" className={`${cell} text-right`} value={line.amount} onClick={(event) => event.stopPropagation()} onChange={(event) => setRow({ amount: event.target.value })} onKeyDown={(event) => keyDown(event, "amount")} /> : formatChfAmount(row.amount)}
        </td>
        <td className="px-2 py-2.5 text-xs text-[#475569]">{showMeta ? STATUS_LABEL[entry.status] || entry.status : ""}</td>
        <td className="truncate px-2 py-2.5 text-xs text-[#94A3B8]" title={sourceLabel(entry.source_type)}>{showMeta ? sourceLabel(entry.source_type) : ""}</td>
        <td className="truncate px-2 py-2.5 text-xs text-[#64748B]">
          {showMeta && editable ? <input data-field="remark" className={cell} value={edit.remark} onClick={(event) => event.stopPropagation()} onChange={(event) => onChange({ ...edit, remark: event.target.value })} onKeyDown={(event) => keyDown(event, "remark")} /> : showMeta ? entry.party_name || "" : ""}
        </td>
        <td className="whitespace-nowrap px-2 py-2.5 text-xs" onClick={(event) => event.stopPropagation()}>
          {showMeta ? (
            <label className="cursor-pointer" title={files.map((file) => file.file_name || "Pièce").join(", ") || "Ajouter un justificatif"}>
              <span className={files.length ? "text-[#0F172A]" : "text-[#CBD5E1]"}>📎</span>
              <input type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); }} />
            </label>
          ) : null}
          {showMeta && entry.status === "pending" ? <button type="button" className="ml-2 font-semibold text-[#1A23FF]" aria-label="Valider" onClick={onValidate}>✓</button> : null}
        </td>
      </tr>
      {onAddLine ? (
        <tr><td colSpan={12} className="bg-[#F7F9FC] px-8 py-1.5"><button type="button" className="text-xs font-medium text-[#1A23FF]" onClick={onAddLine}>+ Ajouter une ligne à cette écriture</button></td></tr>
      ) : null}
    </>
  );
}

function AccountPicker({
  accounts,
  value,
  field,
  onChange,
  onSave,
}: {
  accounts: Account[];
  value: string;
  field: JournalField;
  onChange: (id: string) => void;
  onSave: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = accounts.find((account) => account.id === value);
  const matches = accounts.filter((account) => `${account.number} ${account.name}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  return (
    <div className="relative">
      <input
        data-field={field}
        className={`${cell} font-mono`}
        value={open ? query : (selected ? `${selected.number} ${selected.name}` : "")}
        placeholder="Compte"
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => moveField(event, field, onSave)}
      />
      {open ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-64 overflow-auto rounded-lg border border-[#E2E8F0] bg-white shadow">
          {matches.map((account) => (
            <li key={account.id}>
              <button type="button" className="block w-full px-2 py-1 text-left font-mono text-xs hover:bg-[#F8FAFC]" onMouseDown={() => { onChange(account.id); setOpen(false); }}>
                {account.number} — {account.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AccountCell({ account }: { account?: Account }) {
  if (!account) return <span className="text-[#CBD5E1]">—</span>;
  return (
    <span className="flex min-w-0 items-baseline gap-2" title={`${account.number} ${account.name}`}>
      <span className="w-12 shrink-0 font-mono text-[13px] font-semibold tabular-nums text-[#0F172A]">{account.number}</span>
      <span className="truncate text-[13px] text-[#334155]">{account.name}</span>
    </span>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</span>
      {children}
    </label>
  );
}

const filter = "h-8 w-full rounded-md border border-[#D6DEE8] bg-white px-2 text-xs text-[#0F172A] outline-none focus:border-[#1A23FF]";
const cell = "w-full min-w-0 rounded border border-[#D6DEE8] bg-white px-1.5 py-1 outline-none focus:border-[#1A23FF] focus:ring-2 focus:ring-[#1A23FF]/20";

function GroupRows({ children }: { children: ReactNode }) {
  return <>{children}</>;
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
  const financial = accounts.filter((account) => isFinancialSystemCode(account.systemCode));
  const categories = accounts.filter((account) => item.direction === "out" ? account.accountType === "expense" : account.accountType === "revenue");
  return (
    <tr className="border-b border-[#F1F5F9] bg-amber-50/40">
      <td />
      <td className="px-2 py-1 tabular-nums">{formatSwissDate(item.entry_date)}</td>
      <td className="px-2 py-1 text-[#94A3B8]">—</td>
      <td />
      <td className="px-2 py-1">{item.party_name || item.description}</td>
      <td className="px-2 py-1">
        {canWrite ? (
          <select className={cell} value={financialCode} onChange={(event) => setFinancialCode(event.target.value)} aria-label="Compte financier">
            <option value="">Compte</option>
            {financial.map((account) => <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>)}
          </select>
        ) : null}
      </td>
      <td className="px-2 py-1">
        {canWrite ? (
          <select className={cell} value={categoryCode} onChange={(event) => setCategoryCode(event.target.value)} aria-label="Catégorie">
            <option value="">Compte</option>
            {categories.map((account) => <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>)}
          </select>
        ) : null}
      </td>
      <td className="px-2 py-1 text-right tabular-nums">{formatChfAmount(Number(item.amount))}</td>
      <td className="px-2 py-1 text-xs">{STATUS_LABEL[item.status] || "À vérifier"}</td>
      <td className="px-2 py-1 text-[11px] text-[#94A3B8]">{sourceLabel(item.source_type)}</td>
      <td />
      <td className="px-2 py-1">
        {canWrite ? <button type="button" className="text-xs font-semibold text-[#1A23FF]" onClick={() => void onAct({ action: "confirm", inboxId: item.id, financialAccountCode: financialCode, categoryCode })}>Proposer</button> : null}
      </td>
    </tr>
  );
}
