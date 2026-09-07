"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PayStatus = "pending" | "paid" | "cancelled";

type QuotePayDto = {
  title: string;
  numero: string | null;
  memberName: string;
  amount: number;
  currency: string;
  status: PayStatus;
  dueDate: string | null;
  paymentMethod: "qr_invoice" | "stripe";
  canPay: boolean;
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  error?: string;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: currency || "CHF",
  }).format(amount);
}

export default function MembershipPayClient({
  token,
  mode = "pay",
}: {
  token: string;
  mode?: "pay" | "success";
}) {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";
  const [data, setData] = useState<QuotePayDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/cotisations/${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as QuotePayDto;
      if (!res.ok) throw new Error(json.error || "Cotisation introuvable.");
      setData(json);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger la cotisation.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (mode !== "success" || !data || data.status === "paid") return;
    const timer = window.setTimeout(() => {
      void load();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [mode, data, load]);

  const startCheckout = async () => {
    if (!data?.canPay || paying) return;
    setPaying(true);
    try {
      const res = await fetch(
        `/api/public/cotisations/${encodeURIComponent(token)}/checkout`,
        { method: "POST" }
      );
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Impossible d’ouvrir le paiement.");
      }
      window.location.href = json.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible d’ouvrir le paiement.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Chargement…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-4">
        <div className="max-w-md rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-base font-semibold text-[#0F172A]">Lien invalide</p>
          <p className="mt-2 text-sm text-[#64748B]">{error || "Cotisation introuvable."}</p>
        </div>
      </div>
    );
  }

  const paid = data.status === "paid";
  const cancelledQuote = data.status === "cancelled";
  const color = data.primaryColor || "#1A23FF";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-4 py-10">
      <div className="w-full max-w-lg rounded-[1.5rem] bg-white px-6 py-8 shadow-sm">
        <div className="flex items-center gap-3">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt=""
              className="h-12 w-12 rounded-xl object-contain"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {data.clubName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#64748B]">Cotisation</p>
            <h1 className="text-lg font-semibold text-[#0F172A]">{data.clubName}</h1>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm">
          <Row label="Intitulé" value={data.title} />
          {data.numero ? <Row label="Référence" value={data.numero} /> : null}
          <Row label="Membre" value={data.memberName} />
          <Row label="Montant" value={formatAmount(data.amount, data.currency)} />
          <Row
            label="Statut"
            value={
              paid ? "Payée" : cancelledQuote ? "Annulée" : "À payer"
            }
          />
        </div>

        {mode === "success" ? (
          <p className="mt-6 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm leading-relaxed text-[#475569]">
            {paid
              ? "Votre paiement a été confirmé. Merci."
              : "Votre paiement est en cours de confirmation. Cette page ne suffit pas à marquer la cotisation comme payée : la confirmation est automatique dès réception du paiement."}
          </p>
        ) : null}

        {cancelled && !paid ? (
          <p className="mt-4 text-sm text-amber-800">Le paiement a été interrompu. Vous pouvez réessayer.</p>
        ) : null}

        {mode === "pay" && data.canPay ? (
          <button
            type="button"
            disabled={paying}
            onClick={() => void startCheckout()}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            {paying ? "Redirection…" : "Payer ma cotisation"}
          </button>
        ) : null}

        {mode === "pay" && paid ? (
          <p className="mt-6 text-center text-sm font-medium text-emerald-700">Cette cotisation est déjà payée.</p>
        ) : null}

        {cancelledQuote ? (
          <p className="mt-6 text-center text-sm text-[#64748B]">Cette cotisation n’est plus payable.</p>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[#94A3B8]">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-[#0F172A]">{value}</span>
    </div>
  );
}
