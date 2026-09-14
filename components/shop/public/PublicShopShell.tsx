"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import PublicClubMark from "@/components/public/PublicClubMark";
import { cn } from "@/components/ui";
import { ShoppingBag } from "@/lib/icons";
import {
  bannerOverlay,
  brandPalette,
  clubColorsHeroStyle,
  ctaColors,
  effectivePageStyle,
  fullscreenOverlay,
  heroTextColors,
  imageObjectPosition,
  pageSurfaceStyle,
  shopSurfaceClass,
} from "@/lib/public-branding/theme";
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
  const style = effectivePageStyle(theme.pageStyle, theme.bannerUrl);
  const immersive = style === "fullscreen";
  const palette = brandPalette(theme);
  const heroText = heroTextColors(theme.primaryColor, style);
  const cta = ctaColors(theme.primaryColor, theme.secondaryColor, theme.accentColor);
  const objectPosition = imageObjectPosition(theme.imagePosition);
  const headerDark = immersive;
  const resolvedClubName = catalog?.clubName || clubName;
  const resolvedLogo = catalog?.logoUrl ?? logoUrl;

  const brand = useMemo<ShopBrandValue>(
    () => ({
      slug,
      clubName: resolvedClubName,
      logoUrl: resolvedLogo,
      theme,
      immersive,
      surfaceClass: shopSurfaceClass(immersive),
      cta,
    }),
    [slug, resolvedClubName, resolvedLogo, theme, immersive, cta]
  );

  return (
    <ShopBrandContext.Provider value={brand}>
      <div className="relative min-h-[100dvh] overflow-x-hidden text-[#0F172A]" style={pageSurfaceStyle(palette, immersive)}>
        {immersive && theme.bannerUrl ? (
          <div className="pointer-events-none fixed inset-0 -z-10">
            <Image
              src={theme.bannerUrl}
              alt=""
              fill
              priority={showHero}
              className="object-cover"
              style={{ objectPosition }}
              sizes="100vw"
              unoptimized={theme.bannerUrl.includes("supabase.co")}
            />
            <div
              className="absolute inset-0"
              style={{ background: fullscreenOverlay(theme.primaryColor, theme.overlayIntensity) }}
            />
          </div>
        ) : null}

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
          <PublicShopHero
            clubName={resolvedClubName}
            logoUrl={resolvedLogo}
            theme={theme}
            style={style}
            heroText={heroText}
            cta={cta}
            objectPosition={objectPosition}
          />
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
      </div>
    </ShopBrandContext.Provider>
  );
}

function PublicShopHero({
  clubName,
  logoUrl,
  theme,
  style,
  heroText,
  cta,
  objectPosition,
}: {
  clubName: string;
  logoUrl: string | null;
  theme: PublicVisualTheme;
  style: ReturnType<typeof effectivePageStyle>;
  heroText: ReturnType<typeof heroTextColors>;
  cta: { background: string; color: string };
  objectPosition: string;
}) {
  return (
    <header className="relative isolate min-h-[20rem] overflow-hidden sm:min-h-[22rem]">
      {style === "banner" && theme.bannerUrl ? (
        <>
          <Image
            src={theme.bannerUrl}
            alt=""
            fill
            priority
            className="object-cover"
            style={{ objectPosition }}
            sizes="100vw"
            unoptimized={theme.bannerUrl.includes("supabase.co")}
          />
          <div
            className="absolute inset-0"
            style={{
              background: bannerOverlay(theme.primaryColor, theme.secondaryColor, theme.overlayIntensity),
            }}
          />
        </>
      ) : null}

      {style === "colors" ? (
        <>
          <div
            className="absolute inset-0"
            style={clubColorsHeroStyle(theme.primaryColor, theme.secondaryColor)}
          />
          <div
            className="pointer-events-none absolute -left-16 top-[-20%] h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: "#fff" }}
          />
          <div
            className="pointer-events-none absolute -right-10 bottom-[-30%] h-72 w-72 rounded-full opacity-25 blur-3xl"
            style={{ background: theme.secondaryColor }}
          />
        </>
      ) : null}

      <div className="relative mx-auto flex w-[calc(100%-32px)] max-w-[760px] flex-col items-center px-0 pb-16 pt-8 text-center sm:pb-20 sm:pt-10">
        <PublicClubMark
          logoUrl={logoUrl}
          clubName={clubName}
          accentColor={theme.primaryColor}
          size="lg"
          onDark={heroText.onDark}
        />
        <p
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: heroText.faint }}
        >
          {theme.label}
        </p>
        <h1
          className="mt-3 w-full max-w-[680px] text-[1.85rem] font-semibold leading-tight tracking-tight [overflow-wrap:break-word] sm:text-4xl lg:text-[2.75rem]"
          style={{ color: heroText.text }}
        >
          {theme.title}
        </h1>
        <p
          className="mt-3 w-full max-w-[680px] text-[15px] leading-relaxed [overflow-wrap:break-word] sm:text-base"
          style={{ color: heroText.muted }}
        >
          {theme.subtitle}
        </p>
        {theme.introText ? (
          <p
            className="mt-2 w-full max-w-[640px] text-sm leading-relaxed [overflow-wrap:break-word]"
            style={{ color: heroText.faint }}
          >
            {theme.introText}
          </p>
        ) : null}
        <a
          href="#produits"
          className="mt-6 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-full px-6 text-sm font-semibold shadow-[0_10px_28px_rgba(2,6,23,0.22)] transition hover:opacity-95 sm:w-auto sm:min-w-[220px]"
          style={{ backgroundColor: cta.background, color: cta.color }}
        >
          Voir les produits
        </a>
      </div>
    </header>
  );
}

export function notifyCartChanged() {
  window.dispatchEvent(new Event("obillz-shop-cart"));
}
