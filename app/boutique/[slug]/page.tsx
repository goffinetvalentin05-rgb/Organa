"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import PublicShopShell, { useShopBrand } from "@/components/shop/public/PublicShopShell";
import { cn } from "@/components/ui";
import { productCardClass, productGridClass } from "@/lib/public-branding/theme";
import { formatChf } from "@/lib/shop/money";
import type { PublicShopCatalog } from "@/lib/shop/types";

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
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);
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
      catalog={catalog}
      showHero
    >
      <ShopCatalogBody slug={slug} catalog={catalog} products={products} />
    </PublicShopShell>
  );
}

function ShopCatalogBody({
  slug,
  catalog,
  products,
}: {
  slug: string;
  catalog: PublicShopCatalog;
  products: ProductCard[];
}) {
  const { cta, surfaceClass, immersive } = useShopBrand();

  return (
    <div id="produits" className="scroll-mt-24">
      {!catalog.canCheckout && catalog.checkoutBlockedReason ? (
        <p className="mx-auto mb-5 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
          {catalog.checkoutBlockedReason}
        </p>
      ) : null}

      {products.length === 0 ? (
        <p
          className={cn(
            "rounded-[1.25rem] px-6 py-16 text-center text-sm text-[#64748B]",
            immersive ? surfaceClass : "border border-dashed border-[rgba(15,23,42,0.12)] bg-white"
          )}
        >
          Aucun produit pour le moment.
        </p>
      ) : (
        <div className={productGridClass()}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/boutique/${slug}/produit/${product.id}`}
              className={cn(
                "group overflow-hidden rounded-[1.35rem] transition duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                surfaceClass,
                productCardClass(products.length)
              )}
              style={{ outlineColor: cta.background }}
            >
              <div className="relative aspect-square overflow-hidden bg-[#F1F5F9]">
                {product.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#94A3B8]">Aperçu bientôt</div>
                )}
                {product.promotionalPriceCents != null ? (
                  <span
                    className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ backgroundColor: cta.background, color: cta.color }}
                  >
                    Promo
                  </span>
                ) : null}
                {!product.inStock ? (
                  <span className="absolute right-2 top-2 rounded-full bg-[#0F172A]/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Rupture
                  </span>
                ) : null}
              </div>
              <div className="p-3 sm:p-4">
                {product.category ? (
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#94A3B8]">
                    {product.category}
                  </p>
                ) : null}
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px]">{product.name}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="text-sm font-semibold sm:text-base" style={{ color: catalog.theme?.accentColor || catalog.primaryColor }}>
                    {formatChf(product.unitPriceCents)}
                    {product.promotionalPriceCents != null ? (
                      <span className="ml-2 text-xs font-normal text-[#94A3B8] line-through">
                        {formatChf(product.priceCents)}
                      </span>
                    ) : null}
                  </p>
                  <span
                    className="hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
                    style={{ backgroundColor: `${cta.background}14`, color: cta.background }}
                  >
                    Voir
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
