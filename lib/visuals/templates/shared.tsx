"use client";

import type { CSSProperties, ReactNode } from "react";
import { Barlow_Condensed } from "next/font/google";
import { mixToward } from "../colors";
import type { VisualFormat, VisualImageFit } from "../types";
import { VISUAL_FORMAT_SIZE } from "../types";

export const visualDisplayFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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

export function isStory(format: VisualFormat): boolean {
  return format === "story";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || "FC").toUpperCase();
}

export function splitDisplayTitle(
  title: string,
  fallbackFirst = "MATCH"
): [string, string] {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [fallbackFirst, "DAY"];
  if (parts.length === 1) return [fallbackFirst, parts[0]];
  return [parts[0], parts.slice(1).join(" ")];
}

export function scoreFontSize(score: string, story: boolean): number {
  const n = Math.max(1, score.trim().length);
  if (n >= 3) return story ? 148 : 108;
  if (n === 2) return story ? 210 : 148;
  return story ? 268 : 188;
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
    // Native img: html-to-image + CORS.
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

/** Zone logo carrée — contain, jamais déformé, fallback initiales. */
export function LogoMark({
  src,
  size,
  alt,
  background = "rgba(255,255,255,0.96)",
  foreground = "#0B1220",
  radius = 0,
  paddingRatio = 0.16,
}: {
  src: string | null;
  size: number;
  alt: string;
  background?: string;
  foreground?: string;
  radius?: number;
  paddingRatio?: number;
}) {
  const pad = Math.round(size * paddingRatio);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        padding: pad,
        boxSizing: "border-box",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          crossOrigin="anonymous"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "center",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 800,
            color: foreground,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          {initials(alt)}
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

export function GrainOverlay({ opacity = 0.12 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        backgroundSize: "180px 180px",
      }}
    />
  );
}

export function HalftoneCorner({
  color,
  size = 420,
  top,
  right,
  bottom,
  left,
}: {
  color: string;
  size?: number;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ position: "absolute", top, right, bottom, left, opacity: 0.35 }}
    >
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 12 }).map((__, col) => {
          const r = Math.max(0.6, 5.2 - (row + col) * 0.28);
          return (
            <circle
              key={`${row}-${col}`}
              cx={10 + col * 16}
              cy={10 + row * 16}
              r={r}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
}

export function MarbleField({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, background: primary }}>
      <div
        style={{
          position: "absolute",
          inset: "-10%",
          background: `
            radial-gradient(ellipse 70% 55% at 18% 12%, ${mixToward(primary, "#FFFFFF", 0.28)} 0%, transparent 58%),
            radial-gradient(ellipse 55% 45% at 88% 22%, ${mixToward(secondary, "#FFFFFF", 0.12)} 0%, transparent 52%),
            radial-gradient(ellipse 80% 50% at 70% 78%, ${mixToward(primary, "#000000", 0.28)} 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 30% 62%, ${mixToward(primary, "#FFFFFF", 0.1)} 0%, transparent 50%)
          `,
        }}
      />
      <svg
        viewBox="0 0 1080 1920"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.22 }}
      >
        <path
          d="M-80 420C180 280 340 620 520 540C760 430 880 220 1180 360"
          fill="none"
          stroke={mixToward(primary, "#FFFFFF", 0.45)}
          strokeWidth="90"
          strokeLinecap="round"
        />
        <path
          d="M-40 1280C220 1180 400 1500 640 1410C860 1330 980 1580 1200 1480"
          fill="none"
          stroke={mixToward(secondary, "#FFFFFF", 0.2)}
          strokeWidth="70"
          strokeLinecap="round"
        />
      </svg>
      <GrainOverlay opacity={0.16} />
    </div>
  );
}

export function ArcBurst({
  color,
  size = 520,
  top,
  left,
  right,
  bottom,
  rotate = 0,
}: {
  color: string;
  size?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  rotate?: number;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        transform: `rotate(${rotate}deg)`,
        opacity: 0.9,
      }}
    >
      {[18, 36, 54, 72, 90].map((r) => (
        <path
          key={r}
          d={`M ${100 - r} 100 A ${r} ${r} 0 0 1 ${100 + r} 100`}
          fill="none"
          stroke={color}
          strokeWidth="10"
        />
      ))}
    </svg>
  );
}

export function DiagonalStripes({
  color,
  width = 120,
  right = 0,
  top = 280,
  height = 720,
}: {
  color: string;
  width?: number;
  right?: number;
  top?: number;
  height?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        right,
        top,
        width,
        height,
        overflow: "hidden",
        opacity: 0.55,
        backgroundImage: `repeating-linear-gradient(-32deg, ${color} 0 18px, transparent 18px 36px)`,
      }}
    />
  );
}

export function BrushStroke({
  color,
  width = 70,
  height = 620,
  left = 0,
  top = 360,
  rotate = -8,
}: {
  color: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  rotate?: number;
}) {
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox="0 0 40 200"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left,
        top,
        transform: `rotate(${rotate}deg)`,
        opacity: 0.85,
      }}
    >
      <path
        d="M18 4C28 18 8 40 22 62C34 82 6 104 20 128C32 150 10 172 22 196"
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const TORN_PHOTO_CLIP =
  "polygon(0% 6%, 7% 2%, 16% 7%, 28% 3%, 41% 8%, 54% 2%, 67% 7%, 79% 3%, 91% 6%, 100% 3%, 100% 100%, 0% 100%)";
