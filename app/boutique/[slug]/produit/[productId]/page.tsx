"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PublicShopShell, { notifyCartChanged } from "@/components/shop/public/PublicShopShell";
import { addToShopCart } from "@/lib/shop/cart";
import { formatChf } from "@/lib/shop/money";

type Catalog = {
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  canCheckout: boolean;
  checkoutBlockedReason: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
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
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

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
      const firstAvailable = data.product.variants.find((v: { inStock: boolean }) => v.inStock);
      setVariantId(firstAvailable?.id || data.product.variants[0]?.id || null);
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

  const selected = product.variants.find((v) => v.id === variantId);
  const canAdd =
    catalog.canCheckout &&
    product.inStock &&
    (!product.hasVariants || Boolean(selected?.inStock));

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
    <PublicShopShell
      slug={slug}
      clubName={catalog.clubName}
      logoUrl={catalog.logoUrl}
      primaryColor={catalog.primaryColor}
    >
      <button
        type="button"
        onClick={() => router.push(`/boutique/${slug}`)}
        className="mb-5 text-sm font-medium text-[#64748B]"
      >
        ← Retour
      </button>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-[#F1F5F9]">
            {product.images[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          {product.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-2xl font-semibold" style={{ color: catalog.primaryColor }}>
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
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      variantId === v.id
                        ? "border-transparent text-white"
                        : "border-[rgba(15,23,42,0.12)] bg-white"
                    } ${!v.inStock ? "opacity-40" : ""}`}
                    style={
                      variantId === v.id ? { backgroundColor: catalog.primaryColor } : undefined
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
              className="w-20 rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={!canAdd}
              onClick={add}
              className="flex-1 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: catalog.primaryColor }}
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
              className="mt-4 text-sm font-semibold"
              style={{ color: catalog.primaryColor }}
              onClick={() => router.push(`/boutique/${slug}/panier`)}
            >
              Voir le panier →
            </button>
          ) : null}
        </div>
      </div>
    </PublicShopShell>
  );
}
