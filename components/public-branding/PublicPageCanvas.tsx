"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  fullscreenOverlay,
  pageSurfaceStyle,
  resolvePublicLayout,
} from "@/lib/public-branding/theme";
import type { PublicVisualTheme } from "@/lib/public-branding/types";

type Props = {
  theme: PublicVisualTheme;
  children: ReactNode;
  priority?: boolean;
};

export default function PublicPageCanvas({ theme, children, priority = false }: Props) {
  const layout = resolvePublicLayout(theme);

  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden text-[#0F172A]"
      style={pageSurfaceStyle(layout.palette, layout.immersive)}
    >
      {layout.immersive && theme.bannerUrl ? (
        <div className="pointer-events-none fixed inset-0 -z-10">
          <Image
            src={theme.bannerUrl}
            alt=""
            fill
            priority={priority}
            className="object-cover"
            style={{ objectPosition: layout.objectPosition }}
            sizes="100vw"
            unoptimized={theme.bannerUrl.includes("supabase.co")}
          />
          <div
            className="absolute inset-0"
            style={{ background: fullscreenOverlay(theme.primaryColor, theme.overlayIntensity) }}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
