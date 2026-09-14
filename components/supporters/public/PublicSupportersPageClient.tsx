"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Shield } from "@/lib/icons";
import { formatChf } from "@/lib/shop/money";
import type { PublicSupporterOffer, PublicSupportersPage } from "@/lib/supporters/types";
import {
  bannerOverlay,
  clubColorsHeroStyle,
  ctaColors,
  effectivePageStyle,
  fullscreenOverlay,
  heroTextColors,
  imageObjectPosition,
  pageSurfaceStyle,
  supportersPalette,
} from "@/lib/supporters/theme";
import SupportersClubMark from "./SupportersClubMark";

function fallbackTheme(page: PublicSupportersPage) {
  return (
    page.theme || {
      label: "Supporters",
      title: `Soutenez le ${page.clubName}`,
      subtitle: "Rejoignez les supporters du club et participez directement à son développement.",
      primaryColor: page.primaryColor,
      secondaryColor: page.primaryColor,
      pageStyle: "colors" as const,
      imagePosition: "center" as const,
      overlayIntensity: "normal" as const,
      bannerUrl: null,
      showStats: true,
    }
  );
}

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0B1220] text-sm text-white/70">
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

  return (
    <SupportersCatalog
      slug={slug}
      page={page}
      setPage={setPage}
      showAllWall={showAllWall}
      setShowAllWall={setShowAllWall}
    />
  );
}

