"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import PublicClubLogo from "@/components/public/PublicClubLogo";
import { cartCount, getShopCart } from "@/lib/shop/cart";
import { useEffect, useState } from "react";
import { ShoppingBag } from "@/lib/icons";

type Props = {
  slug: string;
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  children: ReactNode;
};

export default function PublicShopShell({
  slug,
  clubName,
  logoUrl,
  primaryColor,
  children,
}: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(cartCount(getShopCart(slug)));
    sync();
    window.addEventListener("obillz-shop-cart", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("obillz-shop-cart", sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);

  return (
    <div className="min-h-[100dvh] bg-[#F4F7FB] text-[#0F172A]">
      <header className="sticky top-0 z-30 border-b border-[rgba(15,23,42,0.06)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href={`/boutique/${slug}`} className="flex min-w-0 items-center gap-3">
            <PublicClubLogo logoUrl={logoUrl} clubName={clubName} accentColor={primaryColor} size="md" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{clubName}</p>
              <p className="text-xs text-[#64748B]">Boutique</p>
            </div>
          </Link>
          <Link
            href={`/boutique/${slug}/panier`}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(15,23,42,0.1)] bg-white shadow-sm"
            aria-label="Panier"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {count}
              </span>
            ) : null}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      <footer className="border-t border-[rgba(15,23,42,0.06)] py-6 text-center text-xs text-[#94A3B8]">
        Boutique {clubName} · propulsée par Obillz
      </footer>
    </div>
  );
}

export function notifyCartChanged() {
  window.dispatchEvent(new Event("obillz-shop-cart"));
}
