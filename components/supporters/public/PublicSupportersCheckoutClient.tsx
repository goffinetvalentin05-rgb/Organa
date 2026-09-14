"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicClubLogo from "@/components/public/PublicClubLogo";
import { getClubBrandPalette } from "@/lib/public-page/colors";
import { formatChf } from "@/lib/shop/money";
import { durationLabel } from "@/lib/supporters/format";
import type { PublicSupportersPage } from "@/lib/supporters/types";

export default function PublicSupportersCheckoutClient({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offer") || "";
  const [page, setPage] = useState<PublicSupportersPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [publicNameEnabled, setPublicNameEnabled] = useState(true);

  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      setError("Paiement annulé. Vous pouvez réessayer.");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch(`/api/public/supporters/${slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPage(data);
        else setError("Page introuvable");
      })
      .catch(() => setError("Impossible de charger l’offre"));
  }, [slug]);

  const offer = useMemo(
    () => page?.offers.find((o) => o.id === offerId) || page?.offers[0] || null,
    [page, offerId]
  );

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/supporters/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          firstName,
          lastName,
          email,
          phone,
          publicNameEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout impossible");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSubmitting(false);
    }
  };

  if (!page) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        {error || "Chargement…"}
      </div>
    );
  }

  const palette = getClubBrandPalette(page.primaryColor);
  const fieldClass =
    "w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 py-3 text-sm";

  if (!offer) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Offre introuvable</h1>
          <button
            type="button"
            className="mt-4 text-sm font-semibold"
            style={{ color: page.primaryColor }}
            onClick={() => router.push(`/club/${slug}/supporters`)}
          >
            Retour aux offres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: palette.pageBackground }}>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <PublicClubLogo
            logoUrl={page.logoUrl}
            clubName={page.clubName}
            accentColor={page.primaryColor}
            size="md"
          />
          <h1 className="mt-4 text-2xl font-semibold">Devenir supporter</h1>
        </div>
        {error ? (
          <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <form onSubmit={pay} className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 rounded-[1.25rem] bg-white p-5 shadow-sm lg:col-span-3">
            <h2 className="font-semibold">Vos informations</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={fieldClass}
                required
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className={fieldClass}
                required
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              className={fieldClass}
              required
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={fieldClass}
              type="tel"
              placeholder="Téléphone (facultatif)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-[#1A23FF]"
                checked={publicNameEnabled}
                onChange={(e) => setPublicNameEnabled(e.target.checked)}
              />
              <span>
                Je souhaite que mon nom apparaisse publiquement sur le mur des supporters.
              </span>
            </label>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Vous pourrez apparaître parmi les supporters du club. Votre e-mail et vos
              informations personnelles ne seront jamais affichés publiquement.
            </p>
          </div>
          <div className="rounded-[1.25rem] bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-semibold">Récapitulatif</h2>
            <p className="mt-4 text-sm text-[#64748B]">{page.clubName}</p>
            <p className="mt-1 text-lg font-semibold">{offer.name}</p>
            <p className="text-sm text-[#64748B]">
              {durationLabel({
                durationType: offer.durationType,
                startDate: offer.startDate,
                endDate: offer.endDate,
              })}
            </p>
            <p className="mt-4 text-2xl font-semibold">{formatChf(offer.priceCents)}</p>
            <button
              type="submit"
              disabled={submitting || !page.canCheckout || offer.soldOut}
              className="mt-6 w-full rounded-full py-3.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: page.primaryColor }}
            >
              {submitting ? "Redirection…" : `Payer ${formatChf(offer.priceCents)}`}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
