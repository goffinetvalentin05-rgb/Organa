"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import PublicShopShell, { useShopBrand } from "@/components/shop/public/PublicShopShell";
import { cn } from "@/components/ui";
import type { PublicShopCatalog } from "@/lib/shop/types";

export default function PublicSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);

  useEffect(() => {
    fetch(`/api/public/shop/${slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((cat) => {
        if (!cat) return;
        setCatalog(cat);
      })
      .catch(() => undefined);
  }, [slug]);

  if (!catalog) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Chargement…
      </div>
    );
  }

  return (
    <PublicShopShell
      slug={slug}
      clubName={catalog.clubName}
      logoUrl={catalog.logoUrl}
      primaryColor={catalog.primaryColor}
      catalog={catalog}
    >
      <SuccessBody slug={slug} />
    </PublicShopShell>
  );
}

function SuccessBody({ slug }: { slug: string }) {
  const { cta, surfaceClass } = useShopBrand();
  return (
    <div className={cn("mx-auto max-w-lg rounded-[1.5rem] px-6 py-12 text-center", surfaceClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#94A3B8]">Commande confirmée</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Merci pour votre commande</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
        Le paiement est confirmé par Stripe. Vous recevrez un e-mail de confirmation avec le
        numéro de commande et les informations de retrait, dès que le paiement sera validé.
      </p>
      <Link
        href={`/boutique/${slug}`}
        className="mt-6 inline-flex h-12 min-w-[220px] items-center justify-center rounded-full px-5 text-sm font-semibold"
        style={{ backgroundColor: cta.background, color: cta.color }}
      >
        Retour à la boutique
      </Link>
    </div>
  );
}
