"use client";

import { useEffect, useMemo, useState } from "react";
import AccountingModal from "@/components/accounting/AccountingModal";
import { formatSwissDate } from "@/lib/accounting/format";
import {
  openAllocationPeriods,
  planTransitory,
  proposedRecognitionDate,
  straddlingSuggestion,
  type BridgePeriod,
  type ExistingAccrual,
  type TransitoryPlan,
} from "@/lib/accounting/transitory";
import type { TransitoryFacts } from "@/lib/accounting/transitoryLoad";

type Preview = {
  accounting: boolean;
  today: string;
  total: number;
  remaining: number;
  categoryLabel: string;
  categoryAccount: { number: string; name: string } | null;
  accounts: Array<{ id: string; number: string; name: string }>;
  documentType?: string;
  documentStatus?: string;
  invoiceDate?: string | null;
  totalHt?: number;
  totalTva?: number;
  transitory?: TransitoryFacts | null;
};

export default function MarkPaidDialog({
  documentId,
  onClose,
  onDone,
}: {
  documentId: string;
  onClose: () => void;
  onDone: (status: string) => void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [receivedOn, setReceivedOn] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [otherPeriod, setOtherPeriod] = useState(false);
  const [productPeriodId, setProductPeriodId] = useState("");
  const [recognitionDate, setRecognitionDate] = useState("");
  const [recognitionTouched, setRecognitionTouched] = useState(false);

  useEffect(() => {
    const key = crypto.randomUUID();
    setIdempotencyKey(key);
    let cancelled = false;
    void fetch(`/api/documents/${documentId}/receipt`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de préparer l'encaissement");
        if (cancelled) return;
        setPreview(data);
        setReceivedOn(data.today);
        setAmount(String(data.remaining));
        setAccountId(data.accounts?.[0]?.id || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible de préparer l'encaissement");
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const facts = preview?.transitory;
  const openPeriods = facts ? openAllocationPeriods(facts.periods) : [];
  const suggestion = preview && facts
    ? straddlingSuggestion({
        invoiceDate: preview.invoiceDate || null,
        paymentDate: receivedOn,
        periods: facts.periods,
      })
    : null;
  const coversExisting = Boolean(
    facts?.existingAccrual && Number(amount) > 0 && Number(amount) <= facts.existingAccrual.openAmount,
  );

  useEffect(() => {
    if (!otherPeriod || recognitionTouched || coversExisting) return;
    const period = openPeriods.find((item) => item.id === productPeriodId);
    if (!period || !receivedOn) return;
    setRecognitionDate(proposedRecognitionDate(period, receivedOn));
  }, [coversExisting, openPeriods, otherPeriod, productPeriodId, receivedOn, recognitionTouched]);

  const plan: TransitoryPlan | null = useMemo(() => {
    if (!otherPeriod || !preview || !facts?.ready || !facts.revenueAccountId) return null;
    const existing = facts.existingAccrual;
    return planTransitory({
      invoiceTotal: preview.total,
      alreadyReceived: facts.received,
      paymentAmount: Number(amount),
      paymentDate: receivedOn,
      documentType: preview.documentType || "invoice",
      documentStatus: preview.documentStatus || "",
      totalHt: preview.totalHt || 0,
      totalTva: preview.totalTva || 0,
      totalTtc: preview.total,
      periods: facts.periods,
      productPeriodId: coversExisting ? existing?.periodId || null : productPeriodId || null,
      recognitionDate: coversExisting ? null : recognitionDate || null,
      treasuryAccountId: accountId,
      revenueAccountId: facts.revenueAccountId,
      accounts: facts.accounts,
      regularized: facts.regularized,
      settled: facts.settled,
      released: facts.released,
      existingAccrual: existing,
      preferredClearingId: facts.preferredClearingId,
    });
  }, [accountId, amount, coversExisting, facts, otherPeriod, preview, productPeriodId, receivedOn, recognitionDate]);

  const submit = async () => {
    if (!preview || saving) return;
    if (otherPeriod && (!plan || !plan.ok)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/documents/${documentId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receivedOn,
          amount: Number(amount),
          accountId: preview.accounting ? accountId : null,
          idempotencyKey,
          transitory: otherPeriod
            ? {
                productPeriodId: plan && plan.ok ? plan.productPeriodId : productPeriodId || null,
                recognitionDate: plan && plan.ok ? plan.recognitionDate : recognitionDate || null,
              }
            : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "L'encaissement n'a pas été enregistré");
      onDone(String(data.status));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "L'encaissement n'a pas été enregistré");
      setSaving(false);
    }
  };

  return (
    <AccountingModal title="Encaissement reçu" onClose={onClose}>
      <p className="text-sm text-[#475569]">
        L'écriture est passée à la date où le club a reçu l'argent. Le document passe à Payée quand le total est encaissé.
      </p>
      {!preview && !error ? <p className="text-sm text-[#64748B]">Chargement…</p> : null}
      {preview ? (
        <>
          <label className="block text-sm text-[#334155]">
            Date de réception
            <input
              type="date"
              value={receivedOn}
              onChange={(event) => setReceivedOn(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm"
            />
          </label>
          {preview.accounting ? (
            <label className="block text-sm text-[#334155]">
              Compte qui a reçu l'argent
              <select
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm"
              >
                {preview.accounts.length === 0 ? <option value="">Aucun compte de trésorerie</option> : null}
                {preview.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.number} {account.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-sm text-[#334155]">
            Montant reçu (CHF)
            <input
              type="number"
              min="0"
              step="0.05"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm"
            />
          </label>
          <p className="text-xs text-[#64748B]">
            Produit : {preview.categoryLabel}
            {preview.categoryAccount ? ` · ${preview.categoryAccount.number} ${preview.categoryAccount.name}` : ""}
            . Reste à encaisser : CHF {preview.remaining.toFixed(2)}.
          </p>
          {suggestion && !otherPeriod ? <p className="text-xs text-[#64748B]">{suggestion}</p> : null}
          {preview.documentType === "invoice" && preview.accounting ? (
            <div className="space-y-2">
              <button
                type="button"
                className="text-xs text-[#64748B] underline"
                onClick={() => setPanelOpen((open) => !open)}
              >
                Transitoire
              </button>
              {panelOpen ? (
                <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  {!facts ? <p className="text-xs text-[#475569]">L'option Transitoire n'a pas pu être préparée. L'encaissement normal reste disponible.</p> : null}
                  {facts && !facts.ready ? <p className="text-xs text-[#475569]">{facts.notice}</p> : null}
                  {facts?.ready ? (
                    <>
                      <label className="flex items-start gap-2 text-sm text-[#334155]">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={otherPeriod}
                          onChange={(event) => setOtherPeriod(event.target.checked)}
                        />
                        Ce paiement concerne un autre exercice
                      </label>
                      {otherPeriod ? (
                        <TransitoryFields
                          openPeriods={openPeriods}
                          productPeriodId={productPeriodId}
                          recognitionDate={recognitionDate}
                          coversExisting={coversExisting}
                          existing={facts.existingAccrual}
                          plan={plan}
                          onPeriod={(value) => {
                            setProductPeriodId(value);
                            setRecognitionTouched(false);
                          }}
                          onDate={(value) => {
                            setRecognitionTouched(true);
                            setRecognitionDate(value);
                          }}
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="rounded-lg px-3 py-1.5 text-sm text-[#475569]" onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          disabled={!preview || saving || (preview.accounting && !accountId) || (otherPeriod && (!plan || !plan.ok))}
          onClick={() => void submit()}
          className="rounded-lg bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Confirmer l'encaissement"}
        </button>
      </div>
    </AccountingModal>
  );
}

function TransitoryFields({
  openPeriods,
  productPeriodId,
  recognitionDate,
  coversExisting,
  existing,
  plan,
  onPeriod,
  onDate,
}: {
  openPeriods: BridgePeriod[];
  productPeriodId: string;
  recognitionDate: string;
  coversExisting: boolean;
  existing: ExistingAccrual | null;
  plan: TransitoryPlan | null;
  onPeriod: (value: string) => void;
  onDate: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {coversExisting && existing ? (
        <p className="text-xs text-[#334155]">
          Régularisation existante {existing.entryId} dans l'exercice {existing.periodLabel}
          {existing.periodStatus === "closed" ? " (clôturé, affiché à titre informatif)" : ""}. Le solde ouvert est de CHF {existing.openAmount.toFixed(2)}.
        </p>
      ) : (
        <>
          <label className="block text-xs text-[#334155]">
            Exercice du produit
            <select
              value={productPeriodId}
              onChange={(event) => onPeriod(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6DEE8] bg-white px-2 py-1.5 text-sm"
            >
              <option value="">Choisir un exercice ouvert</option>
              {openPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  Exercice {period.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[#334155]">
            Date de rattachement du produit
            <input
              type="date"
              value={recognitionDate}
              onChange={(event) => onDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#D6DEE8] bg-white px-2 py-1.5 text-sm"
            />
          </label>
        </>
      )}
      {plan && plan.ok ? (
        <div className="space-y-1 text-xs text-[#475569]">
          <p>{plan.explanation}</p>
          {plan.info ? <p>{plan.info}</p> : null}
          <ul className="space-y-1">
            {plan.preview.map((line) => (
              <li key={`${line.periodLabel}-${line.date}-${line.text}`}>
                Exercice {line.periodLabel}, {formatSwissDate(line.date)} : {line.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {plan && !plan.ok ? <p className="text-xs text-rose-700">{plan.message}</p> : null}
    </div>
  );
}
