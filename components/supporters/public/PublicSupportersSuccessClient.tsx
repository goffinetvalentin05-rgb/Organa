"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "@/lib/icons";
import type { PublicSupportersPage } from "@/lib/supporters/types";
import { ctaColors, pageSurfaceStyle, supportersPalette } from "@/lib/supporters/theme";
import SupportersClubMark from "./SupportersClubMark";

export default function PublicSupportersSuccessClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const supporterId = searchParams.get("s") || "";
  const [page, setPage] = useState<PublicSupportersPage | null>(null);
  const [active, setActive] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(Boolean(supporterId));

  useEffect(() => {
    fetch(`/api/public/supporters/${slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPage(data);
      })
      .catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    if (!supporterId) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/public/supporters/status?id=${supporterId}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.active && data.cardUrl) {
            setActive(true);
            setCardUrl(data.cardUrl);
            setChecking(false);
            return;
          }
        }
      } catch {
        /* ignore */
      }
      if (attempts >= 20) {
        if (!cancelled) setChecking(false);
        return;
      }
      window.setTimeout(() => {
        void poll();
      }, 1500);
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [supporterId]);

  const clubName = page?.clubName || "club";
  const theme = page?.theme;
  const primaryColor = theme?.primaryColor || page?.primaryColor || "#1A23FF";
  const palette = supportersPalette({
    primaryColor,
    secondaryColor: theme?.secondaryColor || primaryColor,
  });
  const cta = ctaColors(primaryColor);

  return (
    <div className="min-h-[100dvh]" style={pageSurfaceStyle(palette, theme?.bgImageUrl || null)}>
      <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        {page ? (
          <SupportersClubMark
            logoUrl={page.logoUrl}
            clubName={page.clubName}
            accentColor={primaryColor}
            size="md"
            tone="light"
          />
        ) : null}

        {active ? (
          <>
            <div
              className="mt-7 flex h-14 w-14 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCircle className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">Merci pour votre soutien</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#64748B]">
              Vous faites désormais partie des supporters du {clubName}.
            </p>
            <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
              {cardUrl ? (
                <Link
                  href={cardUrl}
                  className="inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
                  style={{ backgroundColor: cta.background, color: cta.color }}
                >
                  Voir ma carte supporter
                </Link>
              ) : null}
              <Link
                href={`/club/${slug}/supporters`}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(15,23,42,0.12)] bg-white px-6 text-sm font-semibold text-[#334155]"
              >
                Retour à la page supporters
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 h-12 w-12 animate-spin rounded-full border-2 border-[#E2E8F0]" style={{ borderTopColor: primaryColor }} />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Paiement reçu</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#64748B]">
              {checking
                ? "Votre adhésion est en cours de confirmation. Cela ne prend généralement que quelques secondes."
                : "Votre adhésion est en cours de confirmation. Vous recevrez votre carte supporter par e-mail dès validation du paiement."}
            </p>
            <Link
              href={`/club/${slug}/supporters`}
              className="mt-8 text-sm font-semibold"
              style={{ color: primaryColor }}
            >
              Retour à la page supporters
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
