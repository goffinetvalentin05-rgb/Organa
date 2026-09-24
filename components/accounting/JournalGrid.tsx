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
      piece: entry.reference || (entry.source_type === "opening" ? `OUV-${entry.entry_number}` : ""),
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
    if (canEditJournalEntry(entry.status)) return;
    setCorrecting(entry.id);
    setNotice("Cette écriture est validée. Créer une correction ?");
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
      <div className="overflow-hidden rounded-xl border border-[rgba(15,23,42,0.08)] bg-white">
        <div className="flex flex-wrap gap-1.5 border-b border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <input className={filter} placeholder="Recherche" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className={filter} value={periodId} onChange={(event) => setPeriodId(event.target.value)}>
            <option value="all">Exercice</option>
            {periods.map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}
          </select>
          <input className={filter} type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Du" />
          <input className={filter} type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Au" />
          <select className={filter} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Toutes</option>
            <option value="pending">À vérifier</option>
            <option value="validated">Validées</option>
            <option value="reversed">Extournées</option>
          </select>
          <select className={filter} value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            <option value="">Compte</option>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.number} {account.name}</option>)}
          </select>
          <select className={filter} value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="all">Source</option>
            {[...new Set(entries.map((entry) => entry.source_type))].map((item) => <option key={item} value={item}>{sourceLabel(item)}</option>)}
          </select>
        </div>
        <div className="max-h-[calc(100vh-16rem)] overflow-auto">
          <table className="min-w-[1180px] w-full border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 bg-white text-[11px] uppercase tracking-wide text-[#64748B]">
              <tr className="border-b border-[#E2E8F0]">
                <th className="w-8 px-2 py-2" />
                {["Date", "N°", "Pièce", "Libellé", "Débit", "Crédit", "Montant", "Statut", "Source", "Remarque", ""].map((label) => (
                  <th key={label} className={`px-2 py-2 font-semibold ${label === "Montant" ? "text-right" : ""}`}>{label}</th>
                ))}
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
                    editable={editable}
                    correcting={correcting === entry.id}
                    onToggle={() => setSelected(selected.includes(entry.id) ? selected.filter((id) => id !== entry.id) : [...selected, entry.id])}
                    onValidate={() => void onAct({ action: "validate", entryId: entry.id })}
                    onLocked={() => askCorrection(entry)}
                    onCorrect={() => void onAct({ action: "correct", entryId: entry.id })}
                    onChange={(next) => patchEdit(entry, rows, next)}
                    onSave={() => void saveEntry(entry, rows)}
                    onCancel={() => setEdits((current) => {
                      const next = { ...current };
                      delete next[entry.id];
                      return next;
                    })}
                    onAddLine={editable && row.groupIndex === rows.length - 1 ? () => addDraft(entry.id) : undefined}
                    onUpload={(file) => void upload(entry.id, file)}
                  />
                    ))}
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
  correcting,
  onToggle,
  onValidate,
  onLocked,
  onCorrect,
  onChange,
  onSave,
  onCancel,
  onAddLine,
  onUpload,
}: {
  entry: Entry;
  row: JournalVisualRow;
  edit: EntryEdit;
  accounts: Account[];
  files: Attachment[];
  selected: boolean;
  showMeta: boolean;
  editable: boolean;
  correcting: boolean;
  onToggle: () => void;
  onValidate: () => void;
  onLocked: () => void;
  onCorrect: () => void;
  onChange: (edit: EntryEdit) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddLine?: () => void;
  onUpload: (file: File) => void;
}) {
  const line = edit.rows[row.groupIndex] || { debitId: "", creditId: "", amount: "" };
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
      <tr className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] ${row.groupSize > 1 ? "shadow-[inset_3px_0_0_#E2E8F0]" : ""}`} onClick={editable ? undefined : onLocked}>
        <td className="px-2">{showMeta && entry.status === "pending" ? <input type="checkbox" checked={selected} onChange={onToggle} aria-label="Sélectionner" /> : null}</td>
        <td className="whitespace-nowrap px-2 py-1 tabular-nums">
          {showMeta && editable ? <input data-field="date" className={cell} type="date" value={edit.date} onChange={(event) => onChange({ ...edit, date: event.target.value })} onKeyDown={(event) => keyDown(event, "date")} /> : showMeta ? formatSwissDate(entry.entry_date) : ""}
        </td>
        <td className="px-2 py-1 tabular-nums text-[#64748B]">{showMeta ? entry.entry_number : ""}</td>
        <td className="px-2 py-1">
          {showMeta && editable ? <input data-field="piece" className={cell} value={edit.piece} onChange={(event) => onChange({ ...edit, piece: event.target.value })} onKeyDown={(event) => keyDown(event, "piece")} /> : showMeta ? (entry.reference || (entry.source_type === "opening" ? `OUV-${entry.entry_number}` : "")) : ""}
        </td>
        <td className="px-2 py-1">
          {showMeta && editable ? <input data-field="label" className={cell} value={edit.label} onChange={(event) => onChange({ ...edit, label: event.target.value })} onKeyDown={(event) => keyDown(event, "label")} /> : showMeta ? entry.description : ""}
          {row.groupSize > 1 && row.groupIndex === 0 ? <span className="ml-2 text-[10px] uppercase tracking-wide text-[#94A3B8]">composée</span> : null}
        </td>
        <td className="px-2 py-1 font-mono text-[12px]">
          {editable ? <AccountPicker field="debit" accounts={accounts} value={line.debitId} onChange={(debitId) => setRow({ debitId })} onSave={onSave} /> : debit ? `${debit.number} ${debit.name}` : ""}
        </td>
        <td className="px-2 py-1 font-mono text-[12px]">
          {editable ? <AccountPicker field="credit" accounts={accounts} value={line.creditId} onChange={(creditId) => setRow({ creditId })} onSave={onSave} /> : credit ? `${credit.number} ${credit.name}` : ""}
        </td>
        <td className="px-2 py-1 text-right tabular-nums">
          {editable ? <input data-field="amount" className={`${cell} text-right`} value={line.amount} onChange={(event) => setRow({ amount: event.target.value })} onKeyDown={(event) => keyDown(event, "amount")} /> : formatChfAmount(row.amount)}
        </td>
        <td className="px-2 py-1 text-xs text-[#475569]">{showMeta ? STATUS_LABEL[entry.status] || entry.status : ""}</td>
        <td className="px-2 py-1 text-[11px] text-[#94A3B8]" title={sourceLabel(entry.source_type)}>{showMeta ? sourceLabel(entry.source_type) : ""}</td>
        <td className="px-2 py-1 text-xs">
          {showMeta && editable ? <input data-field="remark" className={cell} value={edit.remark} onChange={(event) => onChange({ ...edit, remark: event.target.value })} onKeyDown={(event) => keyDown(event, "remark")} /> : showMeta ? entry.party_name || "" : ""}
        </td>
        <td className="whitespace-nowrap px-2 py-1 text-xs">
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
        <tr><td colSpan={12} className="px-8 py-1"><button type="button" className="text-xs text-[#1A23FF]" onClick={onAddLine}>+ Ajouter une ligne à cette écriture</button></td></tr>
      ) : null}
      {correcting && showMeta ? (
        <tr><td colSpan={12} className="bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#334155]">Cette écriture est validée. <button type="button" className="font-semibold text-[#1A23FF]" onClick={onCorrect}>Créer une correction</button></td></tr>
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

const filter = "rounded-md border border-[rgba(15,23,42,0.1)] bg-white px-2 py-1 text-xs";
const cell = "w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 outline-none focus:border-[#1A23FF] focus:bg-white";

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
