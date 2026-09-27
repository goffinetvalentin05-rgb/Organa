"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import ButtonSpinner from "@/components/ui/ButtonSpinner";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { isFinancialSystemCode } from "@/lib/accounting/financialAccounts";
import { parseChfInput } from "@/lib/accounting/onboarding";
import {
  draftIssues,
  journalEditMaterial,
  journalImbalance,
  journalLinesBalanced,
  journalLockReason,
  linkedJournalEntryId,
  nextJournalField,
  rowsToLines,
  toJournalRows,
  type JournalField,
  type JournalVisualRow,
} from "@/lib/accounting/journalGrid";
import { sourceLabel } from "@/lib/accounting/sources";
import AccountingModal from "./AccountingModal";
import { STATUS_LABEL, type Account, type Entry, type InboxItem, type JournalLine, type Period } from "./model";

type EditorLine = { localId: string; debitId: string; creditId: string; amount: string };

type Composer = {
  mode: "create" | "edit";
  entryId?: string;
  date: string;
  number: string;
  piece: string;
  label: string;
  remark: string;
  status: string;
  idempotencyKey: string;
  lines: EditorLine[];
};

type Origin = {
  date: string;
  reference: string;
  previousStatus: string;
  linked: boolean;
  rows: Array<{ debitAccountId: string | null; creditAccountId: string | null; amount: number }>;
};

function readError(result: unknown): string | null {
  if (!result || typeof result !== "object") return "Action impossible";
  if ("error" in result && (result as { error?: unknown }).error) return String((result as { error: unknown }).error);
  return null;
}

function blankLine(): EditorLine {
  return { localId: crypto.randomUUID(), debitId: "", creditId: "", amount: "" };
}

