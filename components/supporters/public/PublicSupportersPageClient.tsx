"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicClubLogo from "@/components/public/PublicClubLogo";
import { getClubBrandPalette } from "@/lib/public-page/colors";
import { formatChf } from "@/lib/shop/money";
import type { PublicSupportersPage } from "@/lib/supporters/types";

export default function PublicSupportersPageClient({ slug }: { slug: string }) {
  const [page, setPage] = useState<PublicSupportersPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllWall, setShowAllWall] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/supporters/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Page introuvable");
        const data = (await res.json()) as PublicSupportersPage;
        if (!cancelled) setPage(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Chargement…
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Page introuvable</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Ce club n’a pas encore ouvert ses offres supporters.
          </p>
        </div>
      </div>
    );
  }

  const palette = getClubBrandPalette(page.primaryColor);
  const wallNames = showAllWall ? page.wall.names : page.wall.names.slice(0, 30);

  return (
    <div
      className="min-h-[100dvh] text-[#0F172A]"
      style={{ background: palette.pageBackground }}
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="text-center">
          <PublicClubLogo
            logoUrl={page.logoUrl}
            clubName={page.clubName}
            accentColor={page.primaryColor}
            size="lg"
          />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#94A3B8]">
            Supporters
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Soutenez le {page.clubName}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#64748B] sm:text-base">
            Devenez supporter du club et participez directement à son développement.
          </p>
        </header>

        {page.checkoutBlockedReason ? (
          <p className="mx-auto mt-6 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            {page.checkoutBlockedReason}
          </p>
        ) : null}

        {page.offers.length === 0 ? (
          <p className="mt-12 rounded-[1.25rem] border border-dashed border-[rgba(15,23,42,0.12)] bg-white px-6 py-16 text-center text-sm text-[#64748B]">
            Aucune offre n’est disponible pour le moment.
          </p>
        ) : (
          <div
            className={`mt-10 grid gap-4 ${
              page.offers.length === 1
                ? "mx-auto max-w-md"
                : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {page.offers.map((offer) => (
              <article
                key={offer.id}
                className="relative flex flex-col overflow-hidden rounded-[1.5rem] border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)] sm:p-6"
                style={{
                  borderColor: offer.isFeatured
                    ? `${page.primaryColor}55`
                    : "rgba(15,23,42,0.08)",
                  transform: offer.isFeatured ? "scale(1.01)" : undefined,
                }}
              >
                {offer.isFeatured ? (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ backgroundColor: page.primaryColor }}
                  >
                    Recommandé
                  </span>
                ) : null}
                <h2 className="pr-24 text-lg font-semibold tracking-tight">{offer.name}</h2>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {formatChf(offer.priceCents)}
                </p>
                <p className="mt-1 text-sm text-[#64748B]">{offer.durationLabel}</p>
                {offer.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{offer.description}</p>
                ) : null}
                {offer.supporterCount != null ? (
                  <p className="mt-3 text-xs font-medium text-[#94A3B8]">
                    {offer.supporterCount} supporter{offer.supporterCount > 1 ? "s" : ""}
                  </p>
                ) : null}
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {offer.benefits.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      <span>{b.label}</span>
                    </li>
                  ))}
                </ul>
                {offer.soldOut ? (
                  <p className="mt-6 rounded-full bg-[#F1F5F9] py-3 text-center text-sm font-semibold text-[#64748B]">
                    Complet
                  </p>
                ) : (
                  <Link
                    href={`/club/${slug}/supporters/checkout?offer=${offer.id}`}
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                    style={{ backgroundColor: page.primaryColor }}
                  >
                    Devenir supporter
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}

        {page.wall.total > 0 ? (
          <section className="mt-16 text-center">
            <h2 className="text-xl font-semibold">Nos supporters</h2>
            <p className="mt-2 text-sm text-[#64748B]">
              Merci à nos {page.wall.total} supporter{page.wall.total > 1 ? "s" : ""} ❤️
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {wallNames.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-3 py-1.5 text-sm text-[#334155]"
                >
                  {name}
                </span>
              ))}
            </div>
            {page.wall.hasMore && !showAllWall ? (
              <button
                type="button"
                className="mt-5 text-sm font-semibold"
                style={{ color: page.primaryColor }}
                onClick={async () => {
                  const res = await fetch(`/api/public/supporters/${slug}?wall=all`, {
                    cache: "no-store",
                  });
                  if (res.ok) {
                    const data = (await res.json()) as PublicSupportersPage;
                    setPage(data);
                    setShowAllWall(true);
                  }
                }}
              >
                Voir tous les supporters
              </button>
            ) : null}
          </section>
        ) : null}
      </main>
      <footer className="py-8 text-center text-xs text-[#94A3B8]">
        {page.clubName} · propulsé par Obillz
      </footer>
    </div>
  );
}
