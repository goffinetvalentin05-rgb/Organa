"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PublicClubLogo from "@/components/public/PublicClubLogo";
import { getClubBrandPalette } from "@/lib/public-page/colors";

type Catalog = {
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
};

export default function PublicSupportersSuccessClient({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const supporterId = searchParams.get("s") || "";
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [active, setActive] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(Boolean(supporterId));

  useEffect(() => {
    fetch(`/api/public/supporters/${slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setCatalog({
          clubName: data.clubName,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor,
        });
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

  const clubName = catalog?.clubName || "club";
  const primaryColor = catalog?.primaryColor || "#1A23FF";
  const palette = getClubBrandPalette(primaryColor);

  return (
    <div className="min-h-[100dvh]" style={{ background: palette.pageBackground }}>
      <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
        {catalog ? (
          <PublicClubLogo
            logoUrl={catalog.logoUrl}
            clubName={catalog.clubName}
            accentColor={primaryColor}
            size="md"
          />
        ) : null}
        {active ? (
          <>
            <h1 className="mt-6 text-2xl font-semibold">
              Vous faites désormais partie des supporters du {clubName}.
            </h1>
            <p className="mt-3 text-sm text-[#64748B]">
              Merci pour votre soutien. Votre carte digitale est prête.
            </p>
            {cardUrl ? (
              <Link
                href={cardUrl}
                className="mt-8 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Voir ma carte supporter
              </Link>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-semibold">Paiement reçu</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
              {checking
                ? "Votre adhésion est en cours de confirmation…"
                : "Votre adhésion est en cours de confirmation. Vous recevrez votre carte supporter par e-mail dès validation du paiement."}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
