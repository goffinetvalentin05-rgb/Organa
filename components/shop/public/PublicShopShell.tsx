"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import PublicBrandingHero from "@/components/public-branding/PublicBrandingHero";
import PublicPageCanvas from "@/components/public-branding/PublicPageCanvas";
import PublicClubMark from "@/components/public/PublicClubMark";
import { cn } from "@/components/ui";
import { ShoppingBag } from "@/lib/icons";
import { resolvePublicLayout } from "@/lib/public-branding/theme";
import type { PublicVisualTheme } from "@/lib/public-branding/types";
import { cartCount, getShopCart } from "@/lib/shop/cart";
import { fallbackPublicShopTheme } from "@/lib/shop/page-settings";
import type { PublicShopCatalog } from "@/lib/shop/types";

type ShopBrandValue = {
  slug: string;
  clubName: string;
  logoUrl: string | null;
  theme: PublicVisualTheme;
  immersive: boolean;
  surfaceClass: string;
  cta: { background: string; color: string };
};

const ShopBrandContext = createContext<ShopBrandValue | null>(null);

export function useShopBrand() {
  const value = useContext(ShopBrandContext);
  if (!value) {
    throw new Error("useShopBrand must be used within PublicShopShell");
  }
  return value;
}

type CatalogLike = Pick<PublicShopCatalog, "clubName" | "logoUrl" | "primaryColor"> & {
  introText?: string | null;
  theme?: PublicShopCatalog["theme"] | null;
};

type Props = {
  slug: string;
  clubName: string;
  logoUrl: string | null;
  primaryColor: string;
  catalog?: CatalogLike | null;
  showHero?: boolean;
  children: ReactNode;
};

export default function PublicShopShell({
  slug,
  clubName,
  logoUrl,
  primaryColor,
  catalog,
  showHero = false,
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

  const theme = fallbackPublicShopTheme({
    clubName: catalog?.clubName || clubName,
    primaryColor: catalog?.primaryColor || primaryColor,
    introText: catalog?.introText,
    theme: catalog?.theme,
  });
  const layout = resolvePublicLayout(theme);
  const headerDark = layout.immersive;
  const resolvedClubName = catalog?.clubName || clubName;
  const resolvedLogo = catalog?.logoUrl ?? logoUrl;
  const { immersive, surfaceClass, cta } = layout;

  const brand = useMemo<ShopBrandValue>(
    () => ({
      slug,
      clubName: resolvedClubName,
      logoUrl: resolvedLogo,
      theme,
      immersive,
      surfaceClass,
      cta,
    }),
    [slug, resolvedClubName, resolvedLogo, theme, immersive, surfaceClass, cta]
  );

  return (
    <ShopBrandContext.Provider value={brand}>
      <PublicPageCanvas theme={theme} priority={showHero}>
        <header
          className={cn(
            "sticky top-0 z-30 border-b backdrop-blur-md",
            headerDark
              ? "border-white/10 bg-[rgba(11,18,32,0.38)] text-white"
              : "border-[rgba(15,23,42,0.06)] bg-white/90 text-[#0F172A]"
          )}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href={`/boutique/${slug}`} className="flex min-w-0 items-center gap-3">
              <PublicClubMark
                logoUrl={resolvedLogo}
                clubName={resolvedClubName}
                accentColor={theme.primaryColor}
                size="sm"
                onDark={headerDark}
                className="mx-0"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{resolvedClubName}</p>
                <p className={cn("text-xs", headerDark ? "text-white/70" : "text-[#64748B]")}>Boutique</p>
              </div>
            </Link>
            <Link
              href={`/boutique/${slug}/panier`}
              className={cn(
                "relative inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm",
                headerDark
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-[rgba(15,23,42,0.1)] bg-white text-[#0F172A]"
              )}
              aria-label="Panier"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 ? (
                <span
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold"
                  style={{ backgroundColor: cta.background, color: cta.color }}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          </div>
        </header>

        {showHero ? (
          <PublicBrandingHero clubName={resolvedClubName} logoUrl={resolvedLogo} theme={theme}>
            <a
              href="#produits"
              className="mt-6 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-full px-6 text-sm font-semibold shadow-[0_10px_28px_rgba(2,6,23,0.22)] transition hover:opacity-95 sm:w-auto sm:min-w-[220px]"
              style={{ backgroundColor: cta.background, color: cta.color }}
            >
              Voir les produits
            </a>
          </PublicBrandingHero>
        ) : null}

        <main
          className={cn(
            "relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6",
            showHero ? "pb-16 sm:pb-20" : "py-6 sm:py-10"
          )}
        >
          {showHero ? <div className="-mt-8 sm:-mt-10">{children}</div> : children}
        </main>

        <footer
          className={cn(
            "relative z-10 py-6 text-center text-xs",
            immersive ? "text-white/65" : "border-t border-[rgba(15,23,42,0.06)] text-[#94A3B8]"
          )}
        >
          Boutique {resolvedClubName} · propulsée par Obillz
        </footer>
      </PublicPageCanvas>
    </ShopBrandContext.Provider>
  );
}

export function notifyCartChanged() {
  window.dispatchEvent(new Event("obillz-shop-cart"));
}
