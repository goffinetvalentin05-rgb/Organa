"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicShopShell, { notifyCartChanged, useShopBrand } from "@/components/shop/public/PublicShopShell";
import { cn } from "@/components/ui";
import { clearShopCart, getShopCart, updateShopCartQty } from "@/lib/shop/cart";
import { formatChf } from "@/lib/shop/money";
import type { PublicShopCatalog } from "@/lib/shop/types";

type Line = {
  productId: string;
  variantId: string | null;
  name: string;
  variantLabel: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
};

export default function PublicCartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [canCheckout, setCanCheckout] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const cart = getShopCart(slug);
    const catRes = await fetch(`/api/public/shop/${slug}`, { cache: "no-store" });
    if (catRes.ok) {
      const cat = (await catRes.json()) as PublicShopCatalog;
      setCatalog(cat);
      setCanCheckout(Boolean(cat.canCheckout));
    }
    if (cart.items.length === 0) {
      setLines([]);
      setTotal(0);
      setError(null);
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/public/shop/${slug}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.items }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Panier invalide");
      setLoading(false);
      return;
    }
    setError(null);
    setLines(data.lines || []);
    setTotal(data.totalCents || 0);
    setCanCheckout(Boolean(data.canCheckout));
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading || !catalog) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Chargement du panier…
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
      <CartBody
        slug={slug}
        lines={lines}
        total={total}
        error={error}
        canCheckout={canCheckout}
        onRefresh={refresh}
      />
    </PublicShopShell>
  );
}

function CartBody({
  slug,
  lines,
  total,
  error,
  canCheckout,
  onRefresh,
}: {
  slug: string;
  lines: Line[];
  total: number;
  error: string | null;
  canCheckout: boolean;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const { cta, surfaceClass } = useShopBrand();

  const changeQty = (line: Line, quantity: number) => {
    updateShopCartQty(slug, line.productId, line.variantId, quantity);
    notifyCartChanged();
    onRefresh();
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Panier</h1>
      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {lines.length === 0 ? (
        <div className={cn("rounded-[1.25rem] px-6 py-16 text-center", surfaceClass)}>
          <p className="text-sm text-[#64748B]">Votre panier est vide.</p>
          <Link
            href={`/boutique/${slug}`}
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold"
            style={{ color: cta.background }}
          >
            Continuer les achats
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
          <div className="space-y-3 lg:col-span-3">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.variantId || ""}`}
                className={cn("flex gap-3 rounded-[1.25rem] p-3 sm:p-4", surfaceClass)}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F1F5F9] sm:h-24 sm:w-24">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{line.name}</p>
                  {line.variantLabel ? <p className="text-xs text-[#64748B]">{line.variantLabel}</p> : null}
                  <p className="mt-1 text-sm font-medium">{formatChf(line.lineTotalCents)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.12)]"
                      onClick={() => changeQty(line, line.quantity - 1)}
                      aria-label="Diminuer"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.12)]"
                      onClick={() => changeQty(line, line.quantity + 1)}
                      aria-label="Augmenter"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto min-h-10 text-xs font-medium text-rose-600"
                      onClick={() => changeQty(line, 0)}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={cn("rounded-[1.25rem] p-5 lg:col-span-2", surfaceClass)}>
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <span className="font-semibold">{formatChf(total)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatChf(total)}</span>
            </div>
            <button
              type="button"
              disabled={!canCheckout}
              onClick={() => router.push(`/boutique/${slug}/checkout`)}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: cta.background, color: cta.color }}
            >
              Commander
            </button>
            <button
              type="button"
              className="mt-3 w-full min-h-11 text-xs text-[#94A3B8]"
              onClick={() => {
                clearShopCart(slug);
                notifyCartChanged();
                onRefresh();
              }}
            >
              Vider le panier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
