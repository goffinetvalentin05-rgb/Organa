"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { sourceLabel } from "@/lib/accounting/sources";
import { STATUS_LABEL, type Account, type Entry } from "./model";

export default function OverviewPanel({
  summary,
  review,
  accounts,
  entries,
  coverageNote,
}: {
  summary: Record<string, number>;
  review: { count: number; amount: number; entries: Entry[] };
  accounts: Account[];
  entries: Entry[];
  coverageNote?: string | null;
}) {
  const recent = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.entry_number - a.entry_number).slice(0, 5);
  const pending = review.entries.slice(0, 5);
  const byCategory = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status !== "validated" || entry.direction !== "in") continue;
    const account = accounts.find((item) => item.id === entry.category_account_id);
    const name = account?.name || "Autres";
    byCategory.set(name, (byCategory.get(name) || 0) + Number(entry.amount));
  }

  return (
    <div className="space-y-5">
      {coverageNote ? <p className="text-sm text-[#475569]">{coverageNote}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenus validés" value={formatChfAmount(summary.revenue || 0)} />
        <Stat label="Charges validées" value={formatChfAmount(summary.expense || 0)} />
        <Stat label="Résultat" value={formatChfAmount(summary.result || 0)} />
        <Stat label="Trésorerie" value={formatChfAmount(summary.treasury || 0)} hint={`Banque ${formatChfAmount(summary.bank || 0)} · Caisse ${formatChfAmount(summary.cash || 0)} · Stripe ${formatChfAmount(summary.stripe || 0)}`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className={action} href="/tableau-de-bord/comptabilite/journal">Nouvelle écriture</Link>
        <Link className={quiet} href="/tableau-de-bord/comptabilite/a-verifier">Écritures à vérifier ({review.count})</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard padding="sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#0F172A]">Dernières écritures</h2>
            <Link href="/tableau-de-bord/comptabilite/journal" className="text-sm font-semibold text-[#1A23FF]">Journal</Link>
          </div>
          <ul className="mt-3 divide-y divide-[#F1F5F9]">
            {recent.length === 0 ? <li className="py-3 text-sm text-[#64748B]">Aucune écriture.</li> : null}
            {recent.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="block font-medium text-[#0F172A]">{entry.description}</span>
                  <span className="text-xs text-[#64748B]">{formatSwissDate(entry.entry_date)} · {sourceLabel(entry.source_type)} · {STATUS_LABEL[entry.status] || entry.status}</span>
                </span>
                <span className="tabular-nums font-medium">{formatChfAmount(Number(entry.amount))}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard padding="sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#0F172A]">À vérifier</h2>
            <Link href="/tableau-de-bord/comptabilite/a-verifier" className="text-sm font-semibold text-[#1A23FF]">Voir</Link>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">{review.count} opération{review.count > 1 ? "s" : ""} · {formatChfAmount(review.amount || 0)} hors chiffres validés</p>
          <ul className="mt-3 divide-y divide-[#F1F5F9]">
            {pending.length === 0 ? <li className="py-3 text-sm text-[#64748B]">Rien en attente.</li> : null}
            {pending.map((entry) => (
              <li key={entry.id} className="flex justify-between gap-3 py-2.5 text-sm">
                <span>{entry.party_name || entry.description}</span>
                <span className="tabular-nums">{formatChfAmount(Number(entry.amount))}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Répartition des revenus validés</h2>
        <ul className="mt-3 space-y-2">
          {[...byCategory.entries()].length === 0 ? <li className="text-sm text-[#64748B]">Aucun revenu validé.</li> : null}
          {[...byCategory.entries()].map(([name, amount]) => (
            <li key={name} className="flex justify-between text-sm">
              <span>{name}</span>
              <span className="tabular-nums">{formatChfAmount(amount)}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-[#0F172A]">{value}</p>
      {hint ? <p className="mt-2 text-xs text-[#64748B]">{hint}</p> : null}
    </div>
  );
}

const action = "rounded-full bg-[#1A23FF] px-4 py-2 text-sm font-semibold text-white";
const quiet = "rounded-full bg-[#F1F5F9] px-4 py-2 text-sm font-medium text-[#334155]";