function SupportersCatalog({
  slug,
  page,
  setPage,
  showAllWall,
  setShowAllWall,
}: {
  slug: string;
  page: PublicSupportersPage;
  setPage: (page: PublicSupportersPage) => void;
  showAllWall: boolean;
  setShowAllWall: (v: boolean) => void;
}) {
  const theme = fallbackTheme(page);
  const style = effectivePageStyle(theme.pageStyle, theme.bannerUrl);
  const immersive = style === "fullscreen";
  const palette = supportersPalette(theme);
  const heroText = heroTextColors(theme.primaryColor, style);
  const cta = ctaColors(theme.primaryColor, theme.secondaryColor);
  const featured = page.offers.find((o) => o.isFeatured && !o.soldOut) || page.offers.find((o) => !o.soldOut);
  const wallNames = showAllWall ? page.wall.names : page.wall.names.slice(0, 36);
  const fromPrice = page.offers.length
    ? Math.min(
        ...page.offers.filter((o) => !o.soldOut).map((o) => o.priceCents).concat(page.offers.map((o) => o.priceCents))
      )
    : null;
  const objectPosition = imageObjectPosition(theme.imagePosition);
  const primaryHref =
    featured && page.canCheckout
      ? `/club/${slug}/supporters/checkout?offer=${featured.id}`
      : "#offres";

  const surfaceClass = immersive
    ? "bg-white/92 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-[6px]"
    : "bg-white shadow-[0_8px_30px_rgba(15,23,42,0.07)]";

  return (
    <div className="relative min-h-[100dvh] text-[#0F172A]" style={pageSurfaceStyle(palette, immersive)}>
      {immersive && theme.bannerUrl ? (
        <div className="pointer-events-none fixed inset-0 -z-10">
          <Image
            src={theme.bannerUrl}
            alt=""
            fill
            priority
            className="object-cover"
            style={{ objectPosition }}
            sizes="100vw"
            unoptimized={theme.bannerUrl.includes("supabase.co")}
          />
          <div
            className="absolute inset-0"
            style={{ background: fullscreenOverlay(theme.primaryColor, theme.overlayIntensity) }}
          />
        </div>
      ) : null}

      <div className="overflow-x-hidden">

        <header className="relative isolate min-h-[20rem] overflow-hidden sm:min-h-[22rem]">
        {style === "banner" && theme.bannerUrl ? (
          <>
            <Image
              src={theme.bannerUrl}
              alt=""
              fill
              priority
              className="object-cover"
              style={{ objectPosition }}
              sizes="100vw"
              unoptimized={theme.bannerUrl.includes("supabase.co")}
            />
            <div
              className="absolute inset-0"
              style={{
                background: bannerOverlay(theme.primaryColor, theme.secondaryColor, theme.overlayIntensity),
              }}
            />
          </>
        ) : null}

        {style === "colors" ? (
          <>
            <div
              className="absolute inset-0"
              style={clubColorsHeroStyle(theme.primaryColor, theme.secondaryColor)}
            />
            <div
              className="pointer-events-none absolute -left-16 top-[-20%] h-64 w-64 rounded-full opacity-30 blur-3xl"
              style={{ background: "#fff" }}
            />
            <div
              className="pointer-events-none absolute -right-10 bottom-[-30%] h-72 w-72 rounded-full opacity-25 blur-3xl"
              style={{ background: theme.secondaryColor }}
            />
          </>
        ) : null}

        <div className="relative mx-auto flex w-[calc(100%-32px)] max-w-[760px] flex-col items-center px-0 pb-16 pt-10 text-center sm:pb-20 sm:pt-12">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.32em]"
            style={{ color: heroText.faint }}
          >
            {theme.label}
          </p>
          <div className="mt-4">
            <SupportersClubMark
              logoUrl={page.logoUrl}
              clubName={page.clubName}
              accentColor={theme.primaryColor}
              size="lg"
              onDark={heroText.onDark}
            />
          </div>
          <h1
            className="mt-4 w-full max-w-[680px] text-[1.85rem] font-semibold leading-tight tracking-tight [overflow-wrap:break-word] sm:text-4xl lg:text-[2.75rem]"
            style={{ color: heroText.text }}
          >
            {theme.title}
          </h1>
          <p
            className="mt-3 w-full max-w-[680px] text-[15px] leading-relaxed [overflow-wrap:break-word] sm:text-base"
            style={{ color: heroText.muted }}
          >
            {theme.subtitle}
          </p>

          <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-3 sm:max-w-md">
            <Link
              href={primaryHref}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold shadow-[0_10px_28px_rgba(2,6,23,0.22)] transition hover:opacity-95 sm:w-auto sm:min-w-[220px]"
              style={{ backgroundColor: cta.background, color: cta.color }}
            >
              {featured && page.canCheckout ? "Devenir supporter" : "Voir les offres"}
            </Link>
          </div>

          {theme.showStats && fromPrice != null ? (
            <p className="mt-4 text-sm font-semibold" style={{ color: heroText.text }}>
              Dès {formatChf(fromPrice)}
            </p>
          ) : null}

          <p
            className="mt-3 flex items-center justify-center gap-2 text-xs font-medium"
            style={{ color: heroText.faint }}
          >
            <Shield className="h-4 w-4" />
            Paiement sécurisé · soutien direct au club
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        <div className="-mt-8 sm:-mt-10">
          {page.checkoutBlockedReason ? (
            <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
              {page.checkoutBlockedReason}
            </p>
          ) : null}

          <section id="offres">
            {page.offers.length === 0 ? (
              <p className={`rounded-[1.5rem] border border-dashed border-[rgba(15,23,42,0.12)] px-6 py-16 text-center text-sm text-[#64748B] ${surfaceClass}`}>
                Aucune offre n’est disponible pour le moment.
              </p>
            ) : (
              <div
                className={`grid gap-4 ${
                  page.offers.length === 1 ? "mx-auto max-w-md" : "sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {page.offers.map((offer) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    slug={slug}
                    primaryColor={theme.primaryColor}
                    secondaryColor={theme.secondaryColor}
                    surfaceClass={surfaceClass}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {page.wall.total > 0 ? (
          <section className="mt-16 text-center sm:mt-20">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: immersive ? "rgba(255,255,255,0.7)" : "#94A3B8" }}
            >
              Communauté
            </p>
            <h2
              className="mt-2 flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight"
              style={{ color: immersive ? "#fff" : undefined }}
            >
              Merci à nos supporters
              <Heart className="h-5 w-5 text-rose-500" />
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: immersive ? "rgba(255,255,255,0.78)" : "#64748B" }}
            >
              {page.wall.total} personne{page.wall.total > 1 ? "s" : ""} soutiennent déjà {page.clubName}.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {wallNames.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className={`inline-flex items-center gap-2 rounded-full border border-[rgba(15,23,42,0.08)] px-3 py-1.5 text-sm text-[#334155] ${surfaceClass}`}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                  {name}
                </span>
              ))}
            </div>
            {page.wall.hasMore && !showAllWall ? (
              <button
                type="button"
                className="mt-6 text-sm font-semibold"
                style={{ color: immersive ? "#fff" : theme.primaryColor }}
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

      <footer
        className="pb-10 text-center text-xs"
        style={{ color: immersive ? "rgba(255,255,255,0.65)" : "#94A3B8" }}
      >
        {page.clubName} · propulsé par Obillz
      </footer>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  slug,
  primaryColor,
  secondaryColor,
  surfaceClass,
}: {
  offer: PublicSupporterOffer;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  surfaceClass: string;
}) {
  const cta = ctaColors(primaryColor, secondaryColor);
  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-[1.6rem] border p-5 sm:p-6 ${surfaceClass}`}
      style={{
        borderColor: offer.isFeatured ? `${primaryColor}66` : "rgba(15,23,42,0.08)",
      }}
    >
      {offer.isFeatured ? (
        <span
          className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
          style={{ backgroundColor: cta.background, color: cta.color }}
        >
          Recommandé
        </span>
      ) : null}
      <h2 className="pr-24 text-xl font-semibold tracking-tight">{offer.name}</h2>
      <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight">
        {formatChf(offer.priceCents)}
      </p>
      <p className="mt-2 text-sm font-medium text-[#64748B]">{offer.durationLabel}</p>
      {offer.description ? (
        <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{offer.description}</p>
      ) : null}
      {offer.supporterCount != null ? (
        <p className="mt-3 text-xs font-medium text-[#94A3B8]">
          {offer.supporterCount} supporter{offer.supporterCount > 1 ? "s" : ""}
        </p>
      ) : null}
      <ul className="mt-5 flex-1 space-y-2.5 text-sm">
        {offer.benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: cta.background, color: cta.color }}
            >
              ✓
            </span>
            <span className="leading-snug text-[#334155]">{b.label}</span>
          </li>
        ))}
      </ul>
      {offer.soldOut ? (
        <p className="mt-6 rounded-full bg-[#F1F5F9] py-3.5 text-center text-sm font-semibold text-[#64748B]">
          Complet
        </p>
      ) : (
        <Link
          href={`/club/${slug}/supporters/checkout?offer=${offer.id}`}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition hover:opacity-95"
          style={{ backgroundColor: cta.background, color: cta.color }}
        >
          Devenir supporter
        </Link>
      )}
    </article>
  );
}
