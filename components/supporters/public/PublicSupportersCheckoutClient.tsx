"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "@/lib/icons";
import { formatChf } from "@/lib/shop/money";
import { durationLabel } from "@/lib/supporters/format";
import type { PublicSupportersPage } from "@/lib/supporters/types";
import { ctaColors, pageSurfaceStyle, supportersPalette } from "@/lib/supporters/theme";
import SupportersClubMark from "./SupportersClubMark";

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

  const theme = page.theme || {
    label: "Supporters",
    title: `Soutenez le ${page.clubName}`,
    subtitle: "",
    primaryColor: page.primaryColor,
    secondaryColor: page.primaryColor,
    pageStyle: "colors" as const,
    imagePosition: "center" as const,
    overlayIntensity: "normal" as const,
    bannerUrl: null,
    showStats: true,
  };
  const palette = supportersPalette(theme);
  const cta = ctaColors(theme.primaryColor, theme.secondaryColor);
  const fieldClass =
    "min-h-12 w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 text-base text-[#0F172A] outline-none transition focus:border-[#1A23FF] focus:ring-2 focus:ring-[rgba(26,35,255,0.18)] sm:text-sm";

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
    <div className="min-h-[100dvh]" style={pageSurfaceStyle(palette, false)}>
      <header
        className="border-b border-white/10"
        style={{ background: palette.headerGradient }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
            <SupportersClubMark
              logoUrl={page.logoUrl}
              clubName={page.clubName}
              accentColor={theme.primaryColor}
              size="sm"
              onDark
              className="mx-0"
            />
          <div className="min-w-0 text-left text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              Supporters
            </p>
            <p className="truncate text-sm font-semibold">{page.clubName}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={`/club/${slug}/supporters`}
          className="text-sm font-medium text-[#64748B] hover:text-[#0F172A]"
        >
          ← Retour aux offres
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Devenir supporter</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#64748B]">
          Vos informations restent privées. Seul un prénom public peut apparaître sur le mur, si vous
          l’acceptez.
        </p>

        {error ? (
          <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <form onSubmit={pay} className="mt-7 grid items-start gap-5 lg:grid-cols-5">
          <div className="space-y-4 rounded-[1.5rem] border border-[rgba(15,23,42,0.06)] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:col-span-3">
            <h2 className="text-lg font-semibold">Vos informations</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={fieldClass}
                required
                placeholder="Prénom"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className={fieldClass}
                required
                placeholder="Nom"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              className={fieldClass}
              required
              type="email"
              autoComplete="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={fieldClass}
              type="tel"
              autoComplete="tel"
              placeholder="Téléphone (facultatif)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label className="flex items-start gap-3 rounded-xl bg-[#F8FAFC] p-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 accent-[#1A23FF]"
                checked={publicNameEnabled}
                onChange={(e) => setPublicNameEnabled(e.target.checked)}
              />
              <span>
                Je souhaite que mon nom apparaisse publiquement sur le mur des supporters.
              </span>
            </label>
            <p className="text-xs leading-relaxed text-[#64748B]">
              Votre e-mail et vos informations personnelles ne seront jamais affichés publiquement.
            </p>
          </div>

          <aside className="rounded-[1.5rem] border border-[rgba(15,23,42,0.06)] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:sticky lg:top-6 lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
              Récapitulatif
            </p>
            <p className="mt-3 text-sm text-[#64748B]">{page.clubName}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{offer.name}</p>
            <p className="mt-1 text-sm text-[#64748B]">
              {durationLabel({
                durationType: offer.durationType,
                startDate: offer.startDate,
                endDate: offer.endDate,
              })}
            </p>
            {offer.benefits.length > 0 ? (
              <ul className="mt-4 space-y-1.5 text-sm text-[#334155]">
                {offer.benefits.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span style={{ color: theme.primaryColor }}>✓</span>
                    <span>{b.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-5 text-3xl font-semibold tracking-tight">{formatChf(offer.priceCents)}</p>
            <button
              type="submit"
              disabled={submitting || !page.canCheckout || offer.soldOut}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: cta.background, color: cta.color }}
            >
              {submitting ? "Redirection…" : `Payer ${formatChf(offer.priceCents)}`}
            </button>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#64748B]">
              <Shield className="mt-0.5 h-4 w-4 shrink-0" />
              Paiement sécurisé. Le montant est versé directement au club.
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}
