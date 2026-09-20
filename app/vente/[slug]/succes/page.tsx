"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PublicClubMark from "@/components/public/PublicClubMark";
import { formatChf } from "@/lib/shop/money";
import type { PublicSupportSale } from "@/lib/support-sales/types";

function SuccessContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const [sale, setSale] = useState<PublicSupportSale | null>(null);
  const firstName = searchParams.get("n");
  const quantity = Number(searchParams.get("q") || 0);
  const memberName = searchParams.get("m");
  const totalCents = Number(searchParams.get("t") || 0);
  const productName = searchParams.get("p");
  const hasDetails = Boolean(firstName && quantity > 0 && memberName && productName);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/public/support-sales/${slug}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSale(data.sale);
    })();
  }, [slug]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-4 py-10">
      <div className="w-full max-w-md rounded-[1.5rem] border border-[rgba(15,23,42,0.08)] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.07)] sm:p-8">
        {sale ? (
          <PublicClubMark
            logoUrl={sale.logoUrl}
            clubName={sale.clubName}
            accentColor={sale.primaryColor}
            size="sm"
            onDark={false}
          />
        ) : null}
        <h1 className="mt-5 text-center text-2xl font-semibold text-[#0F172A]">Réservation confirmée</h1>
        {hasDetails ? (
          <p className="mt-3 text-center text-sm leading-relaxed text-[#64748B]">
            Merci {firstName}. {memberName} te remettra {quantity} {productName?.toLowerCase()} (
            {formatChf(totalCents)}).
          </p>
        ) : (
          <p className="mt-3 text-center text-sm leading-relaxed text-[#64748B]">
            Merci, ta réservation a bien été enregistrée. Le membre qui t’a proposé cette vente s’occupe de la remise.
          </p>
        )}
        <Link
          href={`/vente/${slug}`}
          className="mt-6 flex h-12 items-center justify-center rounded-full bg-[#1A23FF] text-sm font-semibold text-white"
        >
          Retour à la vente
        </Link>
      </div>
    </div>
  );
}

export default function PublicVenteSuccesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
          Chargement…
        </div>
      }
    >
      <SuccessContent slug={slug} />
    </Suspense>
  );
}
