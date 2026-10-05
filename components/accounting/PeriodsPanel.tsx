"use client";

import { useState } from "react";
import { ActionButton, GlassCard } from "@/components/ui";
import { planOpenFollowingPeriod } from "@/lib/accounting/closePeriod";
import { formatChfAmount, formatSwissDate } from "@/lib/accounting/format";
import { coverageForPeriod } from "@/lib/accounting/onboarding";
import type { Period } from "./model";

export default function PeriodsPanel({
  periods,
  selectedPeriodId,
  openItems,
  canWrite,
  startDate,
  historyPending,
  onSelect,
  onAct,
}: {
  periods: Period[];
  selectedPeriodId?: string;
  openItems: {
    receivableTotal: number;
    payableTotal: number;
  } | null;
  canWrite: boolean;
  startDate?: string | null;
  historyPending?: boolean;
  onSelect: (periodId: string) => void;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [transfer, setTransfer] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#334155]">Vous pouvez commencer le nouvel exercice tout en terminant le précédent.</p>
      {startDate ? (
        <p className="text-sm text-[#64748B]">La comptabilité Obillz a démarré le {formatSwissDate(startDate)}. Cette date ne change pas la couverture des exercices suivants.</p>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-[#D6DEE8] bg-white">
        {periods.map((period) => {
          const selected = period.id === selectedPeriodId;
          const coverage = coverageForPeriod({
            period,
            accountingStartDate: startDate || null,
            historyPending,
          });
          const following = planOpenFollowingPeriod(period, periods);
          const next = following.action === "exists"
            ? periods.find((item) => item.startsOn === following.startsOn)
            : null;
          return (
            <article key={period.id} className={`border-b border-[#E2E8F0] px-4 py-3 last:border-b-0 ${selected ? "bg-[#F4F7FB]" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#0F172A]">Exercice {period.label}</h2>
                  <p className="mt-0.5 text-sm text-[#475569]">{formatSwissDate(period.startsOn)} – {formatSwissDate(period.endsOn)}</p>
                  <p className="mt-1 text-xs text-[#64748B]">Couverture {coverage.label.toLowerCase()}{selected ? " · exercice affiché" : ""}</p>
                  {coverage.note ? <p className="mt-1 max-w-xl text-xs text-[#475569]">{coverage.note}</p> : null}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${period.status === "closed" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-800"}`}>
                  {period.status === "closed" ? "Clôturé" : "Ouvert"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton type="button" variant={selected ? "premiumInline" : "ghost"} onClick={() => onSelect(period.id)}>
                  Consulter
                </ActionButton>
                {canWrite && period.status === "open" && following.action === "insert" ? (
                  <ActionButton type="button" variant="ghost" onClick={() => void onAct({ action: "open-next", periodId: period.id })}>
                    Ouvrir l'exercice suivant
                  </ActionButton>
                ) : null}
                {next ? (
                  <ActionButton type="button" variant="ghost" onClick={() => onSelect(next.id)}>
                    Consulter l'exercice {next.label}
                  </ActionButton>
                ) : null}
                {canWrite && period.status === "open" ? (
                  <ActionButton type="button" variant="ghost" onClick={() => setConfirmingId(period.id)}>
                    Clôturer {period.label}
                  </ActionButton>
                ) : null}
                {canWrite && period.status === "closed" ? (
                  <>
                    <input className="h-9 rounded-lg border border-[#D6DEE8] px-3 text-sm" placeholder="Motif de réouverture" value={reason} onChange={(event) => setReason(event.target.value)} />
                    <ActionButton type="button" variant="ghost" onClick={() => void onAct({ action: "reopen", periodId: period.id, reason })}>
                      Rouvrir {period.label}
                    </ActionButton>
                  </>
                ) : null}
              </div>
              {confirmingId === period.id ? (
                <div className="mt-3 space-y-2 rounded-lg border border-[#E2E8F0] bg-white p-3">
                  <p className="text-sm text-[#334155]">Confirmez la clôture de l'exercice {period.label}. Consulter un exercice ne le clôture pas.</p>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton type="button" variant="premiumInline" onClick={() => void onAct({ action: "close", periodId: period.id, transferResult: transfer, confirm: true })}>
                      Confirmer la clôture
                    </ActionButton>
                    <ActionButton type="button" variant="ghost" onClick={() => setConfirmingId(null)}>Annuler</ActionButton>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <details className="rounded-xl border border-[#D6DEE8] bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[#0F172A]">Explications et options</summary>
        <div className="mt-3 space-y-3 text-sm text-[#475569]">
          <p>Un exercice ouvert accepte les écritures de ses propres dates, même si l'exercice suivant a déjà commencé. Aucune consultation ne le clôture.</p>
          <p>Ouvrir l'exercice suivant ajoute seulement la période. Les soldes déjà suivis par les rapports ne sont pas recopiés.</p>
          {canWrite ? (
            <label className="flex items-start gap-2 text-[#334155]">
              <input type="checkbox" className="mt-1" checked={transfer} onChange={(event) => setTransfer(event.target.checked)} />
              <span>
                Reporter le bénéfice ou la perte sur les résultats des années précédentes
                <span className="mt-1 block text-xs text-[#64748B]">Compte 2900. Cette option n'est utilisée qu'au moment de confirmer une clôture.</span>
              </span>
            </label>
          ) : null}
        </div>
      </details>
      {openItems ? (
        <GlassCard padding="sm">
          <h2 className="text-sm font-semibold">Postes encore ouverts</h2>
          <p className="mt-1 text-xs text-[#64748B]">Ces montants ne sont pas des écritures.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[#64748B]">Clients et membres à encaisser</p>
              <p className="mt-1 font-semibold tabular-nums">{formatChfAmount(openItems.receivableTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Factures fournisseurs non payées</p>
              <p className="mt-1 font-semibold tabular-nums">{formatChfAmount(openItems.payableTotal)}</p>
            </div>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
