"use client";

import { useState } from "react";
import { ActionButton, GlassCard } from "@/components/ui";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import type { Period } from "./model";

export default function PeriodsPanel({
  periods,
  openItems,
  canWrite,
  startDate,
  coverageNote,
  coverageType,
  onAct,
}: {
  periods: Period[];
  openItems: {
    receivableTotal: number;
    payableTotal: number;
  } | null;
  canWrite: boolean;
  startDate?: string | null;
  coverageNote?: string | null;
  coverageType?: string | null;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [transfer, setTransfer] = useState(false);

  return (
    <div className="space-y-4">
      {periods.map((period) => (
        <GlassCard key={period.id} padding="sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Exercice {period.label}</p>
              <h2 className="mt-1 text-lg font-semibold text-[#0F172A]">{formatSwissDate(period.startsOn)} – {formatSwissDate(period.endsOn)}</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${period.status === "closed" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-800"}`}>
              {period.status === "closed" ? "Clôturé" : "Ouvert"}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-[#64748B]">Démarrage Obillz</dt><dd className="font-medium">{startDate ? formatSwissDate(startDate) : "—"}</dd></div>
            <div><dt className="text-[#64748B]">Couverture</dt><dd className="font-medium">{coverageType === "partial_period" ? "Partielle" : "Complète"}</dd></div>
            <div><dt className="text-[#64748B]">Clôture</dt><dd className="font-medium">{period.status === "closed" ? "Exercice clôturé" : "Encore ouvert"}</dd></div>
          </dl>
          {coverageNote ? <p className="mt-3 text-sm text-[#475569]">{coverageNote}</p> : null}
          {canWrite && period.status === "open" ? (
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={transfer} onChange={(event) => setTransfer(event.target.checked)} />
                Reporter le résultat sur le compte 2900 après confirmation
              </label>
              <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "close", periodId: period.id, transferResult: transfer })}>Clôturer l’exercice</ActionButton>
            </div>
          ) : null}
          {canWrite && period.status === "closed" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Motif de réouverture" value={reason} onChange={(event) => setReason(event.target.value)} />
              <ActionButton type="button" variant="ghost" onClick={() => void onAct({ action: "reopen", periodId: period.id, reason })}>Rouvrir</ActionButton>
            </div>
          ) : null}
        </GlassCard>
      ))}
      {openItems ? (
        <GlassCard padding="sm">
          <h2 className="font-semibold">Postes ouverts</h2>
          <p className="mt-1 text-xs text-[#64748B]">Ces postes ne sont pas des écritures. Ils restent visibles à part.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#F8FAFC] p-3">
              <p className="text-xs text-[#64748B]">Clients et membres à encaisser</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatChfAmount(openItems.receivableTotal)}</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] p-3">
              <p className="text-xs text-[#64748B]">Factures fournisseurs non payées</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatChfAmount(openItems.payableTotal)}</p>
            </div>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
