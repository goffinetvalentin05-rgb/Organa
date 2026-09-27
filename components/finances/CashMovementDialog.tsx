"use client";

import { useEffect, useState } from "react";
import AccountingModal from "@/components/accounting/AccountingModal";

type Preview = {
  accounting: boolean;
  today: string;
  title: string;
  total: number;
  remaining: number;
  categoryAccountId: string | null;
  accounts: Array<{ id: string; number: string; name: string }>;
  categories: Array<{ id: string; number: string; name: string }>;
};

export default function CashMovementDialog({
  endpoint,
  title,
  dateLabel,
  accountLabel,
  categoryLabel,
  confirmLabel,
  onClose,
  onDone,
}: {
  endpoint: string;
  title: string;
  dateLabel: string;
  accountLabel: string;
  categoryLabel: string;
  confirmLabel: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [paidOn, setPaidOn] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
    let cancelled = false;
    void fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de préparer le paiement");
        if (cancelled) return;
        setPreview(data);
        setPaidOn(data.today);
        setAmount(String(data.remaining));
        setAccountId("");
        setCategoryId(data.categoryAccountId || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Impossible de préparer le paiement");
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const categoryMissing = Boolean(preview?.accounting && !categoryId);
  const accountMissing = Boolean(preview?.accounting && !accountId);

  const submit = async () => {
    if (!preview || saving || categoryMissing || accountMissing) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidOn,
          amount: Number(amount),
          accountId: preview.accounting ? accountId : null,
          categoryAccountId: preview.accounting ? categoryId : null,
          idempotencyKey,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Le paiement n'a pas été enregistré");
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Le paiement n'a pas été enregistré");
      setSaving(false);
    }
  };

  return (
    <AccountingModal title={title} onClose={onClose}>
      <p className="text-sm text-[#475569]">
        {preview ? `${preview.title}. ` : ""}L'écriture est passée à la date réelle du paiement, pour le montant confirmé.
      </p>
      {!preview && !error ? <p className="text-sm text-[#64748B]">Chargement…</p> : null}
      {preview ? (
        <>
          <label className="block text-sm text-[#334155]">
            {dateLabel}
            <input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm" />
          </label>
          {preview.accounting ? (
            <label className="block text-sm text-[#334155]">
              {accountLabel}
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm">
                {preview.accounts.length === 0 ? <option value="">Aucun compte de trésorerie</option> : null}
                {preview.accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.number} {account.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          {preview.accounting ? (
            <label className="block text-sm text-[#334155]">
              {categoryLabel}
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm">
                <option value="">Choisir une catégorie</option>
                {preview.categories.map((account) => (
                  <option key={account.id} value={account.id}>{account.number} {account.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-sm text-[#334155]">
            Montant (CHF)
            <input type="number" min="0" step="0.05" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-[#D6DEE8] px-3 py-2 text-sm" />
          </label>
          <p className="text-xs text-[#64748B]">Montant de l'opération : CHF {preview.total.toFixed(2)}. Une confirmation crée une seule écriture.</p>
        </>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="rounded-lg px-3 py-1.5 text-sm text-[#475569]" onClick={onClose}>Annuler</button>
        <button
          type="button"
          disabled={!preview || saving || categoryMissing || accountMissing}
          onClick={() => void submit()}
          className="rounded-lg bg-[#0F172A] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : confirmLabel}
        </button>
      </div>
    </AccountingModal>
  );
}
