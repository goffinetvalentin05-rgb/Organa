"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import PublicClubMark from "@/components/public/PublicClubMark";
import {
  bannerOverlay,
  clubColorsHeroStyle,
  resolvePublicLayout,
} from "@/lib/public-branding/theme";
import type { PublicVisualTheme } from "@/lib/public-branding/types";

type Props = {
  clubName: string;
  logoUrl: string | null;
  theme: PublicVisualTheme;
  children?: ReactNode;
};

export default function PublicBrandingHero({ clubName, logoUrl, theme, children }: Props) {
  const { style, heroText, objectPosition } = resolvePublicLayout(theme);

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
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: heroText.faint }}
        >
          {theme.label}
        </p>
        <div className="mt-4">
          <PublicClubMark
            logoUrl={logoUrl}
            clubName={clubName}
            accentColor={theme.primaryColor}
            size="lg"
            onDark={heroText.onDark}
          />
        </div>
        <h1
          className="mt-4 w-full max-w-[680px] text-[1.85rem] font-semibold leading-tight tracking-tight [overflow-wrap:break-word] sm:text-4xl lg:text-[2.75rem]"
          style={{ color: heroText.text }}
        >
          {theme.title}
        </h1>
        {theme.subtitle ? (
          <p
            className="mt-3 w-full max-w-[560px] text-[15px] leading-relaxed [overflow-wrap:break-word] sm:text-base"
            style={{ color: heroText.muted }}
          >
            {theme.subtitle}
          </p>
        ) : null}
        {theme.introText ? (
          <p
            className="mt-2 w-full max-w-[560px] text-sm leading-relaxed [overflow-wrap:break-word]"
            style={{ color: heroText.faint }}
          >
            {theme.introText}
          </p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
