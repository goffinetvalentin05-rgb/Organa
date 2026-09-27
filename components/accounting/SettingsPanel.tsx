"use client";

import { GlassCard } from "@/components/ui";
import { ACCOUNTING_SCOPE_NOTE } from "@/lib/accounting/copy";
import { formatSwissDate } from "@/lib/accounting/format";

export default function SettingsPanel({
  autoValidate,
  startDate,
  coverageNote,
  canWrite,
  payoutAccountId,
  bankAccounts,
  onAct,
}: {
  autoValidate: boolean;
  startDate?: string | null;
  coverageNote?: string | null;
  canWrite: boolean;
  payoutAccountId?: string | null;
  bankAccounts: Array<{ id: string; number: string; name: string }>;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Date de départ</h2>
        <p className="mt-2 text-sm">La comptabilité Obillz commence le <span className="font-medium">{startDate ? formatSwissDate(startDate) : "—"}</span>.</p>
        {coverageNote ? <p className="mt-2 text-sm text-[#475569]">{coverageNote}</p> : null}
      </GlassCard>
      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Validation automatique</h2>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoValidate}
            disabled={!canWrite}
            onChange={(event) => void onAct({ action: "settings", autoValidate: event.target.checked })}
          />
          <span>
            Valider automatiquement les écritures générées par Obillz
            <span className="mt-1 block text-xs text-[#64748B]">
              Uniquement lorsque le montant, la date, le compte financier, la catégorie et la source sont certains. Une hypothèse n’est jamais validée.
            </span>
          </span>
        </label>
      </GlassCard>
      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Périmètre</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#475569]">{ACCOUNTING_SCOPE_NOTE}</p>
      </GlassCard>
      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Versements Stripe</h2>
        <p className="mt-2 text-sm text-[#475569]">
          Les encaissements Stripe sont passés sur le compte 1025. Quand Stripe verse l'argent, il est transféré vers la banque choisie, sans repasser le produit.
        </p>
        <label className="mt-3 block text-sm text-[#334155]">
          Compte bancaire qui reçoit les versements
          <select
            value={payoutAccountId || ""}
            disabled={!canWrite}
            onChange={(event) => void onAct({
              action: "settings",
              autoValidate,
              payoutAccountId: event.target.value || null,
            })}
            className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm"
          >
            <option value="">Choisir si le club a plusieurs banques</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.number} {account.name}
              </option>
            ))}
          </select>
        </label>
      </GlassCard>
    </div>
  );
}
