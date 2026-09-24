"use client";

import { useState, type ReactNode } from "react";
import { ActionButton } from "@/components/ui";
import { ACCOUNT_CLASS_LABELS } from "@/lib/accounting/chart";
import { formatChfAmount } from "@/lib/accounting/format";
import type { Account } from "./model";

const GROUPS: Array<{ title: string; types: string[] }> = [
  { title: "Actifs", types: ["asset"] },
  { title: "Passifs", types: ["liability"] },
  { title: "Capitaux propres", types: ["equity"] },
  { title: "Produits", types: ["revenue"] },
  { title: "Charges", types: ["expense"] },
];

const TYPE_LABEL: Record<string, string> = {
  asset: "Actif",
  liability: "Passif",
  equity: "Capitaux propres",
  revenue: "Produit",
  expense: "Charge",
};

export default function ChartPanel({
  accounts,
  balances,
  canWrite,
  onAct,
}: {
  accounts: Account[];
  balances: Map<string, number>;
  canWrite: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748B]">Soldes des écritures validées et extournées.</p>
        {canWrite ? <ActionButton type="button" variant="premiumInline" onClick={() => setCreating(true)}>Nouveau compte</ActionButton> : null}
      </div>
      {GROUPS.map((group) => {
        const rows = accounts.filter((account) => group.types.includes(account.accountType));
        if (!rows.length) return null;
        return (
          <section key={group.title} className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white">
            <h2 className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#0F172A]">{group.title}</h2>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-[#64748B]">
                <tr>
                  <th className="px-4 py-2 text-left">N°</th>
                  <th className="px-3 py-2 text-left">Compte</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Solde</th>
                  <th className="px-3 py-2 text-left">Statut</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((account) => (
                  <tr key={account.id} className="border-t border-[#F1F5F9]">
                    <td className="px-4 py-2 tabular-nums font-medium">{account.number}</td>
                    <td className="px-3 py-2">
                      {account.name}
                      {account.isSystem ? <span className="ml-2 rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-medium text-[#1A23FF]">Système</span> : null}
                      <span className="mt-0.5 block text-[11px] text-[#94A3B8]">{ACCOUNT_CLASS_LABELS[account.accountClass]}</span>
                    </td>
                    <td className="px-3 py-2 text-[#475569]">{TYPE_LABEL[account.accountType] || account.accountType}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatChfAmount(balances.get(account.id) || 0)}</td>
                    <td className="px-3 py-2">{account.isActive ? "Actif" : "Inactif"}</td>
                    <td className="px-3 py-2 text-right">
                      {canWrite ? <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={() => setEditing(account)}>Modifier</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
      {editing ? <EditAccount account={editing} onClose={() => setEditing(null)} onAct={onAct} /> : null}
      {creating ? <CreateAccount onClose={() => setCreating(false)} onAct={onAct} /> : null}
    </div>
  );
}

function EditAccount({
  account,
  onClose,
  onAct,
}: {
  account: Account;
  onClose: () => void;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(account.name);
  const [number, setNumber] = useState(account.number);

  function save() {
    const nextNumber = number.trim();
    if (!account.isSystem && nextNumber !== account.number) {
      const confirmed = window.confirm(`Le numéro passera de ${account.number} à ${nextNumber}. Le compte reste le même en interne.`);
      if (!confirmed) return;
    }
    void onAct({
      action: "update_account",
      accountId: account.id,
      name: name.trim(),
      number: account.isSystem ? undefined : nextNumber,
    });
    onClose();
  }

  return (
    <Drawer title={`${account.number} ${account.name}`} onClose={onClose}>
      <label className="block text-sm">Libellé
        <input className={field} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {account.isSystem ? <p className="text-xs text-[#64748B]">Le numéro d’un compte système ne change pas.</p> : (
        <label className="block text-sm">Numéro
          <input className={field} value={number} onChange={(event) => setNumber(event.target.value)} />
        </label>
      )}
      <ActionButton type="button" variant="premiumInline" onClick={save}>Enregistrer</ActionButton>
    </Drawer>
  );
}

function CreateAccount({ onClose, onAct }: { onClose: () => void; onAct: (payload: Record<string, unknown>) => Promise<void> }) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("expense");
  return (
    <Drawer title="Nouveau compte" onClose={onClose}>
      <label className="block text-sm">Numéro<input className={field} value={number} onChange={(event) => setNumber(event.target.value)} /></label>
      <label className="block text-sm">Nom<input className={field} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="block text-sm">Type
        <select className={field} value={accountType} onChange={(event) => setAccountType(event.target.value)}>
          <option value="asset">Actif</option>
          <option value="liability">Passif</option>
          <option value="equity">Capitaux propres</option>
          <option value="revenue">Produit</option>
          <option value="expense">Charge</option>
        </select>
      </label>
      <ActionButton type="button" variant="premiumInline" onClick={() => { void onAct({ action: "create_account", number, name, accountType }); onClose(); }}>Créer</ActionButton>
    </Drawer>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/30">
      <button type="button" className="h-full flex-1" aria-label="Fermer" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col gap-4 bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
        <button type="button" className="text-sm text-[#64748B]" onClick={onClose}>Fermer</button>
      </aside>
    </div>
  );
}

const field = "mt-1 w-full rounded-xl border border-[rgba(15,23,42,0.12)] px-3 py-2 text-sm";
