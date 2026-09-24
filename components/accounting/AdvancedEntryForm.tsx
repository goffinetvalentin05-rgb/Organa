"use client";

import { useMemo, useState } from "react";
import { ActionButton } from "@/components/ui";
import { formatChfAmount } from "@/lib/accounting/format";
import { parseChfInput } from "@/lib/accounting/onboarding";
import { roundChf } from "@/lib/accounting/money";
import type { Account, JournalLine } from "./model";

type Draft = { key: number; accountId: string; debit: string; credit: string };

export default function AdvancedEntryForm({
  accounts,
  initial,
  onClose,
  onAct,
}: {
  accounts: Account[];
  initial?: {
    entryId: string;
    date: string;
    description: string;
    reference: string;
    remark: string;
    lines: JournalLine[];
  };
  onClose: () => void;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const active = accounts.filter((account) => account.isActive);
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState(initial?.reference || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [remark, setRemark] = useState(initial?.remark || "");
  const [validateNow, setValidateNow] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [idempotencyKey] = useState(() => `advanced:${crypto.randomUUID()}`);
  const [rows, setRows] = useState<Draft[]>(() => {
    if (initial?.lines.length) {
      return initial.lines.map((line, index) => ({
        key: index + 1,
        accountId: line.accountId,
        debit: line.debit ? String(line.debit) : "",
        credit: line.credit ? String(line.credit) : "",
      }));
    }
    return [
      { key: 1, accountId: active[0]?.id || "", debit: "", credit: "" },
      { key: 2, accountId: active[1]?.id || active[0]?.id || "", debit: "", credit: "" },
    ];
  });

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;
    for (const row of rows) {
      const debitValue = row.debit.trim() ? parseChfInput(row.debit) : 0;
      const creditValue = row.credit.trim() ? parseChfInput(row.credit) : 0;
      if (Number.isFinite(debitValue) && debitValue > 0) debit = roundChf(debit + debitValue);
      if (Number.isFinite(creditValue) && creditValue > 0) credit = roundChf(credit + creditValue);
    }
    return { debit, credit, gap: roundChf(Math.abs(debit - credit)) };
  }, [rows]);

  const balanced = totals.debit > 0 && totals.gap === 0;

  function patch(key: number, next: Partial<Draft>) {
    setRows(rows.map((row) => (row.key === key ? { ...row, ...next } : row)));
  }

  async function save() {
    setBusy(true);
    try {
      const lines = rows.map((row) => ({
        accountId: row.accountId,
        debit: row.debit.trim() ? parseChfInput(row.debit) || 0 : 0,
        credit: row.credit.trim() ? parseChfInput(row.credit) || 0 : 0,
      }));
      const payload = initial
        ? { action: "advanced-update", entryId: initial.entryId, date, description, reference, remark, lines }
        : { action: "advanced", date, description, reference, remark, validateNow, idempotencyKey, lines };
      const body = await onAct(payload) as { entryId?: string } | null;
      const entryId = initial?.entryId || body?.entryId;
      if (file && entryId) {
        const form = new FormData();
        form.set("entryId", entryId);
        form.set("file", file);
        await fetch("/api/accounting", { method: "PUT", body: form });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/30">
      <button type="button" className="h-full flex-1" aria-label="Fermer" onClick={onClose} />
      <aside className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="border-b border-[#E2E8F0] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Journal</p>
          <h2 className="mt-1 text-lg font-semibold text-[#0F172A]">{initial ? "Modifier l’écriture" : "Écriture comptable avancée"}</h2>
          <p className="mt-1 text-sm text-[#64748B]">Pour les régularisations, reclassements et corrections. L’écriture reste à vérifier.</p>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Date<input className={field} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label className="text-sm">Référence / pièce<input className={field} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
            <label className="text-sm sm:col-span-2">Libellé<input className={field} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <label className="text-sm sm:col-span-2">Remarque<input className={field} value={remark} onChange={(event) => setRemark(event.target.value)} /></label>
            <label className="text-sm sm:col-span-2">Justificatif
              <input className="mt-1 block text-xs" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Lignes comptables</p>
            <table className="mt-2 w-full text-sm">
              <thead className="text-[11px] uppercase text-[#64748B]">
                <tr><th className="py-1 text-left">Compte</th><th className="text-right">Débit</th><th className="text-right">Crédit</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-[#F1F5F9]">
                    <td className="py-2 pr-2">
                      <select className={field} value={row.accountId} onChange={(event) => patch(row.key, { accountId: event.target.value })}>
                        {active.map((account) => (
                          <option key={account.id} value={account.id}>{account.number} {account.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2"><input className={`${field} text-right tabular-nums`} inputMode="decimal" value={row.debit} onChange={(event) => patch(row.key, { debit: event.target.value, credit: event.target.value.trim() ? "" : row.credit })} /></td>
                    <td className="py-2"><input className={`${field} text-right tabular-nums`} inputMode="decimal" value={row.credit} onChange={(event) => patch(row.key, { credit: event.target.value, debit: event.target.value.trim() ? "" : row.debit })} /></td>
                    <td className="py-2 text-right">
                      {rows.length > 2 ? <button type="button" className="text-xs text-[#64748B]" onClick={() => setRows(rows.filter((item) => item.key !== row.key))}>Retirer</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="mt-2 text-sm font-semibold text-[#1A23FF]" onClick={() => setRows([...rows, { key: Date.now(), accountId: active[0]?.id || "", debit: "", credit: "" }])}>
              + Ajouter une ligne
            </button>
          </div>
        </div>
        <footer className="border-t border-[#E2E8F0] px-5 py-4">
          <div className="mb-3 grid grid-cols-3 text-sm">
            <p>Total débit<br /><span className="font-semibold tabular-nums">{formatChfAmount(totals.debit)}</span></p>
            <p>Total crédit<br /><span className="font-semibold tabular-nums">{formatChfAmount(totals.credit)}</span></p>
            <p>Écart<br /><span className="font-semibold tabular-nums">{formatChfAmount(totals.gap)}</span></p>
          </div>
          {!balanced ? <p className="mb-3 text-sm text-rose-700">L’écriture doit être équilibrée avant d’être enregistrée.</p> : null}
          {!initial ? (
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={validateNow} disabled={!balanced} onChange={(event) => setValidateNow(event.target.checked)} />
              Valider immédiatement
            </label>
          ) : null}
          <div className="flex gap-2">
            <ActionButton type="button" variant="ghost" onClick={onClose}>Annuler</ActionButton>
            <ActionButton type="button" variant="premiumInline" disabled={!balanced || busy} onClick={() => void save()}>Enregistrer</ActionButton>
          </div>
        </footer>
      </aside>
    </div>
  );
}

const field = "mt-1 w-full rounded-lg border border-[rgba(15,23,42,0.12)] px-2 py-1.5 text-sm";
