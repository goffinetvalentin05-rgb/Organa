"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import PublicShopShell from "@/components/shop/public/PublicShopShell";
import { formatChf } from "@/lib/shop/money";

type Catalog = {
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  introText: string | null;
  isEnabled: boolean;
  canCheckout: boolean;
  checkoutBlockedReason: string | null;
};

type ProductCard = {
  id: string;
  name: string;
  category: string | null;
  unitPriceCents: number;
  priceCents: number;
  promotionalPriceCents: number | null;
  inStock: boolean;
  images: Array<{ url: string; alt: string | null }>;
};

export default function PublicShopHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`/api/public/shop/${slug}`, { cache: "no-store" }),
          fetch(`/api/public/shop/${slug}/products`, { cache: "no-store" }),
        ]);
        if (!catRes.ok) throw new Error("Boutique introuvable");
        const cat = await catRes.json();
        const prod = prodRes.ok ? await prodRes.json() : { products: [] };
        if (cancelled) return;
        setCatalog(cat);
        setProducts(prod.products || []);
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
        Chargement de la boutique…
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Boutique introuvable</h1>
          <p className="mt-2 text-sm text-[#64748B]">{error || "Ce club n’a pas encore ouvert sa boutique."}</p>
        </div>
      </div>
    );
  }

  return (
    <PublicShopShell
      slug={slug}
      clubName={catalog.clubName}
      logoUrl={catalog.logoUrl}
      primaryColor={catalog.primaryColor}
    >
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Boutique {catalog.clubName}</h1>
        {catalog.introText ? (
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#64748B]">{catalog.introText}</p>
        ) : null}
        {!catalog.canCheckout && catalog.checkoutBlockedReason ? (
          <p className="mx-auto mt-4 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {catalog.checkoutBlockedReason}
          </p>
        ) : null}
      </div>

      {products.length === 0 ? (
        <p className="rounded-[1.25rem] border border-dashed border-[rgba(15,23,42,0.12)] bg-white px-6 py-16 text-center text-sm text-[#64748B]">
          Aucun produit pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/boutique/${slug}/produit/${product.id}`}
              className="group overflow-hidden rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
            >
              <div className="aspect-square bg-[#F1F5F9]">
                {product.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="p-3 sm:p-4">
                <p className="line-clamp-2 text-sm font-semibold sm:text-base">{product.name}</p>
                <p className="mt-1 text-sm font-semibold" style={{ color: catalog.primaryColor }}>
                  {formatChf(product.unitPriceCents)}
                  {product.promotionalPriceCents != null ? (
                    <span className="ml-2 text-xs font-normal text-[#94A3B8] line-through">
                      {formatChf(product.priceCents)}
                    </span>
                  ) : null}
                </p>
                {!product.inStock ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">Rupture</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PublicShopShell>
  );
}
