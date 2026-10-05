"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionButton, GlassCard } from "@/components/ui";
import { buildBudgetComparison, type BudgetTarget } from "@/lib/accounting/budget";
import { formatChfAmount } from "@/lib/accounting/format";
import type { Account, AccountGroup, BudgetRecord, Entry, JournalLine, Period } from "./model";

export default function BudgetPanel({
  accounts,
  groups,
  budgets,
  entries,
  linesByEntry,
  periods,
  canWrite,
  extensionsReady,
  onAct,
}: {
  accounts: Account[];
  groups: AccountGroup[];
  budgets: BudgetRecord[];
  entries: Entry[];
  linesByEntry: Record<string, JournalLine[]>;
  periods: Period[];
  canWrite: boolean;
  extensionsReady: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const [periodId, setPeriodId] = useState(periods.find((period) => period.status === "open")?.id || periods[periods.length - 1]?.id || "");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [confirmValidate, setConfirmValidate] = useState(false);
  const period = periods.find((item) => item.id === periodId) || periods[periods.length - 1];
  const forPeriod = budgets.filter((budget) => budget.periodId === periodId);
  const draft = forPeriod.find((budget) => budget.status === "draft");
  const validated = forPeriod.find((budget) => budget.status === "validated");
  const history = forPeriod.filter((budget) => budget.status === "superseded");
  const editing = Boolean(draft) || !validated;
  const signature = (draft?.lines || []).map((line) => `${line.accountId || ""}:${line.groupId || ""}:${line.amount}`).join("|");

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const line of draft?.lines || []) {
      if (line.accountId) next[`account:${line.accountId}`] = String(line.amount);
      if (line.groupId) next[`group:${line.groupId}`] = String(line.amount);
    }
    setAmounts(next);
    setConfirmValidate(false);
  }, [periodId, signature, draft?.id]);

  const pnlGroups = groups.filter((group) => {
    const members = accounts.filter((account) => group.accountIds.includes(account.id));
    const natures = new Set(members.map((account) => account.accountType));
    return members.length > 0 && natures.size === 1 && (natures.has("revenue") || natures.has("expense"));
  });
  const pnlAccounts = accounts.filter((account) => account.isActive && (account.accountType === "revenue" || account.accountType === "expense"));

  const lines = useMemo(() => {
    if (!editing) {
      return (validated?.lines || []).map((line) => ({
        accountId: line.accountId,
        groupId: line.groupId,
        amount: line.amount,
        number: line.groupNumber || undefined,
        name: line.groupName || undefined,
      }));
    }
    const drafted: BudgetTarget[] = [];
    for (const [key, raw] of Object.entries(amounts)) {
      const amount = Number(raw.replace(",", ".")) || 0;
      if (key.startsWith("account:")) drafted.push({ accountId: key.slice(8), groupId: null, amount });
      if (key.startsWith("group:")) drafted.push({ accountId: null, groupId: key.slice(6), amount });
    }
    return drafted;
  }, [amounts, editing, validated]);

  const comparison = useMemo(() => {
    if (!period) return null;
    return buildBudgetComparison({
      accounts,
      groups,
      entries,
      linesByEntry,
      period,
      lines,
    });
  }, [accounts, entries, groups, lines, linesByEntry, period]);

  const blockedAccounts = new Set(pnlGroups.filter((group) => Number((amounts[`group:${group.id}`] || "").replace(",", ".")) > 0).flatMap((group) => group.accountIds));

  function save() {
    void onAct({
      action: "budget-save",
      periodId,
      lines: lines.filter((line) => line.amount > 0 && !(line.accountId && blockedAccounts.has(line.accountId))),
    });
  }

  return (
    <div className="space-y-4">
      {!extensionsReady ? (
        <p className="text-sm text-[#475569]">Le budget demande la migration 103. Aucune écriture comptable n’est créée par cette fonction.</p>
      ) : (
        <p className="text-sm text-[#475569]">Le budget compare les charges et les produits prévus au réalisé des rapports officiels. Il ne crée aucune écriture.</p>
      )}
      {periods.length > 0 ? (
        <label className="block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
          Exercice
          <select className="mt-1.5 block h-9 rounded-lg border border-[#D6DEE8] bg-white px-3 text-sm font-normal normal-case tracking-normal text-[#0F172A]" value={periodId} onChange={(event) => setPeriodId(event.target.value)}>
            {periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      ) : null}
      {comparison ? (
        <GlassCard padding="sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A]">Budget et réalisé</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {draft ? `Brouillon, version ${draft.version}` : validated ? `Validé, version ${validated.version}` : "Aucun budget enregistré"}
                {draft?.note ? ` · ${draft.note}` : ""}
              </p>
            </div>
            {validated && draft ? <p className="text-sm text-[#475569]">La version validée reste la référence tant que cette révision n’est pas validée.</p> : null}
          </div>
          <p className={`mt-3 text-sm ${comparison.pendingCount > 0 ? "font-medium text-amber-800" : "text-[#475569]"}`}>{comparison.pendingLabel}</p>
          <table className="mt-4 w-full text-sm">
            <thead className="text-xs uppercase text-[#64748B]">
              <tr>
                <th className="py-1 text-left">Poste</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Réalisé</th>
                <th className="text-right">Écart</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.key} className="border-t border-[#F1F5F9]">
                  <td className="py-1.5">
                    <span className="font-mono text-[#64748B]">{row.number}</span>
                    <span className="ml-2">{row.kind === "group" ? `Rubrique ${row.name}` : row.name}</span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{formatChfAmount(row.budget)}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatChfAmount(row.actual)}</td>
                  <td className="py-1.5 text-right tabular-nums">{formatChfAmount(row.variance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Totals label="Produits" figures={comparison.revenue} />
          <Totals label="Charges" figures={comparison.expense} />
          <Totals label="Résultat" figures={comparison.result} strong />
        </GlassCard>
      ) : null}
      {canWrite && extensionsReady && editing ? (
        <GlassCard padding="sm">
          <h2 className="font-semibold">Saisie du brouillon</h2>
          <div className="mt-3 space-y-2">
            {pnlGroups.map((group) => (
              <AmountRow
                key={group.id}
                label={`${group.number} Rubrique ${group.name}`}
                value={amounts[`group:${group.id}`] || ""}
                onChange={(value) => setAmounts((current) => ({ ...current, [`group:${group.id}`]: value }))}
              />
            ))}
            {pnlAccounts.map((account) => (
              <AmountRow
                key={account.id}
                label={`${account.number} ${account.name}`}
                hint={blockedAccounts.has(account.id) ? "Déjà inclus dans une rubrique budgétée" : undefined}
                disabled={blockedAccounts.has(account.id)}
                value={amounts[`account:${account.id}`] || ""}
                onChange={(value) => setAmounts((current) => ({ ...current, [`account:${account.id}`]: value }))}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton type="button" variant="premiumInline" onClick={save}>Enregistrer le brouillon</ActionButton>
            {draft ? (
              confirmValidate ? (
                <>
                  <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "budget-validate", budgetId: draft.id })}>Confirmer la validation</ActionButton>
                  <ActionButton type="button" variant="ghost" onClick={() => setConfirmValidate(false)}>Annuler</ActionButton>
                </>
              ) : (
                <ActionButton type="button" variant="ghost" onClick={() => setConfirmValidate(true)}>Valider le budget</ActionButton>
              )
            ) : null}
          </div>
          {confirmValidate ? <p className="mt-2 text-sm text-[#475569]">La validation est explicite. Elle n’écrit rien au journal.</p> : null}
        </GlassCard>
      ) : null}
      {canWrite && extensionsReady && validated && !draft ? (
        <GlassCard padding="sm">
          <h2 className="font-semibold">Réviser le budget validé</h2>
          <p className="mt-1 text-sm text-[#64748B]">La version validée est conservée. La révision ouvre un brouillon traçable.</p>
          <label className="mt-3 block text-sm">Motif
            <input className="mt-1 w-full rounded-xl border border-[rgba(15,23,42,0.12)] px-3 py-2 text-sm" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <div className="mt-3">
            <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "budget-revise", budgetId: validated.id, note })}>Créer la révision</ActionButton>
          </div>
        </GlassCard>
      ) : null}
      {history.length > 0 ? (
        <GlassCard padding="sm">
          <h2 className="font-semibold">Versions précédentes</h2>
          <ul className="mt-2 space-y-2 text-sm text-[#334155]">
            {history.map((budget) => (
              <li key={budget.id}>Version {budget.version}{budget.note ? ` · ${budget.note}` : ""}{budget.validatedAt ? ` · validée le ${budget.validatedAt.slice(0, 10)}` : ""}</li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </div>
  );
}

function Totals({ label, figures, strong = false }: { label: string; figures: { budget: number; actual: number; variance: number }; strong?: boolean }) {
  return (
    <p className={`mt-2 text-right text-sm ${strong ? "font-semibold" : "font-medium"}`}>
      {label} · budget {formatChfAmount(figures.budget)} · réalisé {formatChfAmount(figures.actual)} · écart {formatChfAmount(figures.variance)}
    </p>
  );
}

function AmountRow({
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>{label}{hint ? <span className="ml-2 text-[11px] text-[#94A3B8]">{hint}</span> : null}</span>
      <input className="h-9 w-32 rounded-lg border border-[#D6DEE8] px-2 text-right tabular-nums" inputMode="decimal" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
