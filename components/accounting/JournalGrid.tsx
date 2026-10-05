"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import ButtonSpinner from "@/components/ui/ButtonSpinner";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { isFinancialSystemCode } from "@/lib/accounting/financialAccounts";
import { parseChfInput } from "@/lib/accounting/onboarding";
import { entryNumberRangeError } from "@/lib/accounting/entryNumbers";
import {
  CLOSED_PERIOD_MESSAGE,
  createSaveQueue,
  draftIssues,
  draftLeaveAction,
  ENTRY_NUMBER_TAKEN,
  existingCellCommit,
  explainJournalError,
  journalComposerChanged,
  journalEditMaterial,
  journalImbalance,
  journalLinesBalanced,
  journalLockReason,
  linkedJournalEntryId,
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

type CellFeedback = {
  key: string;
  field: string;
  lineId: string;
  phase: "saving" | "saved" | "error";
};

type Origin = {
  date: string;
  number: string;
  reference: string;
  label: string;
  remark: string;
  previousStatus: string;
  linked: boolean;
  rows: Array<{ debitAccountId: string | null; creditAccountId: string | null; amount: number }>;
};

function readError(result: unknown): string | null {
  if (!result || typeof result !== "object") return "Action impossible";
  if ("error" in result && (result as { error?: unknown }).error) return String((result as { error: unknown }).error);
  return null;
}

const JOURNAL_PAGE_SIZE = 100;

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
  numberingNotice,
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
  numberingNotice?: string | null;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
  onReload: () => Promise<void>;
}) {
  const [page, setPage] = useState(0);
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
  const [feedback, setFeedback] = useState<CellFeedback | null>(null);
  const busyRef = useRef(false);
  const composerRef = useRef<Composer | null>(null);
  const originRef = useRef<Origin | null>(null);
  const editGenRef = useRef(0);
  const skipCommitRef = useRef(false);
  const draftFlightRef = useRef<Promise<boolean> | null>(null);
  const savedTimerRef = useRef<number | null>(null);
  const enqueue = useRef(createSaveQueue()).current;
  const entriesRef = useRef(entries);
  const periodsRef = useRef(periods);
  entriesRef.current = entries;
  periodsRef.current = periods;
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
  const pageCount = Math.max(1, Math.ceil(groups.length / JOURNAL_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const displayedGroups = groups.slice(currentPage * JOURNAL_PAGE_SIZE, (currentPage + 1) * JOURNAL_PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [query, status, accountId, source, periodId, from, to]);

  function periodStatus(entry: Entry): string | null {
    return periods.find((period) => period.id === entry.period_id)?.status ?? null;
  }

  function writeComposer(next: Composer | null) {
    composerRef.current = next;
    setComposer(next);
  }

  function writeOrigin(next: Origin | null) {
    originRef.current = next;
    setOrigin(next);
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

  function showSaved(next: CellFeedback) {
    setFeedback(next);
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = window.setTimeout(() => {
      setFeedback((current) => current?.phase === "saved" && current.key === next.key && current.field === next.field ? null : current);
    }, 1200);
  }

  function visualOf(current: Composer) {
    return current.lines.map((line) => ({
      debitAccountId: line.debitId || null,
      creditAccountId: line.creditId || null,
      amount: parseChfInput(line.amount) || 0,
    }));
  }

  function issuesOf(current: Composer): string[] {
    return draftIssues({
      date: current.date,
      label: current.label,
      lines: visualOf(current).map((line) => ({
        debitAccountId: line.debitAccountId || "",
        creditAccountId: line.creditAccountId || "",
        amount: line.amount,
      })),
    });
  }

  function editableStatus(status: string): string {
    return status === "pending" ? "pending" : "validated";
  }

  function changedAgainst(originSnap: Origin, current: Composer): boolean {
    return journalComposerChanged(
      {
        date: originSnap.date,
        number: originSnap.number,
        reference: originSnap.reference,
        label: originSnap.label,
        remark: originSnap.remark,
        status: editableStatus(originSnap.previousStatus),
        rows: originSnap.rows,
      },
      {
        date: current.date,
        number: current.number,
        reference: current.piece,
        label: current.label,
        remark: current.remark,
        status: editableStatus(current.status),
        rows: visualOf(current),
      }
    );
  }

  function rejectCell(key: string, field: string, lineId: string, message: string) {
    setComposerError(message);
    setFeedback({ key, field, lineId, phase: "error" });
  }

  async function commitExisting(field = "label", lineId = ""): Promise<"clean" | "saved" | "invalid"> {
    return enqueue(async () => {
      const current = composerRef.current;
      const originSnap = originRef.current;
      if (!current || current.mode !== "edit" || !originSnap || !current.entryId) return "clean";
      const visual = visualOf(current);
      const lines = rowsToLines(visual);
      const gap = journalImbalance(lines);
      const number = Number(current.number);
      const period = periodsRef.current.find((item) => current.date >= item.startsOn && current.date <= item.endsOn);
      const inPeriod = entriesRef.current.filter((item) => item.status !== "voided" && item.period_id === period?.id);
      const numberCount = inPeriod.some((item) => item.id === current.entryId) ? inPeriod.length : inPeriod.length + 1;
      const numberError = period ? entryNumberRangeError(number, numberCount) : null;
      const decision = existingCellCommit({
        changed: changedAgainst(originSnap, current),
        label: current.label,
        number,
        numberAllowed: !numberError,
        numberError,
        balanced: journalLinesBalanced(lines),
        gapLabel: gap === 0 ? null : `Écart : ${formatChfAmount(Math.abs(gap))}`,
      });
      const cell = { key: current.entryId, field, lineId: lineId || current.lines[0]?.localId || "" };
      if (decision.action === "ignore") {
        setComposerError(null);
        setFeedback((prev) => prev?.phase === "error" ? null : prev);
        return "clean";
      }
      if (decision.action === "reject") {
        rejectCell(cell.key, cell.field, cell.lineId, decision.error);
        return "invalid";
      }
      const material = journalEditMaterial(originSnap, { date: current.date, reference: current.piece, rows: visual });
      const sentStatus = material ? "pending" : editableStatus(current.status);
      setFeedback({ ...cell, phase: "saving" });
      try {
        const result = await onAct({
          action: "journal-save",
          entryId: current.entryId,
          date: current.date,
          description: current.label,
          reference: current.piece,
          remark: current.remark,
          entryNumber: number,
          status: sentStatus,
          material,
          lines,
        });
        const message = readError(result);
        if (message) {
          rejectCell(cell.key, cell.field, cell.lineId, explainJournalError(message));
          return "invalid";
        }
        const assigned = result && typeof result === "object" && "entryNumber" in result
          ? Number((result as { entryNumber?: unknown }).entryNumber)
          : number;
        const shown = Number.isInteger(assigned) && assigned > 0 ? assigned : number;
        const serverNotice = result && typeof result === "object" && "notice" in result
          ? String((result as { notice?: unknown }).notice || "")
          : "";
        if (serverNotice) setNotice(serverNotice);
        if (composerRef.current?.entryId === current.entryId) {
          const live = composerRef.current;
          const patch: Partial<Composer> = {};
          if (live.number === current.number) patch.number = String(shown);
          if (material && live.status === current.status) patch.status = "pending";
          if (patch.number !== undefined || patch.status !== undefined) writeComposer({ ...live, ...patch });
          writeOrigin({
            date: current.date,
            number: String(shown),
            reference: current.piece,
            label: current.label,
            remark: current.remark,
            previousStatus: sentStatus,
            linked: originSnap.linked,
            rows: visual,
          });
          const liveNow = composerRef.current;
          const originNow = originRef.current;
          const stillDirty = Boolean(
            liveNow && originNow && liveNow.entryId === current.entryId && changedAgainst(originNow, liveNow)
          );
          if (stillDirty) setFeedback(null);
          else {
            setComposerError(null);
            showSaved({ ...cell, phase: "saved" });
          }
        }
        return "saved";
      } catch (error) {
        rejectCell(cell.key, cell.field, cell.lineId, error instanceof Error ? error.message : "Action impossible");
        return "invalid";
      }
    });
  }

  async function commitDraft(): Promise<boolean> {
    const current = composerRef.current;
    if (!current || current.mode !== "create") return true;
    const issues = issuesOf(current);
    if (issues.length > 0) {
      rejectCell("draft", "label", current.lines[0]?.localId || "", issues[0]);
      return false;
    }
    if (draftFlightRef.current) return draftFlightRef.current;
    const snapshot = current;
    const flight = enqueue(async () => {
      if (composerRef.current?.idempotencyKey !== snapshot.idempotencyKey) return true;
      const latest = composerRef.current?.idempotencyKey === snapshot.idempotencyKey ? composerRef.current : snapshot;
      const latestIssues = issuesOf(latest);
      if (latestIssues.length > 0) {
        rejectCell("draft", "label", latest.lines[0]?.localId || "", latestIssues[0]);
        return false;
      }
      setFeedback({ key: "draft", field: "label", lineId: latest.lines[0]?.localId || "", phase: "saving" });
      try {
        const result = await onAct({
          action: "journal-save",
          date: latest.date,
          description: latest.label,
          reference: latest.piece,
          remark: latest.remark,
          status: "pending",
          material: false,
          idempotencyKey: latest.idempotencyKey,
          lines: rowsToLines(visualOf(latest)),
        });
        const message = readError(result);
        if (message) {
          rejectCell("draft", "label", latest.lines[0]?.localId || "", explainJournalError(message));
          return false;
        }
        setComposerError(null);
        showSaved({ key: "draft", field: "label", lineId: latest.lines[0]?.localId || "", phase: "saved" });
        if (composerRef.current?.idempotencyKey === latest.idempotencyKey) {
          writeComposer(null);
          writeOrigin(null);
        }
        return true;
      } catch (error) {
        rejectCell("draft", "label", latest.lines[0]?.localId || "", error instanceof Error ? error.message : "Action impossible");
        return false;
      }
    });
    draftFlightRef.current = flight;
    try {
      return await flight;
    } finally {
      if (draftFlightRef.current === flight) draftFlightRef.current = null;
    }
  }

  function focusInsideEditor(): boolean {
    const active = document.activeElement;
    return active instanceof HTMLElement && Boolean(active.closest("[data-journal-edit]"));
  }

  function scheduleCommit(field: string, lineId: string) {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }
    window.setTimeout(() => {
      const generation = editGenRef.current;
      const mode = composerRef.current?.mode;
      const entryId = composerRef.current?.entryId;
      void (async () => {
        if (mode === "create") {
          const issues = composerRef.current ? issuesOf(composerRef.current) : [];
          const action = draftLeaveAction(issues, !focusInsideEditor());
          if (action === "keep") {
            if (!focusInsideEditor() && issues[0]) setComposerError(issues[0]);
            return;
          }
          await commitDraft();
          return;
        }
        let result = await commitExisting(field, lineId);
        for (let pass = 0; pass < 4 && result !== "invalid"; pass += 1) {
          const live = composerRef.current;
          const originSnap = originRef.current;
          if (!live || live.mode !== "edit" || live.entryId !== entryId || !originSnap) break;
          if (!changedAgainst(originSnap, live)) break;
          result = await commitExisting(field, lineId);
        }
        if (editGenRef.current !== generation || composerRef.current?.entryId !== entryId) return;
        if (result === "invalid" || focusInsideEditor()) return;
        const delay = result === "saved" ? 700 : 0;
        window.setTimeout(() => {
          if (editGenRef.current !== generation || composerRef.current?.entryId !== entryId) return;
          if (focusInsideEditor()) return;
          writeComposer(null);
          writeOrigin(null);
        }, delay);
      })();
    }, 0);
  }

  function openNewEntry() {
    const generation = ++editGenRef.current;
    window.setTimeout(() => {
      void (async () => {
        if (editGenRef.current !== generation) return;
        const current = composerRef.current;
        if (current?.mode === "create") {
          document.getElementById("journal-edit")?.scrollIntoView({ block: "nearest" });
          document.querySelector<HTMLElement>("#journal-edit [data-field='label']")?.focus();
          return;
        }
        if (current?.mode === "edit") {
          const result = await commitExisting();
          if (result === "invalid" || editGenRef.current !== generation) return;
        }
        setComposerError(null);
        setNotice(null);
        setFeedback(null);
        writeOrigin(null);
        writeComposer({
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
      })();
    }, 0);
  }

  function focusJournalCell(field: string, lineIndex = 0) {
    window.setTimeout(() => {
      const row = document.querySelectorAll<HTMLElement>("[data-journal-edit]")[lineIndex];
      const target = row?.querySelector<HTMLElement>(`[data-field="${field}"]`)
        || document.querySelector<HTMLElement>(`#journal-edit [data-field="${field}"]`);
      target?.focus();
    }, 0);
  }

  function openEdit(entry: Entry, rows: JournalVisualRow[], field = "label", lineIndex = 0) {
    const lock = journalLockReason(entry.status, periodStatus(entry));
    if (lock) {
      setNotice(lock);
      return;
    }
    const generation = ++editGenRef.current;
    window.setTimeout(() => {
      void (async () => {
        if (editGenRef.current !== generation) return;
        const current = composerRef.current;
        if (current?.mode === "edit" && current.entryId === entry.id) {
          focusJournalCell(field, lineIndex);
          return;
        }
        if (current?.mode === "create") {
          const issues = issuesOf(current);
          if (draftLeaveAction(issues, true) !== "create") {
            setComposerError(issues[0] || "Complétez le brouillon ou retirez-le.");
            return;
          }
          const created = await commitDraft();
          if (!created || editGenRef.current !== generation) return;
        } else if (current?.mode === "edit") {
          const result = await commitExisting();
          if (result === "invalid" || editGenRef.current !== generation) return;
        }
        setComposerError(null);
        setNotice(null);
        setFeedback(null);
        writeOrigin({
          date: entry.entry_date,
          number: String(entry.entry_number),
          reference: entry.reference || "",
          label: entry.description,
          remark: entry.party_name || "",
          previousStatus: entry.status,
          linked: Boolean(linkedJournalEntryId(entry)),
          rows: rows.map((row) => ({
            debitAccountId: row.debitAccountId,
            creditAccountId: row.creditAccountId,
            amount: row.amount,
          })),
        });
        writeComposer({
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
        focusJournalCell(field, lineIndex);
      })();
    }, 0);
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
      if (composerRef.current?.entryId === entry.id) {
        writeComposer(null);
        writeOrigin(null);
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
    document.getElementById("journal-edit")?.querySelector<HTMLElement>("[data-field='label']")?.focus();
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
  const voidingBusy = pending === "void";

  return (
    <div className={fullscreen ? "fixed inset-0 z-40 overflow-auto bg-[#F4F7FB] p-4" : ""}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {canWrite ? (
            <ToolButton label="Ajouter une ligne de saisie dans le journal" onClick={openNewEntry} disabled={pending !== null}>
              Nouvelle écriture
            </ToolButton>
          ) : null}
          {reviewOnly && canWrite ? (
            <ToolButton label="Créer les écritures des opérations déjà complètes. Une consultation du journal ne le fait pas." onClick={() => void onAct({ action: "process-inbox" })} disabled={pending !== null}>
              Comptabiliser les opérations prêtes
            </ToolButton>
          ) : null}
          <ToolButton label={fullscreen ? "Revenir à l’écran du module" : "Afficher le journal sur tout l’écran"} onClick={() => setFullscreen((value) => !value)}>
            {fullscreen ? "Quitter le plein écran" : "Plein écran"}
          </ToolButton>
        </div>
        {canWrite ? (
          <p className="text-sm text-[#475569]">Les écritures de régularisation et transitoires se saisissent ici, dans l’exercice encore ouvert. Les comptes 1300 et 2300 servent aux actifs et passifs transitoires.</p>
        ) : null}
        {numberingNotice || notice ? (
          <p className="text-sm text-[#334155]">
            {numberingNotice || notice}
            {numberingNotice ? (
              <button type="button" className="ml-3 underline" onClick={() => void onAct({ action: "clear-numbering-notice" })}>Compris</button>
            ) : null}
          </p>
        ) : null}
        {periods.find((period) => period.id === periodId)?.status === "closed" ? (
          <p className="text-sm text-[#475569]">{CLOSED_PERIOD_MESSAGE}</p>
        ) : null}
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
                <col className="w-12" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]">
                <tr className="border-b border-[#E2E8F0]">
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-2 py-3 font-semibold" title="Numéro dans l’exercice, selon la date. Un numéro modifié à la main décale les autres.">N° écr.</th>
                  <th className="px-2 py-3 font-semibold" title="Référence du document">Pièce</th>
                  <th className="px-3 py-3 font-semibold">Libellé</th>
                  <th className="px-3 py-3 font-semibold">Débit</th>
                  <th className="px-3 py-3 font-semibold">Crédit</th>
                  <th className="px-3 py-3 text-right font-semibold">Montant</th>
                  <th className="px-2 py-3 font-semibold">Remarque</th>
                  <th className="px-2 py-3 font-semibold">Source</th>
                  <th className="px-2 py-3 font-semibold">Statut</th>
                  <th className="px-2 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {composer?.mode === "create" ? (
                  <EditingRows
                    composer={composer}
                    accounts={activeAccounts}
                    error={composerError}
                    feedback={feedback?.key === "draft" ? feedback : null}
                    locked={pending === "void"}
                    materialNote={null}
                    linkedNote={null}
                    origin={null}
                    sourceText="Saisie manuelle"
                    onChange={(next) => {
                      writeComposer(next);
                      setComposerError(null);
                      setFeedback((prev) => prev?.phase === "error" ? null : prev);
                    }}
                    onAddLine={() => {
                      const current = composerRef.current;
                      if (!current) return;
                      writeComposer({ ...current, lines: [...current.lines, blankLine()] });
                    }}
                    onCommit={scheduleCommit}
                    onSkipNextCommit={() => { skipCommitRef.current = true; }}
                    onRetry={() => void commitDraft()}
                    onDiscard={() => {
                      writeComposer(null);
                      writeOrigin(null);
                      setComposerError(null);
                      setFeedback(null);
                    }}
                  />
                ) : null}
                {showInbox ? inbox.map((item) => (
                  <InboxRow key={item.id} item={item} accounts={activeAccounts} canWrite={canWrite} pending={pending} onAct={onAct} startPending={startPending} stopPending={stopPending} />
                )) : null}
                {displayedGroups.map(({ entry, rows }) => {
                  if (composer?.mode === "edit" && composer.entryId === entry.id) {
                    return (
                      <EditingRows
                        key={entry.id}
                        composer={composer}
                        accounts={activeAccounts}
                        error={composerError}
                        feedback={feedback?.key === entry.id ? feedback : null}
                        locked={pending === "void"}
                        materialNote={materialNow && origin && origin.previousStatus !== "pending"
                          ? "Cette modification repasse l’écriture à vérifier."
                          : null}
                        linkedNote={origin?.linked ? "L’extourne liée quittera le journal avec cette modification, pour que les soldes restent justes." : null}
                        origin={origin}
                        sourceText={sourceLabel(entry.source_type)}
                        onChange={(next) => {
                          writeComposer(next);
                          setComposerError(null);
                          setFeedback((prev) => prev?.phase === "error" ? null : prev);
                        }}
                        onAddLine={() => {
                          const current = composerRef.current;
                          if (!current) return;
                          writeComposer({ ...current, lines: [...current.lines, blankLine()] });
                        }}
                        onCommit={scheduleCommit}
                        onSkipNextCommit={() => { skipCommitRef.current = true; }}
                        onRetry={() => void commitExisting(feedback?.field || "label", feedback?.lineId || "")}
                        onDelete={() => { setNotice(null); setVoiding(entry); }}
                      />
                    );
                  }
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
                        className={`border-b ${last ? "border-[#E2E8F0]" : "border-[#F4F7FB]"} bg-white hover:bg-[#F8FAFC]`}
                      >
                        <CellButton locked={Boolean(lock) || !canWrite} title={lock || "Modifier la date"} onClick={() => openEdit(entry, rows, "date", row.groupIndex)}>{showMeta ? formatSwissDate(entry.entry_date) : ""}</CellButton>
                        <CellButton locked={Boolean(lock) || !canWrite || !showMeta} title={lock || (entry.entry_number_manual ? "Numéro corrigé manuellement. Un décalage ultérieur sera indiqué." : "Modifier le numéro d’écriture")} onClick={() => openEdit(entry, rows, "number", row.groupIndex)}>{showMeta ? entry.entry_number : ""}</CellButton>
                        <CellButton locked={Boolean(lock) || !canWrite || !showMeta} title={lock || "Modifier la pièce"} onClick={() => openEdit(entry, rows, "piece", row.groupIndex)}>{showMeta ? (entry.reference || "—") : ""}</CellButton>
                        <td className={`truncate px-3 py-3 ${showMeta ? "font-medium" : "text-[#64748B]"}`}>
                          {showMeta ? (
                            <button type="button" className="max-w-full truncate text-left" disabled={Boolean(lock) || !canWrite} title={lock || "Modifier le libellé"} onClick={() => openEdit(entry, rows, "label", row.groupIndex)}>{entry.description}</button>
                          ) : "même écriture"}
                          {showMeta && rows.length > 1 ? <span className="ml-2 text-[11px] font-medium text-[#94A3B8]">{rows.length} lignes</span> : null}
                        </td>
                        <td className="px-3 py-3"><button type="button" className="w-full text-left" disabled={Boolean(lock) || !canWrite} title={lock || "Modifier le compte au débit"} onClick={() => openEdit(entry, rows, "debit", row.groupIndex)}><AccountCell account={debit} /></button></td>
                        <td className="px-3 py-3"><button type="button" className="w-full text-left" disabled={Boolean(lock) || !canWrite} title={lock || "Modifier le compte au crédit"} onClick={() => openEdit(entry, rows, "credit", row.groupIndex)}><AccountCell account={credit} /></button></td>
                        <td className="px-3 py-3 text-right font-medium tabular-nums">
                          <button type="button" className="w-full text-right" disabled={Boolean(lock) || !canWrite} title={lock || "Modifier le montant"} onClick={() => openEdit(entry, rows, "amount", row.groupIndex)}>{formatChfAmount(row.amount)}</button>
                          {last && rows.length > 1 ? <span className="mt-0.5 block text-[11px] font-normal text-[#64748B]">Total {formatChfAmount(total)}</span> : null}
                        </td>
                        <CellButton locked={Boolean(lock) || !canWrite || !showMeta} title={lock || "Modifier la remarque"} onClick={() => openEdit(entry, rows, "remark", row.groupIndex)}>{showMeta ? entry.party_name || "" : ""}</CellButton>
                        <td className="truncate px-2 py-3 text-xs text-[#94A3B8]" title={sourceLabel(entry.source_type)}>{showMeta ? sourceLabel(entry.source_type) : ""}</td>
                        <CellButton locked={Boolean(lock) || !canWrite || !showMeta} title={lock || "Modifier le statut"} onClick={() => openEdit(entry, rows, "status", row.groupIndex)}>{showMeta ? STATUS_LABEL[entry.status] || entry.status : ""}</CellButton>
                        <td className="px-1 py-1 text-center">
                          {showMeta && canWrite ? (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                              disabled={Boolean(lock) || pending !== null}
                              title={lock || "Supprimer l’écriture"}
                              aria-label="Supprimer l’écriture"
                              onClick={() => { setNotice(null); setVoiding(entry); }}
                            >
                              <TrashIcon />
                            </button>
                          ) : null}
                          {showMeta && linked && !lock ? <span className="sr-only">Liée à l’écriture {linked.entry_number}</span> : null}
                        </td>
                      </tr>
                    );
                  });
                })}
                {groups.length === 0 && (!showInbox || inbox.length === 0) ? (
                  <tr><td colSpan={11} className="px-3 py-8 text-sm text-[#64748B]">Aucune écriture pour ces filtres.</td></tr>
                ) : null}
                {groups.length > JOURNAL_PAGE_SIZE ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-3 text-sm text-[#475569]">
                      <span>{currentPage * JOURNAL_PAGE_SIZE + 1}–{Math.min(groups.length, (currentPage + 1) * JOURNAL_PAGE_SIZE)} sur {groups.length}</span>
                      <button type="button" className="ml-4 underline disabled:opacity-40" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Page précédente</button>
                      <button type="button" className="ml-3 underline disabled:opacity-40" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>Page suivante</button>
                    </td>
                  </tr>
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

const EDIT_FIELDS = ["date", "number", "piece", "label", "debit", "credit", "amount", "remark", "status"] as const;

function EditingRows({
  composer,
  accounts,
  error,
  feedback,
  locked,
  materialNote,
  linkedNote,
  origin,
  sourceText,
  onChange,
  onAddLine,
  onCommit,
  onSkipNextCommit,
  onRetry,
  onDiscard,
  onDelete,
}: {
  composer: Composer;
  accounts: Account[];
  error: string | null;
  feedback: CellFeedback | null;
  locked: boolean;
  materialNote: string | null;
  linkedNote: string | null;
  origin: Origin | null;
  sourceText: string;
  onChange: (composer: Composer) => void;
  onAddLine: () => void;
  onCommit: (field: string, lineId: string) => void;
  onSkipNextCommit: () => void;
  onRetry: () => void;
  onDiscard?: () => void;
  onDelete?: () => void;
}) {
  const baseline = useRef<{ field: string; lineId: string; value: string } | null>(null);
  function replace(next: Composer) {
    onChange(next);
  }
  function setLine(localId: string, patch: Partial<EditorLine>) {
    replace({ ...composer, lines: composer.lines.map((line) => line.localId === localId ? { ...line, ...patch } : line) });
  }
  function mark(changed: boolean, invalid = false) {
    if (invalid) return `${gridInput} bg-rose-50 ring-1 ring-inset ring-rose-400`;
    return changed ? `${gridInput} bg-[#FFF6D8]` : gridInput;
  }
  function arm(field: string, lineId: string, value: string) {
    baseline.current = { field, lineId, value };
  }
  function fieldValue(field: string, line: EditorLine): string {
    if (field === "date") return composer.date;
    if (field === "number") return composer.number;
    if (field === "piece") return composer.piece;
    if (field === "label") return composer.label;
    if (field === "remark") return composer.remark;
    if (field === "status") return composer.status;
    if (field === "amount") return line.amount;
    if (field === "debit") return line.debitId;
    if (field === "credit") return line.creditId;
    return "";
  }
  function restore(field: string, lineId: string, value: string) {
    if (field === "date") replace({ ...composer, date: value });
    else if (field === "number") replace({ ...composer, number: value });
    else if (field === "piece") replace({ ...composer, piece: value });
    else if (field === "label") replace({ ...composer, label: value });
    else if (field === "remark") replace({ ...composer, remark: value });
    else if (field === "status") replace({ ...composer, status: value });
    else if (field === "amount") setLine(lineId, { amount: value });
    else if (field === "debit") setLine(lineId, { debitId: value });
    else if (field === "credit") setLine(lineId, { creditId: value });
  }
  function cellPhase(field: string, lineId: string): CellFeedback["phase"] | null {
    if (!feedback || feedback.field !== field || feedback.lineId !== lineId) return null;
    return feedback.phase;
  }
  function keyDown(event: KeyboardEvent<HTMLElement>, field: string, lineId = "") {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onSkipNextCommit();
      const snap = baseline.current;
      const line = composer.lines.find((item) => item.localId === (snap?.lineId || lineId));
      const now = line ? fieldValue(field, line) : "";
      if (snap && snap.field === field && snap.value !== now) restore(snap.field, snap.lineId, snap.value);
      event.currentTarget.blur();
      return;
    }
    if (event.key !== "Enter" || event.shiftKey) return;
    const index = EDIT_FIELDS.indexOf(field as typeof EDIT_FIELDS[number]);
    if (index < 0) return;
    event.preventDefault();
    const row = event.currentTarget.closest("tr");
    for (let cursor = index + 1; cursor < EDIT_FIELDS.length; cursor += 1) {
      const target = row?.querySelector<HTMLElement>(`[data-field="${EDIT_FIELDS[cursor]}"]`);
      if (target) {
        target.focus();
        return;
      }
    }
    const nextField = row?.nextElementSibling?.querySelector<HTMLElement>("[data-field]");
    if (nextField) nextField.focus();
    else event.currentTarget.blur();
  }
  const gap = journalImbalance(rowsToLines(composer.lines.map((line) => ({
    debitAccountId: line.debitId || null,
    creditAccountId: line.creditId || null,
    amount: parseChfInput(line.amount) || 0,
  }))));
  return (
    <>
      {composer.lines.map((line, index) => {
        const first = index === 0;
        return (
          <tr key={line.localId} id={first ? "journal-edit" : undefined} data-journal-edit="" className="border-b border-[#F4F7FB] bg-white">
            <td className="relative px-1 py-1">{first ? <input data-field="date" className={mark(origin !== null && composer.date !== origin.date, cellPhase("date", line.localId) === "error")} type="date" value={composer.date} disabled={locked} onFocus={() => arm("date", line.localId, composer.date)} onBlur={() => onCommit("date", line.localId)} onChange={(event) => replace({ ...composer, date: event.target.value })} onKeyDown={(event) => keyDown(event, "date", line.localId)} /> : null}{first ? <CellMark phase={cellPhase("date", line.localId)} /> : null}</td>
            <td className="relative px-1 py-1">{first && composer.mode === "edit" ? <input data-field="number" className={`${mark(origin !== null && composer.number !== origin.number, error === ENTRY_NUMBER_TAKEN || cellPhase("number", line.localId) === "error")} text-center tabular-nums`} value={composer.number} disabled={locked} onFocus={() => arm("number", line.localId, composer.number)} onBlur={() => onCommit("number", line.localId)} onChange={(event) => replace({ ...composer, number: event.target.value })} onKeyDown={(event) => keyDown(event, "number", line.localId)} /> : first ? <span className="px-1 text-xs text-[#94A3B8]">Auto</span> : null}{first && composer.mode === "edit" ? <CellMark phase={cellPhase("number", line.localId)} /> : null}</td>
            <td className="relative px-1 py-1">{first ? <input data-field="piece" className={mark(origin !== null && composer.piece !== origin.reference, cellPhase("piece", line.localId) === "error")} value={composer.piece} placeholder="Pièce" disabled={locked} onFocus={() => arm("piece", line.localId, composer.piece)} onBlur={() => onCommit("piece", line.localId)} onChange={(event) => replace({ ...composer, piece: event.target.value })} onKeyDown={(event) => keyDown(event, "piece", line.localId)} /> : null}{first ? <CellMark phase={cellPhase("piece", line.localId)} /> : null}</td>
            <td className="relative px-1 py-1">{first ? <input data-field="label" className={mark(origin !== null && composer.label !== origin.label, cellPhase("label", line.localId) === "error")} value={composer.label} placeholder="Libellé" disabled={locked} onFocus={() => arm("label", line.localId, composer.label)} onBlur={() => onCommit("label", line.localId)} onChange={(event) => replace({ ...composer, label: event.target.value })} onKeyDown={(event) => keyDown(event, "label", line.localId)} /> : <span className="px-2 text-xs text-[#94A3B8]">même écriture</span>}{first ? <CellMark phase={cellPhase("label", line.localId)} /> : null}</td>
            <td className="relative px-1 py-1"><AccountPicker field="debit" dense dirty={origin !== null && (origin.rows[index]?.debitAccountId || "") !== line.debitId} invalid={cellPhase("debit", line.localId) === "error"} accounts={accounts} value={line.debitId} disabled={locked} onArm={() => arm("debit", line.localId, line.debitId)} onBlur={() => onCommit("debit", line.localId)} onChange={(debitId) => setLine(line.localId, { debitId })} onKeyDown={(event) => keyDown(event, "debit", line.localId)} /><CellMark phase={cellPhase("debit", line.localId)} /></td>
            <td className="relative px-1 py-1"><AccountPicker field="credit" dense dirty={origin !== null && (origin.rows[index]?.creditAccountId || "") !== line.creditId} invalid={cellPhase("credit", line.localId) === "error"} accounts={accounts} value={line.creditId} disabled={locked} onArm={() => arm("credit", line.localId, line.creditId)} onBlur={() => onCommit("credit", line.localId)} onChange={(creditId) => setLine(line.localId, { creditId })} onKeyDown={(event) => keyDown(event, "credit", line.localId)} /><CellMark phase={cellPhase("credit", line.localId)} /></td>
            <td className="relative px-1 py-1"><input data-field="amount" className={`${mark(Boolean(origin?.rows[index] && (parseChfInput(line.amount) || 0) !== origin.rows[index].amount), cellPhase("amount", line.localId) === "error")} text-right tabular-nums`} value={line.amount} placeholder="0.00" inputMode="decimal" disabled={locked} aria-label={`Montant ligne ${index + 1}`} onFocus={() => arm("amount", line.localId, line.amount)} onBlur={() => onCommit("amount", line.localId)} onChange={(event) => setLine(line.localId, { amount: event.target.value })} onKeyDown={(event) => keyDown(event, "amount", line.localId)} /><CellMark phase={cellPhase("amount", line.localId)} /></td>
            <td className="relative px-1 py-1">{first ? <input data-field="remark" className={mark(origin !== null && composer.remark !== origin.remark, cellPhase("remark", line.localId) === "error")} value={composer.remark} placeholder="Remarque" disabled={locked} onFocus={() => arm("remark", line.localId, composer.remark)} onBlur={() => onCommit("remark", line.localId)} onChange={(event) => replace({ ...composer, remark: event.target.value })} onKeyDown={(event) => keyDown(event, "remark", line.localId)} /> : null}{first ? <CellMark phase={cellPhase("remark", line.localId)} /> : null}</td>
            <td className="truncate px-2 py-1 text-xs text-[#94A3B8]" title={first ? sourceText : undefined}>{first ? sourceText : ""}</td>
            <td className="relative px-1 py-1">{first && composer.mode === "edit" ? (
              <select data-field="status" className={mark(origin !== null && (origin.previousStatus === "pending" ? "pending" : "validated") !== (composer.status === "validated" ? "validated" : "pending"), cellPhase("status", line.localId) === "error")} value={composer.status === "validated" ? "validated" : "pending"} disabled={locked} onFocus={() => arm("status", line.localId, composer.status === "validated" ? "validated" : "pending")} onBlur={() => onCommit("status", line.localId)} onChange={(event) => replace({ ...composer, status: event.target.value })} onKeyDown={(event) => keyDown(event, "status", line.localId)}>
                <option value="pending">À vérifier</option>
                <option value="validated">Vérifiée</option>
              </select>
            ) : first ? <span className="px-1 text-xs text-[#64748B]">Brouillon</span> : null}{first && composer.mode === "edit" ? <CellMark phase={cellPhase("status", line.localId)} /> : null}</td>
            <td className="px-1 py-1 text-center">
              {first && onDelete ? (
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-[#94A3B8] hover:bg-rose-50 hover:text-rose-700" title="Supprimer l’écriture" aria-label="Supprimer l’écriture" onClick={onDelete}><TrashIcon /></button>
              ) : null}
            </td>
          </tr>
        );
      })}
      <tr
        data-journal-edit=""
        className="border-b border-[#E2E8F0] bg-white"
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Element && next.closest("[data-journal-edit]")) return;
          const lineId = composer.lines[0]?.localId || "";
          onCommit(composer.mode === "create" ? "remark" : "status", lineId);
        }}
      >
        <td colSpan={11} className="px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button type="button" className="text-xs font-medium text-[#1A23FF] disabled:opacity-40" disabled={locked} onClick={onAddLine}>Ajouter une ligne</button>
            {composer.mode === "create" && onDiscard ? (
              <button type="button" className="text-xs font-medium text-[#64748B] hover:text-[#0F172A]" onClick={onDiscard}>Retirer le brouillon</button>
            ) : null}
            {linkedNote ? <span className="text-xs text-[#64748B]">{linkedNote}</span> : null}
            {materialNote ? <span className="text-xs text-[#64748B]">{materialNote}</span> : null}
            {composer.lines.length > 1 && gap !== 0 ? <span className="text-xs text-rose-700">Écart : {formatChfAmount(Math.abs(gap))}</span> : null}
            {feedback?.phase === "saving" ? <span className="text-xs text-[#64748B]">Enregistrement…</span> : null}
            {feedback?.phase === "saved" ? <span className="text-xs text-emerald-700">Enregistré</span> : null}
            {error ? <span className="text-xs text-rose-700">{error}</span> : null}
            {feedback?.phase === "error" ? (
              <button type="button" className="text-xs font-medium text-[#1A23FF]" onClick={onRetry}>Réessayer</button>
            ) : null}
          </div>
        </td>
      </tr>
    </>
  );
}

function CellMark({ phase }: { phase: CellFeedback["phase"] | null }) {
  if (!phase) return null;
  const label = phase === "saving" ? "Enregistrement" : phase === "saved" ? "Enregistré" : "Erreur";
  const color = phase === "saving" ? "animate-pulse bg-[#94A3B8]" : phase === "saved" ? "bg-emerald-500" : "bg-rose-500";
  return <span className={`pointer-events-none absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${color}`} aria-label={label} />;
}

function AccountPicker({
  accounts,
  value,
  field,
  disabled,
  dense,
  dirty,
  invalid,
  onArm,
  onBlur,
  onChange,
  onKeyDown,
}: {
  accounts: Account[];
  value: string;
  field: JournalField;
  disabled?: boolean;
  dense?: boolean;
  dirty?: boolean;
  invalid?: boolean;
  onArm?: () => void;
  onBlur?: () => void;
  onChange: (id: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = accounts.find((account) => account.id === value);
  const matches = accounts.filter((account) => `${account.number} ${account.name}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  return (
    <div className="relative">
      <input
        data-field={field}
        className={`${dense ? gridInput : editor} font-mono ${invalid ? "bg-rose-50 ring-1 ring-inset ring-rose-400" : dirty ? "bg-[#FFF6D8]" : ""}`}
        value={open ? query : (selected ? `${selected.number} ${selected.name}` : "")}
        placeholder="N° ou nom"
        disabled={disabled}
        autoComplete="off"
        aria-label={field === "debit" ? "Compte au débit" : "Compte au crédit"}
        onFocus={() => { onArm?.(); setOpen(true); setQuery(""); }}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => {
          onBlur?.();
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && open && matches[0] && query.trim()) {
            event.preventDefault();
            onChange(matches[0].id);
            setOpen(false);
          }
          onKeyDown?.(event);
        }}
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

function CellButton({ children, locked, title, onClick }: { children: ReactNode; locked?: boolean; title: string; onClick: () => void }) {
  return (
    <td className="px-2 py-3">
      <button type="button" className="w-full truncate text-left disabled:cursor-default" disabled={locked} title={title} onClick={onClick}>{children}</button>
    </td>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" />
    </svg>
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

const gridInput = "h-9 w-full min-w-0 rounded border border-transparent bg-white/80 px-1 text-[13px] text-[#0F172A] outline-none focus:border-[#94A3B8] focus:bg-white";
const filter = "h-9 w-full rounded-md border border-[#D6DEE8] bg-white px-2.5 text-sm text-[#0F172A] outline-none transition focus:border-[#1A23FF] focus:ring-2 focus:ring-[#1A23FF]/15";
const editor = "h-10 w-full rounded-lg border border-[#D6DEE8] bg-white px-3 text-sm text-[#0F172A] outline-none transition focus:border-[#1A23FF] focus:ring-2 focus:ring-[#1A23FF]/15 disabled:bg-[#F8FAFC]";
const primaryBtn = "inline-flex h-10 min-w-[9.5rem] items-center justify-center gap-2 rounded-lg bg-[#1A23FF] px-4 text-sm font-semibold text-white transition active:scale-[0.98] active:bg-[#121AD6] disabled:cursor-wait disabled:opacity-70 data-[busy=true]:cursor-wait data-[busy=true]:opacity-70";
const quietBtn = "inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#475569] transition hover:bg-[#F1F5F9] active:scale-[0.98] disabled:opacity-60";
const rowAction = "inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold text-[#334155] transition hover:bg-[#F1F5F9] active:scale-[0.97] active:bg-[#E8EEF5] disabled:cursor-not-allowed disabled:opacity-40 data-[busy=true]:opacity-70";
const rowDanger = "inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 active:scale-[0.97] active:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40";
