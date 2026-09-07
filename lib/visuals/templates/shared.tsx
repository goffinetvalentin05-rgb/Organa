"use client";

import type { CSSProperties, ReactNode } from "react";
import { Oswald } from "next/font/google";
import type { VisualFormat, VisualImageFit } from "../types";
import { VISUAL_FORMAT_SIZE } from "../types";

export const visualDisplayFont = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function visualRootStyle(format: VisualFormat): CSSProperties {
  const { width, height } = VISUAL_FORMAT_SIZE[format];
  return {
    width,
    height,
    position: "relative",
    overflow: "hidden",
    color: "#fff",
    fontFamily: visualDisplayFont.style.fontFamily,
    WebkitFontSmoothing: "antialiased",
  };
}

export function CoverPhoto({
  src,
  fit,
  alt,
  fallback,
}: {
  src: string | null;
  fit: VisualImageFit;
  alt: string;
  fallback?: string;
}) {
  if (!src) {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: fallback ?? "linear-gradient(160deg, #1e293b, #020617)",
        }}
      />
    );
  }
  return (
    // Native img: html-to-image + CORS. Pas de next/image ici.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      draggable={false}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: `center ${fit.objectPositionY}%`,
        transform: `scale(${fit.scale})`,
        transformOrigin: "center center",
      }}
    />
  );
}

export function LogoMark({
  src,
  size,
  alt,
  ring,
}: {
  src: string | null;
  size: number;
  alt: string;
  ring?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.96)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: ring ? `0 0 0 4px ${ring}` : "0 12px 30px rgba(0,0,0,0.28)",
        flexShrink: 0,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          crossOrigin="anonymous"
          draggable={false}
          style={{ width: "78%", height: "78%", objectFit: "contain" }}
        />
      ) : (
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            color: "#0F172A",
            letterSpacing: "0.04em",
          }}
        >
          {alt.slice(0, 2).toUpperCase() || "FC"}
        </span>
      )}
    </div>
  );
}

export function VisualLayer({
  children,
  style,
}: {
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function isStory(format: VisualFormat): boolean {
  return format === "story";
}
