"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PublicShopShell, { notifyCartChanged, useShopBrand } from "@/components/shop/public/PublicShopShell";
import { cn } from "@/components/ui";
import { addToShopCart } from "@/lib/shop/cart";
import { formatChf } from "@/lib/shop/money";
import type { PublicShopCatalog } from "@/lib/shop/types";

type Product = {
  id: string;
  name: string;
  description: string | null;
  category?: string | null;
  unitPriceCents: number;
  priceCents: number;
  promotionalPriceCents: number | null;
  inStock: boolean;
  trackStock: boolean;
  hasVariants: boolean;
  images: Array<{ id: string; url: string; alt: string | null }>;
  variants: Array<{
    id: string;
    label: string;
    inStock: boolean;
    stockQuantity: number | null;
  }>;
};

export default function PublicProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = use(params);
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [catRes, prodRes] = await Promise.all([
        fetch(`/api/public/shop/${slug}`, { cache: "no-store" }),
        fetch(`/api/public/shop/${slug}/products/${productId}`, { cache: "no-store" }),
      ]);
      if (!catRes.ok || !prodRes.ok) {
        setError("Produit introuvable");
        return;
      }
      const cat = await catRes.json();
      const data = await prodRes.json();
      setCatalog(cat);
      setProduct(data.product);
    })();
  }, [slug, productId]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        {error}
      </div>
    );
  }
  if (!catalog || !product) {
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
      <ProductDetail slug={slug} catalog={catalog} product={product} />
    </PublicShopShell>
  );
}

function ProductDetail({
  slug,
  catalog,
  product,
}: {
  slug: string;
  catalog: PublicShopCatalog;
  product: Product;
}) {
  const router = useRouter();
  const { cta, surfaceClass } = useShopBrand();
  const [variantId, setVariantId] = useState<string | null>(
    product.variants.find((v) => v.inStock)?.id || product.variants[0]?.id || null
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const selected = product.variants.find((v) => v.id === variantId);
  const canAdd =
    catalog.canCheckout &&
    product.inStock &&
    (!product.hasVariants || Boolean(selected?.inStock));
  const currentImage = product.images[activeImage] || product.images[0];

  const add = () => {
    if (!canAdd) return;
    addToShopCart(slug, {
      productId: product.id,
      variantId: product.hasVariants ? variantId : null,
      quantity: qty,
    });
    notifyCartChanged();
    setAdded(true);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push(`/boutique/${slug}`)}
        className="mb-5 min-h-11 text-sm font-medium text-[#64748B]"
      >
        ← Retour à la boutique
      </button>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-3">
          <div className={cn("aspect-square overflow-hidden rounded-[1.5rem]", surfaceClass)}>
            {currentImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentImage.url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#F1F5F9] text-sm text-[#94A3B8]">
                Aucune image
              </div>
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2",
                    index === activeImage ? "border-transparent ring-2" : "border-[rgba(15,23,42,0.08)]"
                  )}
                  style={index === activeImage ? { outlineColor: cta.background, boxShadow: `0 0 0 2px ${cta.background}` } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className={cn("rounded-[1.5rem] p-5 sm:p-6", surfaceClass)}>
          {product.category ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#94A3B8]">{product.category}</p>
          ) : null}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
          <p className="mt-3 text-2xl font-semibold" style={{ color: catalog.theme?.accentColor || catalog.primaryColor }}>
            {formatChf(product.unitPriceCents)}
            {product.promotionalPriceCents != null ? (
              <span className="ml-2 text-base font-normal text-[#94A3B8] line-through">
                {formatChf(product.priceCents)}
              </span>
            ) : null}
          </p>
          {product.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#64748B]">
              {product.description}
            </p>
          ) : null}
          {product.hasVariants ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Variante</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!v.inStock}
                    onClick={() => setVariantId(v.id)}
                    className={cn(
                      "min-h-11 rounded-full border px-4 py-2 text-sm font-medium",
                      !v.inStock ? "opacity-40" : "",
                      variantId === v.id
                        ? "border-transparent"
                        : "border-[rgba(15,23,42,0.12)] bg-white"
                    )}
                    style={
                      variantId === v.id
                        ? { backgroundColor: cta.background, color: cta.color }
                        : undefined
                    }
                  >
                    {v.label}
                    {!v.inStock ? " · rupture" : ""}
                  </button>
                ))}
              </div>
            </div>
          ) : !product.inStock ? (
            <p className="mt-4 text-sm font-medium text-rose-600">Rupture de stock</p>
          ) : null}
          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={99}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="h-12 w-20 rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-3 text-center text-sm"
              aria-label="Quantité"
            />
            <button
              type="button"
              disabled={!canAdd}
              onClick={add}
              className="flex h-12 flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: cta.background, color: cta.color }}
            >
              {added ? "Ajouté au panier" : "Ajouter au panier"}
            </button>
          </div>
          {!catalog.canCheckout && catalog.checkoutBlockedReason ? (
            <p className="mt-3 text-sm text-amber-700">{catalog.checkoutBlockedReason}</p>
          ) : null}
          {added ? (
            <button
              type="button"
              className="mt-4 min-h-11 text-sm font-semibold"
              style={{ color: cta.background }}
              onClick={() => router.push(`/boutique/${slug}/panier`)}
            >
              Voir le panier →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
