"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicShopShell, { notifyCartChanged } from "@/components/shop/public/PublicShopShell";
import { clearShopCart, getShopCart, updateShopCartQty } from "@/lib/shop/cart";
import { formatChf } from "@/lib/shop/money";

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
  const router = useRouter();
  const [clubName, setClubName] = useState("Club");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1A23FF");
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [canCheckout, setCanCheckout] = useState(false);

  const refresh = useCallback(async () => {
    const cart = getShopCart(slug);
    const catRes = await fetch(`/api/public/shop/${slug}`, { cache: "no-store" });
    if (catRes.ok) {
      const cat = await catRes.json();
      setClubName(cat.clubName);
      setLogoUrl(cat.logoUrl);
      setPrimaryColor(cat.primaryColor);
      setCanCheckout(Boolean(cat.canCheckout));
    }
    if (cart.items.length === 0) {
      setLines([]);
      setTotal(0);
      setError(null);
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
      return;
    }
    setError(null);
    setLines(data.lines || []);
    setTotal(data.totalCents || 0);
    setCanCheckout(Boolean(data.canCheckout));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      void cancelled;
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const changeQty = (line: Line, quantity: number) => {
    updateShopCartQty(slug, line.productId, line.variantId, quantity);
    notifyCartChanged();
    refresh();
  };

  return (
    <PublicShopShell slug={slug} clubName={clubName} logoUrl={logoUrl} primaryColor={primaryColor}>
      <h1 className="mb-6 text-2xl font-semibold">Panier</h1>
      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {lines.length === 0 ? (
        <div className="rounded-[1.25rem] bg-white px-6 py-16 text-center">
          <p className="text-sm text-[#64748B]">Votre panier est vide.</p>
          <Link href={`/boutique/${slug}`} className="mt-4 inline-block text-sm font-semibold" style={{ color: primaryColor }}>
            Continuer les achats
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {lines.map((line) => (
            <div
              key={`${line.productId}-${line.variantId || ""}`}
              className="flex gap-3 rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white p-3"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F1F5F9]">
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
                  <button type="button" className="h-8 w-8 rounded-lg border" onClick={() => changeQty(line, line.quantity - 1)}>
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{line.quantity}</span>
                  <button type="button" className="h-8 w-8 rounded-lg border" onClick={() => changeQty(line, line.quantity + 1)}>
                    +
                  </button>
                  <button type="button" className="ml-auto text-xs text-rose-600" onClick={() => changeQty(line, 0)}>
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-[1.25rem] bg-white p-5">
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
              className="mt-5 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              Commander
            </button>
            <button
              type="button"
              className="mt-3 w-full text-xs text-[#94A3B8]"
              onClick={() => {
                clearShopCart(slug);
                notifyCartChanged();
                refresh();
              }}
            >
              Vider le panier
            </button>
          </div>
        </div>
      )}
    </PublicShopShell>
  );
}
