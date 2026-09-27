"use client";

import { useEffect, useState } from "react";
import AccountingModal from "@/components/accounting/AccountingModal";

type Preview = {
  accounting: boolean;
  today: string;
  total: number;
  remaining: number;
  categoryLabel: string;
  categoryAccount: { number: string; name: string } | null;
  accounts: Array<{ id: string; number: string; name: string }>;
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

  const submit = async () => {
    if (!preview || saving) return;
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
        </>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="rounded-lg px-3 py-1.5 text-sm text-[#475569]" onClick={onClose}>
          Annuler
        </button>
        <button
          type="button"
          disabled={!preview || saving || (preview.accounting && !accountId)}
          onClick={() => void submit()}
          className="rounded-lg bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Confirmer l'encaissement"}
        </button>
      </div>
    </AccountingModal>
  );
}