export default function JournalGrid({
  entries,
  accounts,
  linesByEntry,
  periods,
  inbox,
  reviewOnly,
  canWrite,
  onAct,
}: {
  entries: Entry[];
  accounts: Account[];
  linesByEntry: Record<string, JournalLine[]>;
  periods: Period[];
  attachments: unknown;
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
  const [composer, setComposer] = useState<Composer | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [voiding, setVoiding] = useState<Entry | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const busyRef = useRef(false);
  const activeAccounts = accounts.filter((account) => account.isActive);

  const visibleEntries = entries.filter((entry) => {
    if (entry.status === "voided") return false;
    if (status !== "all" && entry.status !== status) return false;
    if (from && entry.entry_date < from) return false;
    if (to && entry.entry_date > to) return false;
    if (periodId !== "all" && entry.period_id !== periodId) return false;
    if (source !== "all" && entry.source_type !== source) return false;
    if (accountId && !(linesByEntry[entry.id] || []).some((line) => line.accountId === accountId)) return false;
    const blob = `${entry.description} ${entry.party_name || ""} ${entry.reference || ""} ${entry.entry_number}`.toLowerCase();
    return blob.includes(query.trim().toLowerCase());
  }).sort((a, b) => {
    if (a.entry_date !== b.entry_date) return a.entry_date < b.entry_date ? 1 : -1;
    return b.entry_number - a.entry_number;
  });

  const groups = useMemo(() => visibleEntries.map((entry) => ({
    entry,
    rows: toJournalRows(entry.id, linesByEntry[entry.id] || []),
  })), [linesByEntry, visibleEntries]);

  function periodStatus(entry: Entry): string | null {
    return periods.find((period) => period.id === entry.period_id)?.status ?? null;
  }

  function startPending(key: string): boolean {
    if (busyRef.current) return false;
    busyRef.current = true;
    setPending(key);
    return true;
  }

  function stopPending() {
    busyRef.current = false;
    setPending(null);
  }

  function openNewEntry() {
    if (composer?.mode === "edit") {
      setNotice("Enregistrez ou annulez la modification en cours.");
      document.getElementById("journal-composer")?.scrollIntoView({ block: "nearest" });
      return;
    }
    if (composer) {
      document.getElementById("journal-composer")?.scrollIntoView({ block: "nearest" });
      document.querySelector<HTMLElement>("#journal-composer [data-field='label']")?.focus();
      return;
    }
    setComposerError(null);
    setNotice(null);
    setOrigin(null);
    setComposer({
      mode: "create",
      date: new Date().toISOString().slice(0, 10),
      number: "",
      piece: "",
      label: "",
      remark: "",
      status: "pending",
      idempotencyKey: `journal:${crypto.randomUUID()}`,
      lines: [blankLine()],
    });
  }

  function openEdit(entry: Entry, rows: JournalVisualRow[]) {
    const lock = journalLockReason(entry.status, periodStatus(entry));
    if (lock) {
      setNotice(lock);
      return;
    }
    if (composer?.mode === "create") {
      setNotice("Enregistrez ou annulez la nouvelle écriture avant d’en modifier une autre.");
      document.getElementById("journal-composer")?.scrollIntoView({ block: "nearest" });
      return;
    }
    setComposerError(null);
    setNotice(null);
    setOrigin({
      date: entry.entry_date,
      reference: entry.reference || "",
      previousStatus: entry.status,
      linked: Boolean(linkedJournalEntryId(entry)),
      rows: rows.map((row) => ({
        debitAccountId: row.debitAccountId,
        creditAccountId: row.creditAccountId,
        amount: row.amount,
      })),
    });
    setComposer({
      mode: "edit",
      entryId: entry.id,
      date: entry.entry_date,
      number: String(entry.entry_number),
      piece: entry.reference || "",
      label: entry.description,
      remark: entry.party_name || "",
      status: entry.status === "pending" ? "pending" : "validated",
      idempotencyKey: "",
      lines: rows.map((row) => ({
        localId: row.key,
        debitId: row.debitAccountId || "",
        creditId: row.creditAccountId || "",
        amount: row.amount.toFixed(2),
      })),
    });
    window.setTimeout(() => document.getElementById("journal-composer")?.scrollIntoView({ block: "nearest" }), 0);
  }

  async function saveComposer() {
    if (!composer || !startPending("save")) return;
    try {
      const visual = composer.lines.map((line) => ({
        debitAccountId: line.debitId || null,
        creditAccountId: line.creditId || null,
        amount: parseChfInput(line.amount) || 0,
      }));
      if (composer.mode === "create") {
        const issues = draftIssues({
          date: composer.date,
          label: composer.label,
          lines: visual.map((line) => ({
            debitAccountId: line.debitAccountId || "",
            creditAccountId: line.creditAccountId || "",
            amount: line.amount,
          })),
        });
        if (issues.length) {
          setComposerError(issues[0]);
          return;
        }
      } else {
        const lines = rowsToLines(visual);
        const gap = journalImbalance(lines);
        if (!journalLinesBalanced(lines)) {
          setComposerError(gap === 0 ? "L’écriture doit être équilibrée avant d’être enregistrée." : `Écart : ${formatChfAmount(Math.abs(gap))}`);
          return;
        }
        if (!composer.label.trim()) {
          setComposerError("Indiquez le libellé.");
          return;
        }
      }
      const material = composer.mode === "edit" && origin
        ? journalEditMaterial(origin, { date: composer.date, reference: composer.piece, rows: visual })
        : false;
      const result = await onAct({
        action: "journal-save",
        entryId: composer.entryId,
        date: composer.date,
        description: composer.label,
        reference: composer.piece,
        remark: composer.remark,
        entryNumber: composer.mode === "edit" ? Number(composer.number) || undefined : undefined,
        status: composer.mode === "create" ? "pending" : composer.status,
        material,
        idempotencyKey: composer.mode === "create" ? composer.idempotencyKey : undefined,
        lines: rowsToLines(visual),
      });
      const message = readError(result);
      if (message) {
        setComposerError(message);
        return;
      }
      setComposer(null);
      setOrigin(null);
      setComposerError(null);
      setNotice(composer.mode === "create" ? "Écriture enregistrée." : "Écriture mise à jour. Les soldes et les rapports suivent les écritures vérifiées.");
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Action impossible");
    } finally {
      stopPending();
    }
  }

  async function confirmVoid() {
    if (!voiding || !startPending("void")) return;
    const entry = voiding;
    try {
      const result = await onAct({ action: "journal-void", entryId: entry.id });
      const message = readError(result);
      if (message) {
        setNotice(message);
        return;
      }
      if (composer?.entryId === entry.id) {
        setComposer(null);
        setOrigin(null);
      }
      setVoiding(null);
      setNotice("Écriture retirée du journal. Les soldes et les rapports ont été recalculés.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      stopPending();
    }
  }

  const createKey = composer?.mode === "create" ? composer.idempotencyKey : "";
  useEffect(() => {
    if (!createKey) return;
    document.getElementById("journal-composer")?.querySelector<HTMLElement>("[data-field='label']")?.focus();
  }, [createKey]);

  const materialNow = composer?.mode === "edit" && origin
    ? journalEditMaterial(origin, {
      date: composer.date,
      reference: composer.piece,
      rows: composer.lines.map((line) => ({
        debitAccountId: line.debitId || null,
        creditAccountId: line.creditId || null,
        amount: parseChfInput(line.amount) || 0,
      })),
    })
    : false;
  const showInbox = status === "all" || status === "pending";
  const saving = pending === "save";
  const voidingBusy = pending === "void";

  return (
    <div className={fullscreen ? "fixed inset-0 z-40 overflow-auto bg-[#F4F7FB] p-4" : ""}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {canWrite ? (
            <ToolButton label="Ouvrir le formulaire d’écriture" onClick={openNewEntry} disabled={pending !== null}>
              Nouvelle écriture
            </ToolButton>
          ) : null}
          <ToolButton label={fullscreen ? "Revenir à l’écran du module" : "Afficher le journal sur tout l’écran"} onClick={() => setFullscreen((value) => !value)}>
            {fullscreen ? "Quitter le plein écran" : "Plein écran"}
          </ToolButton>
        </div>
        {notice ? <p className="text-sm text-[#334155]">{notice}</p> : null}
        <section className="rounded-xl border border-[#D6DEE8] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-4 xl:grid-cols-7">
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
                <option value="validated">Vérifiées</option>
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
        </section>
        {composer ? (
          <EntryComposer
            composer={composer}
            accounts={activeAccounts}
            error={composerError}
            saving={saving}
            locked={pending !== null}
            materialNote={materialNow && origin && origin.previousStatus !== "pending"
              ? "Un montant, un compte ou la date a changé. L’écriture repasse à vérifier et sort des rapports officiels jusqu’à une nouvelle vérification."
              : null}
            linkedNote={origin?.linked
              ? "Cette écriture est liée à une extourne. À l’enregistrement, l’extourne est retirée du journal pour que les soldes suivent cette version."
              : null}
            onChange={(next) => { setComposer(next); setComposerError(null); }}
            onAddLine={() => setComposer({ ...composer, lines: [...composer.lines, blankLine()] })}
            onRemoveLine={(localId) => setComposer({ ...composer, lines: composer.lines.filter((line) => line.localId !== localId) })}
            onSave={() => void saveComposer()}
            onCancel={() => { if (pending) return; setComposer(null); setOrigin(null); setComposerError(null); }}
          />
        ) : null}
        <div className="overflow-hidden rounded-xl border border-[#D6DEE8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="max-h-[calc(100vh-16rem)] overflow-auto">
            <table className="w-full min-w-[1180px] table-fixed border-collapse text-left text-[13px] text-[#0F172A]">
              <colgroup>
                <col className="w-[7.25rem]" />
                <col className="w-16" />
                <col className="w-24" />
                <col />
                <col className="w-[13.5rem]" />
                <col className="w-[13.5rem]" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-44" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]">
                <tr className="border-b border-[#E2E8F0]">
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-2 py-3 font-semibold" title="Numéro de l’écriture dans le journal">N° écr.</th>
                  <th className="px-2 py-3 font-semibold" title="Référence du document">Pièce</th>
                  <th className="px-3 py-3 font-semibold">Libellé</th>
                  <th className="px-3 py-3 font-semibold">Débit</th>
                  <th className="px-3 py-3 font-semibold">Crédit</th>
                  <th className="px-3 py-3 text-right font-semibold">Montant</th>
                  <th className="px-2 py-3 font-semibold">Remarque</th>
                  <th className="px-2 py-3 font-semibold">Source</th>
                  <th className="px-2 py-3 font-semibold">Statut</th>
                  <th className="px-2 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {showInbox ? inbox.map((item) => (
                  <InboxRow key={item.id} item={item} accounts={activeAccounts} canWrite={canWrite} pending={pending} onAct={onAct} startPending={startPending} stopPending={stopPending} />
                )) : null}
                {groups.map(({ entry, rows }) => {
                  const lock = journalLockReason(entry.status, periodStatus(entry));
                  const total = rows.reduce((sum, item) => sum + item.amount, 0);
                  const linked = entries.find((item) => item.id === linkedJournalEntryId(entry));
                  return rows.map((row) => {
                    const showMeta = row.groupIndex === 0;
                    const debit = accounts.find((account) => account.id === row.debitAccountId);
                    const credit = accounts.find((account) => account.id === row.creditAccountId);
                    const last = row.groupIndex === rows.length - 1;
                    return (
                      <tr
                        key={row.key}
                        data-entry-id={showMeta ? entry.id : undefined}
                        className={`border-b ${last ? "border-[#E2E8F0]" : "border-[#F4F7FB]"} ${composer?.entryId === entry.id ? "bg-[#F8FAFC]" : "bg-white"} hover:bg-[#F8FAFC]`}
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-[#334155]">{showMeta ? formatSwissDate(entry.entry_date) : ""}</td>
                        <td className="px-2 py-2.5 font-medium tabular-nums text-[#475569]">{showMeta ? entry.entry_number : ""}</td>
                        <td className="px-2 py-2.5 text-[#334155]">{showMeta ? (entry.reference || "—") : ""}</td>
                        <td className={`truncate px-3 py-2.5 ${showMeta ? "font-medium" : "text-[#64748B]"}`}>
                          {showMeta ? entry.description : "même écriture"}
                          {showMeta && rows.length > 1 ? <span className="ml-2 text-[11px] font-medium text-[#94A3B8]">{rows.length} lignes</span> : null}
                        </td>
                        <td className="px-3 py-2.5"><AccountCell account={debit} /></td>
                        <td className="px-3 py-2.5"><AccountCell account={credit} /></td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                          {formatChfAmount(row.amount)}
                          {last && rows.length > 1 ? <span className="mt-1 block text-[11px] font-normal text-[#64748B]">Total {formatChfAmount(total)}</span> : null}
                        </td>
                        <td className="truncate px-2 py-2.5 text-xs text-[#64748B]">{showMeta ? entry.party_name || "" : ""}</td>
                        <td className="truncate px-2 py-2.5 text-xs text-[#94A3B8]" title={sourceLabel(entry.source_type)}>{showMeta ? sourceLabel(entry.source_type) : ""}</td>
                        <td className="px-2 py-2.5 text-xs text-[#475569]">{showMeta ? STATUS_LABEL[entry.status] || entry.status : ""}</td>
                        <td className="px-2 py-2 align-top">
                          {showMeta && canWrite ? (
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className={rowAction}
                                  disabled={Boolean(lock) || pending !== null}
                                  title={lock || "Modifier l’écriture entière"}
                                  onClick={() => openEdit(entry, rows)}
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  className={rowDanger}
                                  disabled={Boolean(lock) || pending !== null}
                                  title={lock || "Supprimer l’écriture entière"}
                                  onClick={() => { setNotice(null); setVoiding(entry); }}
                                >
                                  Supprimer
                                </button>
                              </div>
                              {lock ? <p className="max-w-[14rem] text-[11px] leading-snug text-[#64748B]">{lock}</p> : null}
                              {linked && !lock ? <p className="max-w-[14rem] text-[11px] leading-snug text-[#94A3B8]">Liée à l’écriture {linked.entry_number}</p> : null}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    );
                  });
                })}
                {groups.length === 0 && (!showInbox || inbox.length === 0) ? (
                  <tr><td colSpan={11} className="px-3 py-8 text-sm text-[#64748B]">Aucune écriture pour ces filtres.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {voiding ? (
        <AccountingModal title="Supprimer cette écriture ?" onClose={() => { if (!voidingBusy) setVoiding(null); }}>
          <p className="text-sm leading-relaxed text-[#334155]">{deleteCopy(voiding, Boolean(linkedJournalEntryId(voiding)))}</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={quietBtn} disabled={voidingBusy} onClick={() => setVoiding(null)}>Annuler</button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              aria-busy={voidingBusy || undefined}
              disabled={voidingBusy}
              onPointerDown={(event) => { event.currentTarget.dataset.busy = "true"; }}
              onClick={() => void confirmVoid()}
            >
              {voidingBusy ? <ButtonSpinner className="h-3.5 w-3.5" /> : null}
              {voidingBusy ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </AccountingModal>
      ) : null}
    </div>
  );
}

function deleteCopy(entry: Entry, linked: boolean): string {
  const opening = entry.source_type === "opening" || entry.event_type === "opening";
  const parts = [
    opening
      ? "L’écriture d’ouverture sera retirée en entier, avec toutes ses lignes."
      : "L’écriture sera retirée en entier, avec toutes ses lignes.",
  ];
  if (linked) {
    parts.push("Elle est liée à une extourne : les deux quittent le journal ensemble, pour que les soldes restent justes.");
  } else if (entry.source_type !== "manual" && entry.source_type !== "manual_accounting" && entry.source_type !== "opening") {
    parts.push("Le document d’origine dans Obillz n’est pas annulé.");
  }
  parts.push("Les soldes et les rapports sont recalculés. L’historique d’audit est conservé.");
  return parts.join(" ");
}

function EntryComposer({
  composer,
  accounts,
  error,
  saving,
  locked,
  materialNote,
  linkedNote,
  onChange,
  onAddLine,
  onRemoveLine,
  onSave,
  onCancel,
}: {
  composer: Composer;
  accounts: Account[];
  error: string | null;
  saving: boolean;
  locked: boolean;
  materialNote: string | null;
  linkedNote: string | null;
  onChange: (composer: Composer) => void;
  onAddLine: () => void;
  onRemoveLine: (localId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function setLine(localId: string, patch: Partial<EditorLine>) {
    onChange({ ...composer, lines: composer.lines.map((line) => line.localId === localId ? { ...line, ...patch } : line) });
  }
  function keyDown(event: KeyboardEvent<HTMLElement>, field: JournalField) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onSave();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Enter" || event.target instanceof HTMLTextAreaElement) return;
    const next = nextJournalField(field);
    if (next === "next-row") return;
    event.preventDefault();
    document.querySelector<HTMLElement>(`#journal-composer [data-field="${next}"]`)?.focus();
  }
  const title = composer.mode === "create" ? "Nouvelle écriture" : `Modifier l’écriture ${composer.number}`;
  return (
    <section id="journal-composer" className="rounded-xl border border-[#D6DEE8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
        <p className="text-xs text-[#64748B]">{composer.mode === "create" ? "Brouillon, visible seulement ici tant qu’il n’est pas enregistré." : "Toutes les lignes de cette écriture sont modifiées ensemble."}</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Date">
          <input data-field="date" className={editor} type="date" value={composer.date} disabled={locked} onChange={(event) => onChange({ ...composer, date: event.target.value })} onKeyDown={(event) => keyDown(event, "date")} />
        </Field>
        <Field label="Pièce">
          <input data-field="piece" className={editor} value={composer.piece} placeholder="Référence" disabled={locked} onChange={(event) => onChange({ ...composer, piece: event.target.value })} onKeyDown={(event) => keyDown(event, "piece")} />
        </Field>
        <Field label="Libellé">
          <input data-field="label" className={editor} value={composer.label} placeholder="Libellé de l’écriture" disabled={locked} onChange={(event) => onChange({ ...composer, label: event.target.value })} onKeyDown={(event) => keyDown(event, "label")} />
        </Field>
        <Field label="Remarque">
          <input data-field="remark" className={editor} value={composer.remark} placeholder="Remarque" disabled={locked} onChange={(event) => onChange({ ...composer, remark: event.target.value })} onKeyDown={(event) => keyDown(event, "remark")} />
        </Field>
      </div>
      {composer.mode === "edit" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
          <Field label="N° d’écriture">
            <input className={editor} value={composer.number} disabled={locked} onChange={(event) => onChange({ ...composer, number: event.target.value })} />
          </Field>
          <Field label="Statut">
            <select className={editor} value={composer.status === "validated" ? "validated" : "pending"} disabled={locked} onChange={(event) => onChange({ ...composer, status: event.target.value })}>
              <option value="pending">À vérifier</option>
              <option value="validated">Vérifiée</option>
            </select>
          </Field>
        </div>
      ) : null}
      <div className="mt-5 space-y-3">
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem_2.5rem] gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748B] sm:grid">
          <span>Débit</span>
          <span>Crédit</span>
          <span className="text-right">Montant</span>
          <span />
        </div>
        {composer.lines.map((line, index) => (
          <div key={line.localId} className="grid gap-3 border-t border-[#F1F5F9] pt-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem_2.5rem] sm:border-0 sm:pt-0">
            <AccountPicker field="debit" accounts={accounts} value={line.debitId} disabled={locked} onChange={(debitId) => setLine(line.localId, { debitId })} />
            <AccountPicker field="credit" accounts={accounts} value={line.creditId} disabled={locked} onChange={(creditId) => setLine(line.localId, { creditId })} />
            <input
              data-field={index === 0 ? "amount" : undefined}
              className={`${editor} text-right tabular-nums`}
              value={line.amount}
              placeholder="0.00"
              inputMode="decimal"
              disabled={locked}
              aria-label={`Montant ligne ${index + 1}`}
              onChange={(event) => setLine(line.localId, { amount: event.target.value })}
              onKeyDown={(event) => keyDown(event, "amount")}
            />
            <button type="button" className="h-10 text-xs text-[#64748B] hover:text-[#0F172A] disabled:opacity-40" disabled={locked || composer.lines.length === 1} onClick={() => onRemoveLine(line.localId)} aria-label="Retirer la ligne">
              {composer.lines.length > 1 ? "Retirer" : ""}
            </button>
          </div>
        ))}
      </div>
      {linkedNote ? <p className="mt-4 text-sm leading-relaxed text-[#475569]">{linkedNote}</p> : null}
      {materialNote ? <p className="mt-2 text-sm leading-relaxed text-[#475569]">{materialNote}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="text-sm font-medium text-[#1A23FF] disabled:opacity-40" disabled={locked} onClick={onAddLine}>Ajouter une ligne</button>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className={quietBtn} disabled={locked} onClick={onCancel}>Annuler</button>
          <button
            type="button"
            className={primaryBtn}
            disabled={locked}
            aria-busy={saving || undefined}
            data-busy={saving ? "true" : undefined}
            onPointerDown={(event) => {
              if (locked) return;
              event.currentTarget.dataset.busy = "true";
            }}
            onClick={onSave}
          >
            {saving ? <ButtonSpinner className="h-4 w-4" /> : null}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </section>
  );
}

function AccountPicker({
  accounts,
  value,
  field,
  disabled,
  onChange,
}: {
  accounts: Account[];
  value: string;
  field: JournalField;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = accounts.find((account) => account.id === value);
  const matches = accounts.filter((account) => `${account.number} ${account.name}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  return (
    <div className="relative">
      <input
        data-field={field}
        className={`${editor} font-mono`}
        value={open ? query : (selected ? `${selected.number} ${selected.name}` : "")}
        placeholder="Compte"
        disabled={disabled}
        autoComplete="off"
        aria-label={field === "debit" ? "Compte au débit" : "Compte au crédit"}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full min-w-[16rem] overflow-auto rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
          {matches.map((account) => (
            <li key={account.id}>
              <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-[#F8FAFC]" onMouseDown={() => { onChange(account.id); setOpen(false); }}>
                <span className="font-mono font-semibold">{account.number}</span>
                <span className="ml-2 text-[#334155]">{account.name}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 ? <li className="px-3 py-2 text-sm text-[#94A3B8]">Aucun compte</li> : null}
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
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</span>
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</span>
      {children}
    </label>
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className="inline-flex h-9 items-center rounded-lg border border-[#D6DEE8] bg-white px-3 text-sm font-medium text-[#0F172A] transition hover:bg-[#F8FAFC] active:scale-[0.98] active:bg-[#EEF2F6] disabled:opacity-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function InboxRow({
  item,
  accounts,
  canWrite,
  pending,
  onAct,
  startPending,
  stopPending,
}: {
  item: InboxItem;
  accounts: Account[];
  canWrite: boolean;
  pending: string | null;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
  startPending: (key: string) => boolean;
  stopPending: () => void;
}) {
  const [financialCode, setFinancialCode] = useState(item.financial_account_code || "");
  const [categoryCode, setCategoryCode] = useState(item.category_code || "");
  const busy = pending === `inbox:${item.id}`;
  const financial = accounts.filter((account) => isFinancialSystemCode(account.systemCode));
  const categories = accounts.filter((account) => item.direction === "out" ? account.accountType === "expense" : account.accountType === "revenue");
  return (
    <tr className="border-b border-[#F1F5F9] bg-[#FFFBF5]">
      <td className="px-3 py-2.5 tabular-nums">{formatSwissDate(item.entry_date)}</td>
      <td className="px-2 py-2.5 text-[#94A3B8]">—</td>
      <td />
      <td className="px-3 py-2.5">{item.party_name || item.description}</td>
      <td className="px-2 py-2">
        {canWrite ? (
          <select className={filter} value={financialCode} onChange={(event) => setFinancialCode(event.target.value)} aria-label="Compte financier">
            <option value="">Compte</option>
            {financial.map((account) => <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>)}
          </select>
        ) : null}
      </td>
      <td className="px-2 py-2">
        {canWrite ? (
          <select className={filter} value={categoryCode} onChange={(event) => setCategoryCode(event.target.value)} aria-label="Catégorie">
            <option value="">Compte</option>
            {categories.map((account) => <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>)}
          </select>
        ) : null}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{formatChfAmount(Number(item.amount))}</td>
      <td />
      <td className="px-2 py-2.5 text-[11px] text-[#94A3B8]">{sourceLabel(item.source_type)}</td>
      <td className="px-2 py-2.5 text-xs">{STATUS_LABEL[item.status] || "À vérifier"}</td>
      <td className="px-2 py-2">
        {canWrite ? (
          <button
            type="button"
            className={rowAction}
            disabled={pending !== null}
            aria-busy={busy || undefined}
            onPointerDown={(event) => { if (pending === null) event.currentTarget.dataset.busy = "true"; }}
            onClick={() => {
              if (!startPending(`inbox:${item.id}`)) return;
              void onAct({ action: "confirm", inboxId: item.id, financialAccountCode: financialCode, categoryCode }).finally(stopPending);
            }}
          >
            {busy ? "Envoi…" : "Proposer"}
          </button>
        ) : null}
      </td>
    </tr>
  );
}

const filter = "h-9 w-full rounded-md border border-[#D6DEE8] bg-white px-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#1A23FF] focus:ring-2 focus:ring-[#1A23FF]/15";
const editor = "h-10 w-full rounded-lg border border-[#D6DEE8] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#1A23FF] focus:ring-2 focus:ring-[#1A23FF]/15 disabled:bg-[#F8FAFC]";
const primaryBtn = "inline-flex h-10 min-w-[9.5rem] items-center justify-center gap-2 rounded-lg bg-[#1A23FF] px-4 text-sm font-semibold text-white transition active:scale-[0.98] active:bg-[#121AD6] disabled:cursor-wait disabled:opacity-70 data-[busy=true]:cursor-wait data-[busy=true]:opacity-70";
const quietBtn = "inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#475569] transition hover:bg-[#F1F5F9] active:scale-[0.98] disabled:opacity-60";
const rowAction = "inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold text-[#334155] transition hover:bg-[#F1F5F9] active:scale-[0.97] active:bg-[#E8EEF5] disabled:cursor-not-allowed disabled:opacity-40 data-[busy=true]:opacity-70";
const rowDanger = "inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 active:scale-[0.97] active:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40";
