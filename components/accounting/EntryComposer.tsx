"use client";

import { useMemo, useState } from "react";
import { ActionButton } from "@/components/ui";
import { formatChfAmount } from "@/lib/accounting/format";
import { isFinancialSystemCode } from "@/lib/accounting/financialAccounts";
import { parseChfInput } from "@/lib/accounting/onboarding";
import type { Account } from "./model";

type Kind = "in" | "out" | "transfer" | "misc";

const KIND_LABEL: Record<Kind, string> = {
  in: "Nouvel encaissement",
  out: "Nouvelle dépense",
  transfer: "Nouveau transfert",
  misc: "Opération diverse",
};

export default function EntryComposer({
  kind,
  accounts,
  onClose,
  onAct,
}: {
  kind: Kind;
  accounts: Account[];
  onClose: () => void;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [direction, setDirection] = useState<"in" | "out">(kind === "out" ? "out" : "in");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [financialAccountCode, setFinancial] = useState("bank");
  const [toAccountCode, setToAccount] = useState("");
  const [categoryCode, setCategory] = useState(kind === "out" ? "other_expense" : "other_income");
  const [showLines, setShowLines] = useState(kind === "misc");
  const [busy, setBusy] = useState(false);

  const financials = accounts.filter((account) => account.isActive && isFinancialSystemCode(account.systemCode));
  const flow: "in" | "out" | "transfer" = kind === "transfer" ? "transfer" : kind === "misc" ? direction : kind;
  const categories = accounts.filter((account) => account.isActive && account.accountType === (flow === "out" ? "expense" : "revenue"));
  const value = parseChfInput(amount);

  const preview = useMemo(() => {
    if (!Number.isFinite(value) || value <= 0) return [];
    const money = financials.find((account) => (account.systemCode || account.number) === financialAccountCode);
    const category = categories.find((account) => (account.systemCode || account.number) === categoryCode);
    const target = financials.find((account) => (account.systemCode || account.number) === toAccountCode);
    if (flow === "transfer") {
      return [
        { side: "Débit", account: target ? `${target.number} ${target.name}` : "Compte d’arrivée" },
        { side: "Crédit", account: money ? `${money.number} ${money.name}` : "Compte de départ" },
      ];
    }
    if (flow === "out") {
      return [
        { side: "Débit", account: category ? `${category.number} ${category.name}` : "Charge" },
        { side: "Crédit", account: money ? `${money.number} ${money.name}` : "Compte financier" },
      ];
    }
    return [
      { side: "Débit", account: money ? `${money.number} ${money.name}` : "Compte financier" },
      { side: "Crédit", account: category ? `${category.number} ${category.name}` : "Produit" },
    ];
  }, [categories, categoryCode, financialAccountCode, financials, flow, toAccountCode, value]);

  async function submit() {
    setBusy(true);
    try {
      if (flow === "transfer") {
        await onAct({
          action: "transfer",
          date,
          amount: Number(amount),
          description,
          fromAccountCode: financialAccountCode,
          toAccountCode,
        });
      } else {
        await onAct({
          action: "manual",
          direction: flow,
          date,
          amount: Number(amount),
          description,
          financialAccountCode,
          categoryCode,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/30">
      <button type="button" className="h-full flex-1" aria-label="Fermer" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="border-b border-[#E2E8F0] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">Journal</p>
          <h2 className="mt-1 text-lg font-semibold text-[#0F172A]">{KIND_LABEL[kind]}</h2>
          <p className="mt-1 text-sm text-[#64748B]">L’écriture reste à vérifier tant qu’elle n’est pas validée.</p>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {kind === "misc" ? (
            <div className="flex gap-2">
              <button type="button" className={pill(direction === "in")} onClick={() => { setDirection("in"); setCategory("other_income"); }}>Entrée</button>
              <button type="button" className={pill(direction === "out")} onClick={() => { setDirection("out"); setCategory("other_expense"); }}>Sortie</button>
            </div>
          ) : null}
          <label className="block text-sm text-[#334155]">Date
            <input className={field} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="block text-sm text-[#334155]">Montant
            <input className={field} inputMode="decimal" placeholder="CHF" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label className="block text-sm text-[#334155]">Libellé
            <input className={field} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          {flow === "transfer" ? (
            <>
              <Select label="Compte de départ" value={financialAccountCode} onChange={setFinancial} accounts={financials} />
              <Select label="Compte d’arrivée" value={toAccountCode} onChange={setToAccount} accounts={financials} placeholder="Choisir" />
            </>
          ) : (
            <>
              <Select label={flow === "out" ? "Compte payé" : "Compte encaissé"} value={financialAccountCode} onChange={setFinancial} accounts={financials} />
              <Select label="Catégorie" value={categoryCode} onChange={setCategory} accounts={categories} />
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-[#334155]">
            <input type="checkbox" checked={showLines} onChange={(event) => setShowLines(event.target.checked)} />
            Afficher les lignes comptables
          </label>
          {showLines ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm">
              {preview.length === 0 ? <p className="text-[#64748B]">Saisissez un montant pour voir le débit et le crédit.</p> : null}
              {preview.map((line) => (
                <p key={line.side} className="flex justify-between gap-3 py-1">
                  <span className="text-[#64748B]">{line.side}</span>
                  <span className="text-right font-medium text-[#0F172A]">{line.account}</span>
                </p>
              ))}
              {Number.isFinite(value) && value > 0 ? (
                <p className="mt-2 border-t border-[#E2E8F0] pt-2 text-right font-semibold">{formatChfAmount(value)}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <footer className="flex gap-2 border-t border-[#E2E8F0] px-5 py-4">
          <ActionButton type="button" variant="ghost" onClick={onClose}>Annuler</ActionButton>
          <ActionButton type="button" variant="premiumInline" disabled={busy} onClick={() => void submit()}>Enregistrer</ActionButton>
        </footer>
      </aside>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  accounts,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accounts: Account[];
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-[#334155]">{label}
      <select className={field} value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {accounts.map((account) => (
          <option key={account.id} value={account.systemCode || account.number}>{account.number} {account.name}</option>
        ))}
      </select>
    </label>
  );
}

const field = "mt-1 w-full rounded-xl border border-[rgba(15,23,42,0.12)] px-3 py-2 text-sm";

function pill(active: boolean): string {
  return active
    ? "rounded-full bg-[#1A23FF] px-3 py-1.5 text-sm font-medium text-white"
    : "rounded-full bg-[#F1F5F9] px-3 py-1.5 text-sm text-[#475569]";
}
