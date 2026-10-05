"use client";

import { useEffect, useState } from "react";
import { ActionButton, GlassCard } from "@/components/ui";
import { ACCOUNTING_SCOPE_NOTE } from "@/lib/accounting/copy";
import { formatSwissDate } from "@/lib/accounting/format";

export default function SettingsPanel({
  autoValidate,
  startDate,
  canWrite,
  payoutAccountId,
  bankAccounts,
  onAct,
}: {
  autoValidate: boolean;
  startDate?: string | null;
  canWrite: boolean;
  payoutAccountId?: string | null;
  bankAccounts: Array<{ id: string; number: string; name: string }>;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [validate, setValidate] = useState(autoValidate);
  const [bankId, setBankId] = useState(payoutAccountId || "");
  const [saving, setSaving] = useState<"validation" | "bank" | null>(null);

  useEffect(() => {
    setValidate(autoValidate);
  }, [autoValidate]);

  useEffect(() => {
    setBankId(payoutAccountId || "");
  }, [payoutAccountId]);

  async function save(section: "validation" | "bank") {
    setSaving(section);
    try {
      await onAct({
        action: "settings",
        autoValidate: section === "validation" ? validate : autoValidate,
        ...(section === "bank" ? { payoutAccountId: bankId || null } : {}),
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Début de la comptabilité</h2>
        <p className="mt-2 text-sm text-[#475569]">Les opérations antérieures à cette date ne sont pas comptabilisées.</p>
        <p className="mt-3 text-sm font-medium text-[#0F172A]">{startDate ? formatSwissDate(startDate) : "Date non indiquée"}</p>
      </GlassCard>

      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Comptes de trésorerie</h2>
        <p className="mt-2 text-sm text-[#475569]">Choisissez la banque qui reçoit l'argent versé par Stripe. Le produit n'est pas compté une seconde fois.</p>
        <label className="mt-4 block text-sm text-[#334155]">
          Banque qui reçoit les versements
          <select
            value={bankId}
            disabled={!canWrite}
            onChange={(event) => setBankId(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm"
          >
            <option value="">À choisir s'il y a plusieurs banques</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.number} {account.name}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-[#64748B]">Les encaissements Stripe passent d'abord par le compte Stripe, 1025.</p>
        {canWrite ? (
          <div className="mt-4">
            <ActionButton type="button" variant="premiumInline" onClick={() => void save("bank")}>
              {saving === "bank" ? "Enregistrement…" : "Enregistrer la banque"}
            </ActionButton>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard padding="sm">
        <h2 className="font-semibold text-[#0F172A]">Validation des opérations</h2>
        <p className="mt-2 text-sm text-[#475569]">Une écriture certaine entre dans les rapports. Une écriture incomplète reste à vérifier.</p>
        <label className="mt-4 flex items-start gap-2 text-sm text-[#334155]">
          <input type="checkbox" className="mt-1" checked={validate} disabled={!canWrite} onChange={(event) => setValidate(event.target.checked)} />
          <span>Valider automatiquement les écritures préparées par Obillz</span>
        </label>
        {canWrite ? (
          <div className="mt-4">
            <ActionButton type="button" variant="premiumInline" onClick={() => void save("validation")}>
              {saving === "validation" ? "Enregistrement…" : "Enregistrer la validation"}
            </ActionButton>
          </div>
        ) : null}
      </GlassCard>

      <details className="rounded-xl border border-[#D6DEE8] bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[#0F172A]">Options avancées</summary>
        <p className="mt-3 text-sm leading-relaxed text-[#475569]">{ACCOUNTING_SCOPE_NOTE}</p>
      </details>
    </div>
  );
}
