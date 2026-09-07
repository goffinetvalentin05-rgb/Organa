"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import PublicShopShell from "@/components/shop/public/PublicShopShell";

export default function PublicSuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [clubName, setClubName] = useState("Club");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1A23FF");

  useEffect(() => {
    fetch(`/api/public/shop/${slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((cat) => {
        if (!cat) return;
        setClubName(cat.clubName);
        setLogoUrl(cat.logoUrl);
        setPrimaryColor(cat.primaryColor);
      })
      .catch(() => undefined);
  }, [slug]);

  return (
    <PublicShopShell slug={slug} clubName={clubName} logoUrl={logoUrl} primaryColor={primaryColor}>
      <div className="mx-auto max-w-lg rounded-[1.5rem] bg-white px-6 py-12 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Merci pour votre commande</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#64748B]">
          Le paiement est confirmé par Stripe. Vous recevrez un e-mail de confirmation avec le
          numéro de commande et les informations de retrait, dès que le paiement sera validé.
        </p>
        <Link
          href={`/boutique/${slug}`}
          className="mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Retour à la boutique
        </Link>
      </div>
    </PublicShopShell>
  );
}
