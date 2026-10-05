"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui";
import AccountingModal from "./AccountingModal";
import { ACCOUNT_CLASS_LABELS } from "@/lib/accounting/chart";
import { formatChfAmount } from "@/lib/accounting/format";
import { isOfficialStatus, signedBalance, type Account, type AccountGroup, type Entry, type JournalLine } from "./model";

const GROUPS: Array<{ title: string; types: string[] }> = [
  { title: "Actifs", types: ["asset"] },
  { title: "Passifs", types: ["liability"] },
  { title: "Capitaux propres", types: ["equity"] },
  { title: "Produits", types: ["revenue"] },
  { title: "Charges", types: ["expense"] },
];

export default function ChartPanel({
  accounts,
  balances,
  entries = [],
  linesByEntry = {},
  canWrite,
  groups = [],
  extensionsReady = true,
  onAct,
}: {
  accounts: Account[];
  balances: Map<string, number>;
  entries?: Entry[];
  linesByEntry?: Record<string, JournalLine[]>;
  canWrite: boolean;
  groups?: AccountGroup[];
  extensionsReady?: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);
  const [groupEditor, setGroupEditor] = useState<AccountGroup | "new" | null>(null);
  const groupByAccount = new Map<string, AccountGroup>();
  for (const group of groups) {
    for (const accountId of group.accountIds) groupByAccount.set(accountId, group);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748B]">Soldes des écritures validées et extournées.</p>
        <div className="flex flex-wrap gap-2">
          {canWrite ? <ActionButton type="button" variant="premiumInline" onClick={() => setCreating(true)}>Nouveau compte</ActionButton> : null}
          {canWrite && extensionsReady ? <ActionButton type="button" variant="ghost" onClick={() => setGroupEditor("new")}>Nouvelle rubrique</ActionButton> : null}
        </div>
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
                  <th className="px-3 py-2 text-right">Solde d’ouverture</th>
                  <th className="px-3 py-2 text-right">Mouvements débit</th>
                  <th className="px-3 py-2 text-right">Mouvements crédit</th>
                  <th className="px-3 py-2 text-right">Solde actuel</th>
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
                      <span className="ml-2 rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-medium text-[#475569]">Compte</span>
                      {groupByAccount.get(account.id) ? <span className="mt-0.5 block text-[11px] text-[#64748B]">Inclus dans la rubrique {groupByAccount.get(account.id)?.number}</span> : null}
                      <span className="mt-0.5 block text-[11px] text-[#94A3B8]">{ACCOUNT_CLASS_LABELS[account.accountClass]}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatChfAmount(movementOf(account, entries, linesByEntry).opening)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatChfAmount(movementOf(account, entries, linesByEntry).debit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatChfAmount(movementOf(account, entries, linesByEntry).credit)}</td>
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
      <section className="overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white">
        <h2 className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm font-semibold text-[#0F172A]">Rubriques de regroupement</h2>
        <div className="px-4 py-3 text-sm text-[#475569]">
          {extensionsReady ? "Une rubrique additionne les comptes choisis. Elle ne reçoit pas d’écritures et ne change pas les totaux." : "Les rubriques demandent la migration 103. Le plan actuel reste inchangé."}
          {groups.length === 0 && extensionsReady ? <p className="mt-2">Aucun regroupement. Le plan s’affiche compte par compte.</p> : null}
        </div>
        {groups.length > 0 ? (
          <table className="w-full text-sm">
            <tbody>
              {groups.map((group) => {
                const members = accounts.filter((account) => group.accountIds.includes(account.id));
                const total = members.reduce((sum, account) => sum + (balances.get(account.id) || 0), 0);
                return (
                  <tr key={group.id} className="border-t border-[#F1F5F9]">
                    <td className="px-4 py-2 font-mono font-medium">{group.number}</td>
                    <td className="px-3 py-2">
                      {group.name}
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">Rubrique</span>
                      <span className="mt-0.5 block text-[11px] text-[#64748B]">{members.map((account) => account.number).join(", ") || "Aucun compte"}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatChfAmount(total)}</td>
                    <td className="px-3 py-2 text-right">
                      {canWrite ? (
                        <span className="space-x-3">
                          <button type="button" className="text-sm font-semibold text-[#1A23FF]" onClick={() => setGroupEditor(group)}>Modifier</button>
                          <button type="button" className="text-sm font-semibold text-rose-700" onClick={() => { if (window.confirm(`Retirer la rubrique ${group.number} ? Les écritures et les comptes restent en place.`)) void onAct({ action: "group-remove", groupId: group.id }); }}>Retirer</button>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </section>
      {editing ? <EditAccount account={editing} onClose={() => setEditing(null)} onAct={onAct} /> : null}
      {creating ? <CreateAccount onClose={() => setCreating(false)} onAct={onAct} /> : null}
      {groupEditor ? (
        <GroupEditor
          group={groupEditor === "new" ? null : groupEditor}
          accounts={accounts}
          groups={groups}
          onClose={() => setGroupEditor(null)}
          onAct={onAct}
        />
      ) : null}
    </div>
  );
}

function movementOf(account: Account, entries: Entry[], linesByEntry: Record<string, JournalLine[]>) {
  let opening = 0;
  let debit = 0;
  let credit = 0;
  for (const entry of entries) {
    if (!isOfficialStatus(entry.status)) continue;
    for (const line of linesByEntry[entry.id] || []) {
      if (line.accountId !== account.id) continue;
      if (entry.source_type === "opening") opening += signedBalance(account.accountType, line.debit, line.credit);
      else {
        debit += line.debit;
        credit += line.credit;
      }
    }
  }
  return { opening, debit, credit };
}

function EditAccount({
  account,
  onClose,
  onAct,
}: {
  account: Account;
  onClose: () => void;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
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
    <AccountingModal title="Modifier le compte" onClose={onClose}>
      <label className="block text-sm">Libellé
        <input className={field} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {account.isSystem ? <p className="text-xs text-[#64748B]">Le numéro d’un compte système ne change pas.</p> : (
        <label className="block text-sm">Numéro
          <input className={field} value={number} onChange={(event) => setNumber(event.target.value)} />
        </label>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="rounded-full px-3 py-1.5 text-sm text-[#475569]" onClick={onClose}>Annuler</button>
        <ActionButton type="button" variant="premiumInline" onClick={save}>Enregistrer</ActionButton>
      </div>
    </AccountingModal>
  );
}

function CreateAccount({ onClose, onAct }: { onClose: () => void; onAct: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("expense");
  return (
    <AccountingModal title="Créer un compte" onClose={onClose}>
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
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="rounded-full px-3 py-1.5 text-sm text-[#475569]" onClick={onClose}>Annuler</button>
        <ActionButton type="button" variant="premiumInline" onClick={() => { void onAct({ action: "create_account", number, name, accountType }); onClose(); }}>Créer</ActionButton>
      </div>
    </AccountingModal>
  );
}

function GroupEditor({
  group,
  accounts,
  groups,
  onClose,
  onAct,
}: {
  group: AccountGroup | null;
  accounts: Account[];
  groups: AccountGroup[];
  onClose: () => void;
  onAct: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const [number, setNumber] = useState(group?.number || "");
  const [name, setName] = useState(group?.name || "");
  const [accountIds, setAccountIds] = useState<string[]>(group?.accountIds || []);
  const taken = new Set(groups.filter((item) => item.id !== group?.id).flatMap((item) => item.accountIds));

  function toggle(id: string) {
    setAccountIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <AccountingModal title={group ? "Modifier la rubrique" : "Nouvelle rubrique"} onClose={onClose}>
      <p className="text-xs text-[#64748B]">La rubrique affiche la somme des comptes cochés. Exemple : 1020 totalise 1021, 1022, 1023 et 1024, si 1020 n’est pas déjà un compte.</p>
      <label className="block text-sm">Numéro de rubrique
        <input className={field} value={number} onChange={(event) => setNumber(event.target.value)} />
      </label>
      <label className="block text-sm">Nom
        <input className={field} value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <div className="max-h-56 space-y-1 overflow-auto rounded-xl border border-[#E2E8F0] p-2">
        {accounts.filter((account) => account.isActive).map((account) => (
          <label key={account.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={accountIds.includes(account.id)} disabled={taken.has(account.id)} onChange={() => toggle(account.id)} />
            <span className="font-mono">{account.number}</span>
            <span>{account.name}</span>
            {taken.has(account.id) ? <span className="text-[11px] text-[#94A3B8]">Déjà regroupé</span> : null}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="rounded-full px-3 py-1.5 text-sm text-[#475569]" onClick={onClose}>Annuler</button>
        <ActionButton type="button" variant="premiumInline" onClick={() => { void onAct({ action: "group-save", groupId: group?.id, number, name, accountIds }); onClose(); }}>Enregistrer</ActionButton>
      </div>
    </AccountingModal>
  );
}

const field = "mt-1 w-full rounded-xl border border-[rgba(15,23,42,0.12)] px-3 py-2 text-sm";
